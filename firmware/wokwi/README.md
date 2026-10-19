# Panduan Simulasi ESP32 di Wokwi & Koneksi ke Web SmartHome

Panduan ini memungkinkan Anda menjalankan mikrokontroler ESP32 virtual secara online di Wokwi lengkap dengan sensor DHT22, BH1750, dan LED relay, serta menghubungkannya ke Web Dashboard SmartHome di laptop Anda.

---

## 1. Persiapan di Wokwi

1. Buka browser dan kunjungi: **[https://wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32)**.
2. Buka tab **`diagram.json`** di Wokwi:
   - Salin isi dari file `firmware/wokwi/diagram.json` ke editor Wokwi.
   - Sirkuit ESP32, sensor DHT22, BH1750, dan LED otomatis terpasang dengan rapi.
3. Buka tab **`Library Manager`** di Wokwi (atau tab `libraries.txt`):
   - Tambahkan 4 library berikut:
     - `DHT sensor library`
     - `Adafruit Unified Sensor`
     - `BH1750`
     - `ArduinoJson`
4. Buka tab kode **`sketch.ino`**:
   - Salin kode dari file `firmware/esp32-smarthome/esp32-smarthome.ino` (atau dari tombol **"Program ESP32"** di web dashboard).
   - Pastikan konfigurasi Wi-Fi diatur ke Wi-Fi virtual Wokwi:
     ```cpp
     const char* WIFI_SSID     = "Wokwi-GUEST";
     const char* WIFI_PASSWORD = "";
     ```
5. Klik tombol **Play (▶ Start Simulation)** di Wokwi.
   - Serial Monitor di Wokwi akan mencetak status booting, inisialisasi sensor, dan alamat IP virtual.

---

## 2. Cara Menghubungkan Wokwi ke Web Dashboard di Laptop

Secara default, browser mengisolasi Wokwi di dalam cloud sandbox. Agar Web Dashboard SmartHome Anda di `http://localhost:3000` dapat mendeteksi dan mengontrol ESP32 di Wokwi, gunakan salah satu cara berikut:

### Opsi A: Menggunakan Wokwi IoT Gateway (wokwi-bridge) — Rekomendasi Resmi
Wokwi menyediakan alat bridge gratis agar Wokwi dapat berkomunikasi langsung dengan jaringan lokal laptop:
1. Buka terminal di laptop dan jalankan:
   ```bash
   npx wokwi-bridge
   ```
2. `wokwi-bridge` akan mendeteksi tab Wokwi Anda yang sedang aktif dan membuat jembatan virtual.
3. Di Web Dashboard SmartHome (`http://localhost:3000/devices`), klik **Scan ESP32**.
4. ESP32 dari Wokwi akan otomatis terdeteksi via protokol UDP port 8266 dan dapat dikontrol langsung dari dashboard!

---

### Opsi B: Gunakan Standalone Mock Script (Alternatif Lebih Praktis Tanpa Wokwi)
Jika Anda tidak ingin repot membuka browser Wokwi, Anda dapat menjalankan mock ESP32 bawaan proyek di terminal:
```bash
npm run mock:esp32
```
Script ini 100% mensimulasikan protokol UDP port 8266 dan REST API port 80 persis seperti ESP32 fisik.
