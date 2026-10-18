import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllConfiguredLights } from "@/lib/database/mysql";

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

    // Ambil data konfigurasi lampu/relay langsung dari database MySQL
    const configuredLights = await getAllConfiguredLights();

    // 1. Ganti SSID & Password jika diberikan
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

    // 2. Sinkronkan Daftar Relay / Lampu dari Database MySQL ke Kode Firmware ESP32
    if (configuredLights && configuredLights.length > 0) {
      const defaultLight = configuredLights.find((l) => l.isDefault) || configuredLights[0];
      const relayCommentLines = configuredLights
        .map((l, i) => ` *   ${i + 1}. ${l.name}: GPIO ${l.pin} (${l.isDefault ? "Lampu Utama / Default" : "Relay Eksternal"})`)
        .join("\n");

      // Replace header comment
      code = code.replace(
        /\* - Lampu Simulasi \(LED\):[^\n]*/,
        `* - Modul Relay Lampu (Tersinkron Database MySQL 'configured_lights'):\n${relayCommentLines}`
      );

      // Definisikan pin hardware
      const pinDefines = configuredLights
        .map((l, i) => `#define RELAY_${i + 1}_PIN ${l.pin}        // ${l.name} (${l.isDefault ? "Default" : "Eksternal"})`)
        .join("\n");
      const pinArray = configuredLights.map((l) => l.pin).join(", ");

      const hardwarePinsBlock = `// ==============================================================================
// 2. PIN HARDWARE (TERSINKRONISASI DATABASE MYSQL 'configured_lights')
// ==============================================================================
#define DHTPIN 4
#define DHTTYPE DHT22
#define LED_PIN ${defaultLight.pin}             // GPIO ${defaultLight.pin} (${defaultLight.name})
#define I2C_SDA_PIN 21        // SDA BH1750
#define I2C_SCL_PIN 22        // SCL BH1750

// Pin Relay Lampu dari Database (${configuredLights.length} Relay Aktif):
${pinDefines}

const int CONFIGURED_RELAY_PINS[] = { ${pinArray} };
const int NUM_CONFIGURED_RELAYS = ${configuredLights.length};`;

      code = code.replace(
        /\/\/ ==============================================================================\s*\n\/\/ 2\. PIN HARDWARE[\s\S]*?(?=\nconst unsigned int UDP_PORT)/,
        hardwarePinsBlock + "\n\n"
      );

      // Update setup() untuk inisialisasi semua pin relay
      const setupRelayBlock = `  // Inisialisasi Seluruh Pin Relay Lampu dari Database MySQL (${configuredLights.length} Relay)
  for (int i = 0; i < NUM_CONFIGURED_RELAYS; i++) {
    pinMode(CONFIGURED_RELAY_PINS[i], OUTPUT);
    digitalWrite(CONFIGURED_RELAY_PINS[i], LOW);
  }
  Serial.println("[Relay] ${configuredLights.length} Pin Relay berhasil diinisialisasi dari database MySQL.");`;

      code = code.replace(
        /  \/\/ Inisialisasi LED Pin\s*\n  pinMode\(LED_PIN, OUTPUT\);\s*\n  digitalWrite\(LED_PIN, LOW\);/,
        setupRelayBlock
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
      configuredLightsCount: configuredLights.length,
      lights: configuredLights,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
