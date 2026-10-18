import { NextResponse } from "next/server";
import {
  getSystemSetting,
  getDeviceById,
  saveSensorReading,
  updateDeviceStatus,
} from "@/lib/database/mysql";
import { getSimulatedSensorData } from "@/lib/simulation/simulator";
import { fetchEsp32Sensors } from "@/lib/esp32/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");
    const activeDeviceId = await getSystemSetting(
      "active_device_id",
      mode === "simulation" ? "sim-esp32-01" : ""
    );

    // 1. MODE SIMULASI
    if (mode === "simulation" || activeDeviceId === "sim-esp32-01") {
      const data = getSimulatedSensorData();

      // Simpan pembacaan simulasi ke MySQL (hanya sesekali atau tiap pembacaan)
      await saveSensorReading({
        deviceId: "sim-esp32-01",
        temperature: data.temperature,
        humidity: data.humidity,
        lightLux: data.lightLux,
        isSimulated: true,
      });

      return NextResponse.json({
        success: true,
        mode: "simulation",
        deviceId: "sim-esp32-01",
        isOnline: true,
        data,
      });
    }

    // 2. MODE REAL PERANGKAT NYATA
    if (!activeDeviceId) {
      return NextResponse.json(
        {
          success: false,
          mode: "real",
          isOnline: false,
          error: "Belum ada perangkat ESP32 yang terhubung. Silakan lakukan scan di menu Perangkat.",
        },
        { status: 400 }
      );
    }

    const device = await getDeviceById(activeDeviceId);
    if (!device || !device.lastIp) {
      return NextResponse.json(
        {
          success: false,
          mode: "real",
          isOnline: false,
          error: `Perangkat ${activeDeviceId} tidak ditemukan atau tidak memiliki alamat IP.`,
        },
        { status: 404 }
      );
    }

    const res = await fetchEsp32Sensors(device.lastIp, 80, 2500);

    if (!res.ok || !res.data) {
      await updateDeviceStatus(device.deviceId, false);
      return NextResponse.json(
        {
          success: false,
          mode: "real",
          isOnline: false,
          error: `Gagal membaca sensor ESP32 (${device.lastIp}): ${res.error || "Perangkat Offline"}`,
        },
        { status: 504 }
      );
    }

    // Berhasil membaca data riil dari ESP32
    await updateDeviceStatus(device.deviceId, true);

    // Simpan ke database MySQL Hostinger
    await saveSensorReading({
      deviceId: device.deviceId,
      temperature: res.data.temperature,
      humidity: res.data.humidity,
      lightLux: res.data.lightLux,
      isSimulated: false,
    });

    return NextResponse.json({
      success: true,
      mode: "real",
      deviceId: device.deviceId,
      deviceName: device.name,
      isOnline: true,
      data: res.data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
