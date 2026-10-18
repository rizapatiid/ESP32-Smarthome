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
    const activeDeviceId = await getSystemSetting("active_device_id", "");

    // =========================================================================
    // 1. JIKA MODE REAL HARDWARE: HANYA BACA DARI ESP32 FISIK
    // =========================================================================
    if (mode === "real") {
      // Pastikan simulator tidak digunakan sama sekali di mode real
      if (!activeDeviceId || activeDeviceId === "sim-esp32-01") {
        return NextResponse.json(
          {
            success: false,
            mode: "real",
            isOnline: false,
            data: null,
            error: "Mode Real Aktif: Belum ada perangkat ESP32 fisik yang terhubung. Silakan buka menu Perangkat untuk memindai dan menghubungkan ESP32 Anda.",
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
            data: null,
            error: `Perangkat ${activeDeviceId} tidak ditemukan atau belum memiliki alamat IP valid di jaringan lokal.`,
          },
          { status: 404 }
        );
      }

      // Ambil data sensor fisik ESP32 via HTTP API
      const res = await fetchEsp32Sensors(device.lastIp, 80, 2500);

      if (!res.ok || !res.data) {
        await updateDeviceStatus(device.deviceId, false);
        return NextResponse.json(
          {
            success: false,
            mode: "real",
            isOnline: false,
            data: null,
            error: `Gagal membaca sensor ESP32 (${device.lastIp}): ${res.error || "Perangkat Offline"}. Pastikan modul DHT22 dan BH1750 terpasang dengan baik.`,
          },
          { status: 504 }
        );
      }

      // Sensor fisik berhasil dibaca
      await updateDeviceStatus(device.deviceId, true);

      // Simpan pembacaan riil ke MySQL Hostinger (is_simulated = false)
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
    }

    // =========================================================================
    // 2. JIKA MODE SIMULASI: GUNAKAN GENERATOR SIMULATOR
    // =========================================================================
    const data = getSimulatedSensorData();

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
