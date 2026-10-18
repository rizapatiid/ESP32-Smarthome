import { NextResponse } from "next/server";
import { getDeviceById, getSystemSetting, setSystemSetting, updateDeviceStatus } from "@/lib/database/mysql";
import { fetchEsp32Status } from "@/lib/esp32/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: "deviceId wajib disediakan" },
        { status: 400 }
      );
    }

    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");

    const device = await getDeviceById(deviceId);
    if (!device) {
      return NextResponse.json(
        { success: false, error: `Perangkat dengan ID ${deviceId} tidak ditemukan di database.` },
        { status: 404 }
      );
    }

    // Jika perangkat virtual simulator
    if (deviceId === "sim-esp32-01") {
      if (mode === "real") {
        return NextResponse.json(
          {
            success: false,
            error: "Sistem sedang berada di Mode Real Hardware. Simulator virtual tidak dapat digunakan pada mode real.",
          },
          { status: 400 }
        );
      }
      await setSystemSetting("active_device_id", deviceId);
      await updateDeviceStatus(deviceId, true);
      return NextResponse.json({
        success: true,
        deviceId,
        message: "Perangkat Simulator Virtual berhasil dihubungkan.",
      });
    }

    // Jika perangkat keras riil ESP32, lakukan health-check terlebih dahulu
    if (!device.lastIp) {
      return NextResponse.json(
        { success: false, error: "Perangkat belum memiliki alamat IP yang valid." },
        { status: 400 }
      );
    }

    const health = await fetchEsp32Status(device.lastIp, 80, 3000);
    if (!health.ok) {
      await updateDeviceStatus(deviceId, false);
      return NextResponse.json(
        {
          success: false,
          error: `Gagal menghubungkan ke ESP32 di ${device.lastIp}: ${health.error}. Pastikan ESP32 menyala dan terhubung ke Wi-Fi.`,
        },
        { status: 502 }
      );
    }

    // Health check berhasil! Set sebagai perangkat aktif
    await setSystemSetting("active_device_id", deviceId);
    await updateDeviceStatus(deviceId, true);

    return NextResponse.json({
      success: true,
      deviceId,
      name: device.name,
      ipAddress: device.lastIp,
      message: `Berhasil terhubung ke ${device.name} (${device.lastIp}).`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
