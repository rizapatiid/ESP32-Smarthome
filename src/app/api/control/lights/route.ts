import { NextResponse } from "next/server";
import {
  getAllConfiguredLights,
  insertConfiguredLight,
  updateConfiguredLightName,
  deleteConfiguredLight,
  setSystemSetting,
  getSystemSetting,
} from "@/lib/database/mysql";
import { getSimulatedLampState } from "@/lib/simulation/simulator";
import { SmartLight } from "@/types/iot";

export const dynamic = "force-dynamic";

/**
 * GET /api/control/lights — Ambil daftar semua lampu dari tabel configured_lights di MySQL
 */
export async function GET() {
  try {
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");
    let lights = await getAllConfiguredLights();

    // Jika mode simulasi, sinkronkan status pin terkini dari simulator engine
    if (mode === "simulation") {
      lights = lights.map((l) => ({
        ...l,
        state: getSimulatedLampState(l.pin),
      }));
    }

    return NextResponse.json({ success: true, lights });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/control/lights — Tambah, Edit Nama, atau Hapus lampu langsung di tabel configured_lights MySQL
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as "add" | "rename" | "delete" | "update_all";

    if (action === "add") {
      const name = String(body.name || "").trim() || "Lampu Baru";
      const pin = typeof body.pin === "number" ? body.pin : 4;
      const newId = `lamp-${Date.now()}`;

      const newLight: SmartLight = {
        id: newId,
        name,
        pin,
        state: false,
        isDefault: false,
      };

      await insertConfiguredLight(newLight);
    } else if (action === "rename") {
      const id = String(body.id || "");
      const newName = String(body.name || "").trim();
      if (!id || !newName) {
        return NextResponse.json(
          { success: false, error: "ID dan nama baru wajib diisi" },
          { status: 400 }
        );
      }
      await updateConfiguredLightName(id, newName);
    } else if (action === "delete") {
      const id = String(body.id || "");
      if (!id) {
        return NextResponse.json({ success: false, error: "ID lampu wajib diisi" }, { status: 400 });
      }
      await deleteConfiguredLight(id);
    }

    // Ambil daftar lampu terbaru dari tabel MySQL
    const updatedLights = await getAllConfiguredLights();

    // Backup ke system_settings juga untuk redundansi
    try {
      await setSystemSetting("configured_lights", JSON.stringify(updatedLights));
    } catch {}

    return NextResponse.json({
      success: true,
      lights: updatedLights,
      message: "Konfigurasi lampu berhasil diperbarui di database",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
