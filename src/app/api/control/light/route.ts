import { NextResponse } from "next/server";
import {
  getSystemSetting,
  getDeviceById,
  saveDeviceState,
  getDeviceState,
  logControlCommand,
} from "@/lib/database/mysql";
import {
  getSimulatedLampState,
  setSimulatedLampState,
} from "@/lib/simulation/simulator";
import { fetchEsp32LightState, sendEsp32LightCommand } from "@/lib/esp32/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");
    const activeDeviceId = await getSystemSetting("active_device_id", "");

    // 1. JIKA MODE REAL HARDWARE
    if (mode === "real") {
      if (!activeDeviceId || activeDeviceId === "sim-esp32-01") {
        return NextResponse.json({
          success: false,
          mode: "real",
          deviceId: null,
          state: false,
          isSimulated: false,
          error: "Belum ada ESP32 fisik yang terhubung",
        });
      }

      const device = await getDeviceById(activeDeviceId);
      if (!device || !device.lastIp) {
        return NextResponse.json({
          success: false,
          mode: "real",
          deviceId: activeDeviceId,
          state: false,
          isSimulated: false,
          error: "Perangkat aktif tidak ditemukan",
        });
      }

      const res = await fetchEsp32LightState(device.lastIp, 80, 2000);
      if (!res.ok) {
        // Ambil status tersimpan terakhir di MySQL jika ESP32 sedang lambat
        const cached = await getDeviceState(device.deviceId);
        return NextResponse.json({
          success: false,
          mode: "real",
          deviceId: device.deviceId,
          state: cached?.lampState || false,
          isSimulated: false,
          error: res.error,
        });
      }

      await saveDeviceState(device.deviceId, true, Boolean(res.state));

      return NextResponse.json({
        success: true,
        mode: "real",
        deviceId: device.deviceId,
        state: res.state,
        isSimulated: false,
      });
    }

    // 2. JIKA MODE SIMULASI
    const state = getSimulatedLampState();
    return NextResponse.json({
      success: true,
      mode: "simulation",
      deviceId: "sim-esp32-01",
      state,
      isSimulated: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, state: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (typeof body.state !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Payload 'state' (boolean: true/false) wajib diisi." },
        { status: 400 }
      );
    }

    const targetState = body.state;
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");
    const activeDeviceId = await getSystemSetting("active_device_id", "");

    // 1. JIKA MODE REAL HARDWARE
    if (mode === "real") {
      if (!activeDeviceId || activeDeviceId === "sim-esp32-01") {
        return NextResponse.json(
          {
            success: false,
            error: "Mode Real Aktif: Tidak ada perangkat ESP32 fisik terhubung. Silakan hubungkan ESP32 fisik di menu Perangkat.",
          },
          { status: 400 }
        );
      }

      const device = await getDeviceById(activeDeviceId);
      if (!device || !device.lastIp) {
        return NextResponse.json(
          { success: false, error: `Perangkat ${activeDeviceId} tidak memiliki IP terdaftar.` },
          { status: 404 }
        );
      }

      // Kirim HTTP POST ke ESP32 fisik
      const res = await sendEsp32LightCommand(device.lastIp, 80, targetState, 4000);

      if (!res.ok) {
        await logControlCommand({
          deviceId: device.deviceId,
          command: targetState ? "LAMP_ON" : "LAMP_OFF",
          requestedState: targetState,
          confirmedState: null,
          status: "FAILED",
          errorMessage: res.error || "Gagal konfirmasi dari ESP32",
          isSimulated: false,
        });

        return NextResponse.json(
          {
            success: false,
            error: `Gagal mengirim perintah ke ESP32: ${res.error}. Perintah tidak dapat dikonfirmasi.`,
          },
          { status: 504 }
        );
      }

      const confirmed = res.confirmedState ?? targetState;

      await saveDeviceState(device.deviceId, true, confirmed);

      await logControlCommand({
        deviceId: device.deviceId,
        command: targetState ? "LAMP_ON" : "LAMP_OFF",
        requestedState: targetState,
        confirmedState: confirmed,
        status: "SUCCESS",
        isSimulated: false,
      });

      return NextResponse.json({
        success: true,
        mode: "real",
        deviceId: device.deviceId,
        state: confirmed,
        confirmedState: confirmed,
        isSimulated: false,
        message: res.message || "Perintah lampu berhasil dieksekusi dan dikonfirmasi oleh ESP32.",
      });
    }

    // 2. JIKA MODE SIMULASI
    const simResult = setSimulatedLampState(targetState);
    await saveDeviceState("sim-esp32-01", true, targetState);

    await logControlCommand({
      deviceId: "sim-esp32-01",
      command: targetState ? "LAMP_ON" : "LAMP_OFF",
      requestedState: targetState,
      confirmedState: targetState,
      status: "SUCCESS",
      isSimulated: true,
    });

    return NextResponse.json({
      success: true,
      mode: "simulation",
      deviceId: "sim-esp32-01",
      state: simResult.state,
      confirmedState: simResult.confirmedState,
      isSimulated: true,
      message: simResult.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
