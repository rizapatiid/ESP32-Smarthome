import { NextResponse } from "next/server";
import { testDatabaseConnection, getSystemSetting, getDeviceById } from "@/lib/database/mysql";
import { fetchEsp32Status } from "@/lib/esp32/client";
import { OperatingMode } from "@/types/iot";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = ((await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation")) as OperatingMode) || "simulation";
  const activeDeviceId = await getSystemSetting("active_device_id", mode === "simulation" ? "sim-esp32-01" : "");

  // Cek database
  const dbHealth = await testDatabaseConnection();

  // Cek active device
  let activeDeviceName: string | null = null;
  let activeDeviceIp: string | null = null;
  let isOnline = false;

  if (mode === "simulation") {
    activeDeviceName = "ESP32 Virtual Simulator";
    activeDeviceIp = "127.0.0.1";
    isOnline = true;
  } else if (activeDeviceId) {
    const dev = await getDeviceById(activeDeviceId);
    if (dev) {
      activeDeviceName = dev.name;
      activeDeviceIp = dev.lastIp;
      if (dev.lastIp) {
        const ping = await fetchEsp32Status(dev.lastIp, 80, 2000);
        isOnline = ping.ok;
      }
    }
  }

  return NextResponse.json({
    mode,
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbHealth.ok ? "CONNECTED" : "DISCONNECTED",
      host: dbHealth.host,
      port: dbHealth.port,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
    activeDevice: {
      deviceId: activeDeviceId || null,
      deviceName: activeDeviceName,
      ipAddress: activeDeviceIp,
      isOnline,
      lastPingAt: new Date().toISOString(),
    },
  });
}
