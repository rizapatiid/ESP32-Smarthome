import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download");
    const customSsid = searchParams.get("ssid");
    const customPassword = searchParams.get("password");

    const filePath = path.join(process.cwd(), "firmware", "esp32-smarthome", "esp32-smarthome.ino");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "File firmware tidak ditemukan pada server." },
        { status: 404 }
      );
    }

    let code = fs.readFileSync(filePath, "utf-8");

    // Ganti SSID & Password jika diberikan
    if (customSsid) {
      code = code.replace(
        /const char\* WIFI_SSID\s*=\s*"[^"]*";/,
        `const char* WIFI_SSID     = "${customSsid.replace(/"/g, '\\"')}";`
      );
    }
    if (customPassword) {
      code = code.replace(
        /const char\* WIFI_PASSWORD\s*=\s*"[^"]*";/,
        `const char* WIFI_PASSWORD = "${customPassword.replace(/"/g, '\\"')}";`
      );
    }

    // Jika parameter download=1, kembalikan sebagai file attachment
    if (download === "1" || download === "true") {
      return new Response(code, {
        status: 200,
        headers: {
          "Content-Type": "text/x-arduino; charset=utf-8",
          "Content-Disposition": 'attachment; filename="esp32-smarthome.ino"',
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({
      success: true,
      filename: "esp32-smarthome.ino",
      code,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
