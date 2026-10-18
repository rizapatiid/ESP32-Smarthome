import { NextResponse } from "next/server";
import { getDevices, getSystemSetting, updateDeviceStatus } from "@/lib/database/mysql";
import { fetchEsp32Status } from "@/lib/esp32/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const devices = await getDevices();
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");
    const activeDeviceId = await getSystemSetting("active_device_id", "");

    // Cek status kesehatan live untuk perangkat nyata
    const verifiedDevices = await Promise.all(
      devices.map(async (dev) => {
        if (dev.deviceId === "sim-esp32-01") {
          return {
            ...dev,
            isOnline: mode === "simulation",
            isActive: mode === "simulation" && (activeDeviceId === dev.deviceId || !activeDeviceId),
          };
        }

        if (mode === "real" && dev.lastIp) {
          const health = await fetchEsp32Status(dev.lastIp, 80, 1500);
          const isOnline = health.ok;
          if (isOnline !== dev.isOnline) {
            await updateDeviceStatus(dev.deviceId, isOnline);
          }
          return {
            ...dev,
            isOnline,
            isActive: activeDeviceId === dev.deviceId,
          };
        }

        return {
          ...dev,
          isActive: activeDeviceId === dev.deviceId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      mode,
      activeDeviceId:
        mode === "real" && activeDeviceId === "sim-esp32-01"
          ? null
          : activeDeviceId || (mode === "simulation" ? "sim-esp32-01" : null),
      devices: verifiedDevices,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
