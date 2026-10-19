import { NextResponse } from "next/server";
import {
  getSystemSetting,
  setSystemSetting,
  testDatabaseConnection,
  updateDeviceStatus,
} from "@/lib/database/mysql";
import { OperatingMode } from "@/types/iot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mode = ((await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation")) as OperatingMode) || "simulation";
    const pollInterval = parseInt(
      await getSystemSetting("poll_interval_ms", process.env.NEXT_PUBLIC_POLL_INTERVAL_MS || "2000"),
      10
    );
    const activeDeviceId = await getSystemSetting("active_device_id", "");
    const discoveryTimeout = parseInt(
      await getSystemSetting("discovery_timeout_ms", process.env.DISCOVERY_TIMEOUT_MS || "4000"),
      10
    );

    const dbHealth = await testDatabaseConnection();

    return NextResponse.json({
      success: true,
      settings: {
        mode,
        pollIntervalMs: pollInterval,
        discoveryTimeoutMs: discoveryTimeout,
        activeDeviceId: mode === "real" && activeDeviceId === "sim-esp32-01" ? "" : activeDeviceId,
      },
      databaseInfo: {
        status: dbHealth.ok ? "CONNECTED" : "DISCONNECTED",
        host: dbHealth.host,
        port: dbHealth.port,
        database: process.env.DB_NAME || "smarthome",
        user: process.env.DB_USER || "root",
        passwordMasked: "••••••••••••",
        latencyMs: dbHealth.latencyMs,
      },
      discoveryInfo: {
        udpPort: parseInt(process.env.DISCOVERY_UDP_PORT || "8266", 10),
        broadcastAddress: "255.255.255.255",
        protocol: "NEXHOME_UDP_V1",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.mode && (body.mode === "simulation" || body.mode === "real")) {
      await setSystemSetting("iot_mode", body.mode);

      if (body.mode === "simulation") {
        await setSystemSetting("active_device_id", "sim-esp32-01");
        await updateDeviceStatus("sim-esp32-01", true);
      } else if (body.mode === "real") {
        // Jika beralih ke mode real, lepaskan simulator agar tidak mencemari data riil
        const currentActive = await getSystemSetting("active_device_id", "");
        if (currentActive === "sim-esp32-01") {
          await setSystemSetting("active_device_id", "");
        }
        await updateDeviceStatus("sim-esp32-01", false);
      }
    }

    if (typeof body.pollIntervalMs === "number" && body.pollIntervalMs >= 1000) {
      await setSystemSetting("poll_interval_ms", String(body.pollIntervalMs));
    }

    if (typeof body.discoveryTimeoutMs === "number" && body.discoveryTimeoutMs >= 1000) {
      await setSystemSetting("discovery_timeout_ms", String(body.discoveryTimeoutMs));
    }

    if (typeof body.activeDeviceId === "string") {
      await setSystemSetting("active_device_id", body.activeDeviceId);
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan sistem berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
