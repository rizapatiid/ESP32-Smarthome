# Protokol Auto Device Discovery (NEXHOME_UDP_V1)

Dokumentasi ini merinci spesifikasi teknis protokol penemuan otomatis perangkat ESP32 di jaringan Wi-Fi lokal menggunakan mekanisme UDP Broadcast.

---

## 1. Arsitektur & Prinsip Kerja

```
+------------------+                    +--------------------+
|  Browser Frontend|                    |   ESP32 Hardware   |
+--------+---------+                    +---------+----------+
         |                                        |
         | (1) POST /api/discovery/scan           |
         v                                        |
+------------------+                              |
|  Next.js Backend |                              |
+--------+---------+                              |
         |                                        |
         | (2) UDP Broadcast (255.255.255.255:8266)|
         |     {"cmd":"DISCOVER_SMARTHOME", ...}  |
         +--------------------------------------->| (Mendengarkan port 8266)
         |                                        |
         | (3) UDP Unicast Response               |
         |     {"cmd":"DISCOVER_RESP", ...}       |
         |<---------------------------------------+
         |
         | (4) Validasi IP & Simpan ke MySQL
         v
+------------------+
|  Browser Frontend| (5) Render daftar perangkat ditemukan
+------------------+
```

---

## 2. Spesifikasi Paket Data

### A. Broadcast Request (Backend -> ESP32)
Dikirim oleh backend Node.js ke alamat broadcast `255.255.255.255` pada port `8266`.

Payload JSON:
```json
{
  "cmd": "DISCOVER_SMARTHOME",
  "protocol": "NEXHOME_UDP_V1",
  "timestamp": 1771234567890
}
```

### B. Unicast Response (ESP32 -> Backend)
Dikirimkan oleh ESP32 secara langsung (unicast) ke IP dan Port pengirim broadcast.

Payload JSON:
```json
{
  "cmd": "DISCOVER_RESP",
  "protocol": "NEXHOME_UDP_V1",
  "deviceId": "esp32-smarthome-01",
  "deviceName": "SmartHome Living Room",
  "deviceType": "ESP32_DEV_KIT_V1",
  "ipAddress": "192.168.1.150",
  "port": 80,
  "firmwareVersion": "1.0.0",
  "capabilities": ["dht22", "bh1750", "led"],
  "uptime": 3600
}
```

---

## 3. Keamanan & Proteksi SSRF

1. **Batas Jaringan Lokal (Local Subnet Only)**:
   Backend Next.js memvalidasi bahwa alamat IP yang dilaporkan oleh paket discovery berada di dalam subnet IP privat yang sah:
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
   - `127.0.0.1` (Local Simulator)
2. **Tidak Ada Rahasia yang Ditransmisikan**:
   Respons discovery tidak pernah memuat SSID, password Wi-Fi, maupun kredensial database.
3. **Pemeriksaan Kesehatan (Health Check Handshake)**:
   Setelah perangkat dipilih oleh user, backend melakukan verifikasi `GET /api/status` melalui HTTP untuk memastikan perangkat aktif dan merespons dengan benar sebelum ditetapkan sebagai perangkat aktif.
