import { NextResponse } from "next/server";
import { performUdpDiscovery } from "@/lib/esp32/discovery";
import { getSystemSetting } from "@/lib/database/mysql";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let timeoutMs = 3500;
    try {
      const body = await req.json();
      if (typeof body.timeoutMs === "number" && body.timeoutMs >= 1000 && body.timeoutMs <= 10000) {
        timeoutMs = body.timeoutMs;
      }
    } catch {
      // jika body kosong, gunakan default 3500
    }

    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");
    const includeSimulation = mode === "simulation";

    const result = await performUdpDiscovery(timeoutMs, includeSimulation);

    return NextResponse.json({
      success: result.success,
      count: result.devices.length,
      devices: result.devices,
      durationMs: result.durationMs,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, devices: [], count: 0, error: message },
      { status: 500 }
    );
  }
}
