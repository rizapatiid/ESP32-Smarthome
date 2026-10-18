/**
 * ==============================================================================
 * SMARTHOME IoT — FIRMWARE ESP32 DENGAN AUTO DEVICE DISCOVERY (UDP) & HTTP API
 * ==============================================================================
 * 
 * Hardware:
 * - Board: ESP32 DevKit V1 (30 atau 36 pin)
 * - Sensor Suhu & Kelembapan: DHT22 (Pin GPIO 4)
 * - Sensor Cahaya: BH1750 (I2C: SDA GPIO 21, SCL GPIO 22, VCC 3.3V, ADDR GND)
 * - Lampu Simulasi (LED): GPIO 2 (Built-in LED) / GPIO 16 (External LED)
 * 
 * Library yang dibutuhkan di Arduino IDE:
 * 1. DHT sensor library by Adafruit (dan Adafruit Unified Sensor)
 * 2. hp_BH1750 by Stefan Sell atau Claws/BH1750
 * 3. ArduinoJson by Benoit Blanchon (Versi 6.x atau 7.x)
 * 4. WiFi & WebServer & WiFiUdp (Sudah include di ESP32 Core)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>
#include <ArduinoJson.h>

// ==============================================================================
// 1. KONFIGURASI WI-FI & IDENTITAS PERANGKAT
// ==============================================================================
const char* WIFI_SSID     = "Nama_WiFi_Anda";      // Ganti dengan SSID Wi-Fi lokal
const char* WIFI_PASSWORD = "Password_WiFi_Anda";  // Ganti dengan Password Wi-Fi

const char* DEVICE_ID        = "esp32-smarthome-01";
const char* DEVICE_NAME      = "SmartHome Living Room";
const char* DEVICE_TYPE      = "ESP32_DEV_KIT_V1";
const char* FIRMWARE_VERSION = "1.0.0";
const char* PROTOCOL_ID      = "NEXHOME_UDP_V1";

// ==============================================================================
// 2. PIN HARDWARE
// ==============================================================================
#define DHTPIN 4
#define DHTTYPE DHT22
#define LED_PIN 2            // GPIO 2 (Built-in LED ESP32)
#define I2C_SDA_PIN 21       // SDA BH1750
#define I2C_SCL_PIN 22       // SCL BH1750

const unsigned int UDP_PORT  = 8266;
const unsigned int HTTP_PORT = 80;

// ==============================================================================
// 3. OBJEK & VARIABEL GLOBAL
// ==============================================================================
WebServer server(HTTP_PORT);
WiFiUDP udp;
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

bool bh1750Available = false;
bool lampState = false;

float currentTemperature = 0.0;
float currentHumidity = 0.0;
float currentLightLux = 0.0;
bool dhtValid = false;

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_READ_INTERVAL = 2000; // Baca sensor tiap 2 detik

// ==============================================================================
// 4. HELPER JSON RESPONSE
// ==============================================================================
void sendJsonResponse(int code, const String& jsonStr) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(code, "application/json", jsonStr);
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

// ==============================================================================
// 5. HTTP ENDPOINTS
// ==============================================================================

// GET /api/status
void handleStatus() {
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["deviceType"] = DEVICE_TYPE;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["port"] = HTTP_PORT;
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiRssi"] = WiFi.RSSI();

  JsonArray caps = doc.createNestedArray("capabilities");
  caps.add("dht22");
  caps.add("bh1750");
  caps.add("led");

  String response;
  serializeJson(doc, response);
  sendJsonResponse(200, response);
}

// GET /api/sensors
void handleSensors() {
  StaticJsonDocument<512> doc;
  
  if (dhtValid) {
    doc["temperature"] = serialized(String(currentTemperature, 1));
    doc["humidity"] = serialized(String(currentHumidity, 1));
  } else {
    doc["temperature"] = nullptr;
    doc["humidity"] = nullptr;
  }

  if (bh1750Available) {
    doc["lightLux"] = serialized(String(currentLightLux, 1));
  } else {
    doc["lightLux"] = nullptr;
  }

  JsonObject sensorStatus = doc.createNestedObject("sensorStatus");
  sensorStatus["dht22"] = dhtValid;
  sensorStatus["bh1750"] = bh1750Available;

  doc["timestamp"] = millis();

  String response;
  serializeJson(doc, response);
  sendJsonResponse(200, response);
}

// GET /api/light
void handleGetLight() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["state"] = lampState;
  doc["gpio"] = LED_PIN;

  String response;
  serializeJson(doc, response);
  sendJsonResponse(200, response);
}

// POST /api/light
void handlePostLight() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "{\"success\":false,\"error\":\"Body kosong\"}");
    return;
  }

  String body = server.arg("plain");
  StaticJsonDocument<256> docIn;
  DeserializationError error = deserializeJson(docIn, body);

  if (error) {
    sendJsonResponse(400, "{\"success\":false,\"error\":\"Format JSON tidak valid\"}");
    return;
  }

  if (!docIn.containsKey("state")) {
    sendJsonResponse(400, "{\"success\":false,\"error\":\"Field 'state' boolean wajib diisi\"}");
    return;
  }

  bool requestedState = docIn["state"];
  lampState = requestedState;

  // Terapkan ke pin hardware
  digitalWrite(LED_PIN, lampState ? HIGH : LOW);

  StaticJsonDocument<256> docOut;
  docOut["success"] = true;
  docOut["state"] = lampState;
  docOut["confirmedState"] = lampState;
  docOut["message"] = lampState ? "LED berhasil dinyalakan" : "LED berhasil dimatikan";

  String response;
  serializeJson(docOut, response);
  sendJsonResponse(200, response);
}

// ==============================================================================
// 6. AUTO DEVICE DISCOVERY (UDP RESPONDER)
// ==============================================================================
void checkUdpDiscovery() {
  int packetSize = udp.parsePacket();
  if (packetSize <= 0) return;

  char incomingPacket[255];
  int len = udp.read(incomingPacket, 254);
  if (len > 0) {
    incomingPacket[len] = '\0';
  }

  StaticJsonDocument<256> reqDoc;
  DeserializationError err = deserializeJson(reqDoc, incomingPacket);
  if (err) return;

  // Verifikasi pesan discovery
  const char* cmd = reqDoc["cmd"];
  if (cmd && strcmp(cmd, "DISCOVER_SMARTHOME") == 0) {
    // Siapkan respons identitas perangkat
    StaticJsonDocument<512> respDoc;
    respDoc["cmd"] = "DISCOVER_RESP";
    respDoc["protocol"] = PROTOCOL_ID;
    respDoc["deviceId"] = DEVICE_ID;
    respDoc["deviceName"] = DEVICE_NAME;
    respDoc["deviceType"] = DEVICE_TYPE;
    respDoc["ipAddress"] = WiFi.localIP().toString();
    respDoc["port"] = HTTP_PORT;
    respDoc["firmwareVersion"] = FIRMWARE_VERSION;
    respDoc["uptime"] = millis() / 1000;

    JsonArray caps = respDoc.createNestedArray("capabilities");
    caps.add("dht22");
    caps.add("bh1750");
    caps.add("led");

    String respStr;
    serializeJson(respDoc, respStr);

    // Kirim respons balik secara unicast ke IP & port pengirim broadcast
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write((const uint8_t*)respStr.c_str(), respStr.length());
    udp.endPacket();

    Serial.print("[UDP Discovery] Mengirim identitas ke: ");
    Serial.print(udp.remoteIP());
    Serial.print(":");
    Serial.println(udp.remotePort());
  }
}

// ==============================================================================
// 7. SETUP & LOOP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Memulai SmartHome IoT ESP32 Firmware ---");

  // Inisialisasi LED Pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Inisialisasi I2C & Sensor
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  dht.begin();

  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    bh1750Available = true;
    Serial.println("[Sensor] BH1750 berhasil diinisialisasi.");
  } else {
    Serial.println("[Sensor] BH1750 tidak terdeteksi!");
  }

  // Koneksi ke Wi-Fi
  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Terhubung!");
    Serial.print("[Wi-Fi] Alamat IP ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Gagal terhubung Wi-Fi. Masuk ke mode retry.");
  }

  // Inisialisasi UDP Discovery Listener
  udp.begin(UDP_PORT);
  Serial.print("[UDP] Discovery listener aktif pada port: ");
  Serial.println(UDP_PORT);

  // Daftarkan Route HTTP Server
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/sensors", HTTP_GET, handleSensors);
  server.on("/api/light", HTTP_GET, handleGetLight);
  server.on("/api/light", HTTP_POST, handlePostLight);
  server.on("/api/light", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/sensors", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("[HTTP] WebServer aktif pada port 80.");
}

void loop() {
  // Tangani koneksi HTTP dan pesan UDP
  server.handleClient();
  checkUdpDiscovery();

  // Pembacaan sensor periodik non-blocking
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = now;

    // Baca DHT22
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t) && !isnan(h)) {
      currentTemperature = t;
      currentHumidity = h;
      dhtValid = true;
    } else {
      dhtValid = false;
    }

    // Baca BH1750
    if (bh1750Available) {
      float lux = lightMeter.readLightLevel();
      if (lux >= 0) {
        currentLightLux = lux;
      }
    }
  }

  // Cek jika Wi-Fi terputus, coba sambung ulang
  if (WiFi.status() != WL_CONNECTED && (now % 10000 < 50)) {
    Serial.println("[Wi-Fi] Mencoba menyambung kembali...");
    WiFi.reconnect();
  }
}
