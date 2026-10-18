import { NextResponse } from "next/server";
import { getSystemSetting, setSystemSetting } from "@/lib/database/mysql";
import { getSimulatedLampState } from "@/lib/simulation/simulator";
import { SmartLight } from "@/types/iot";

export const dynamic = "force-dynamic";

const DEFAULT_LIGHTS: SmartLight[] = [
  {
    id: "lamp-main",
    name: "Lampu Utama",
    pin: 2,
    state: false,
    isDefault: true,
  },
];

/**
 * GET /api/control/lights — Ambil daftar semua lampu yang terdaftar
 */
export async function GET() {
  try {
    const raw = await getSystemSetting("configured_lights", "");
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");

    let lights: SmartLight[] = DEFAULT_LIGHTS;

    if (raw) {
      try {
        const parsed: SmartLight[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          lights = parsed;
        }
      } catch {
        // Fallback jika JSON rusak
      }
    }

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
 * POST /api/control/lights — Tambah, Edit Nama, atau Hapus lampu
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as "add" | "rename" | "delete" | "update_all";

    // Ambil list lampu saat ini
    let lights: SmartLight[] = DEFAULT_LIGHTS;
    const raw = await getSystemSetting("configured_lights", "");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          lights = parsed;
        }
      } catch {
        // Abaikan parse error, gunakan default
      }
    }

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

      lights.push(newLight);
    } else if (action === "rename") {
      const id = String(body.id || "");
      const newName = String(body.name || "").trim();
      if (!id || !newName) {
        return NextResponse.json(
          { success: false, error: "ID dan nama baru wajib diisi" },
          { status: 400 }
        );
      }

      lights = lights.map((l) => (l.id === id ? { ...l, name: newName } : l));
    } else if (action === "delete") {
      const id = String(body.id || "");
      if (!id) {
        return NextResponse.json({ success: false, error: "ID lampu wajib diisi" }, { status: 400 });
      }

      // Jangan hapus default light (lamp-main)
      lights = lights.filter((l) => l.id !== id || l.isDefault);
    } else if (action === "update_all") {
      if (Array.isArray(body.lights)) {
        lights = body.lights;
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Action tidak dikenali (add / rename / delete / update_all)" },
        { status: 400 }
      );
    }

    // Simpan ke database
    await setSystemSetting("configured_lights", JSON.stringify(lights));

    return NextResponse.json({
      success: true,
      lights,
      message: "Konfigurasi lampu berhasil diperbarui",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
