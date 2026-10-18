import { NextResponse } from "next/server";
import { setSystemSetting } from "@/lib/database/mysql";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await setSystemSetting("active_device_id", "");
    return NextResponse.json({
      success: true,
      message: "Koneksi ke perangkat aktif berhasil diputuskan.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
