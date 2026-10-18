# SmartHome IoT — Sistem Monitoring dan Kontrol Perangkat Rumah Berbasis Website Menggunakan ESP32 dan Wi-Fi Lokal

Aplikasi web modern untuk pemantauan kondisi lingkungan ruangan (suhu, kelembapan, intensitas cahaya) dan kontrol aktuator (LED simulasi lampu) menggunakan mikrokontroler **ESP32** melalui jaringan **Wi-Fi lokal**, dengan persistensi data telemetri dan log kontrol ke database eksternal **Hostinger MySQL**.

---

## 🌟 Fitur Utama & Keunggulan

1. **Auto Device Discovery (UDP Broadcast)**:
   - Pencarian otomatis perangkat ESP32 di jaringan Wi-Fi lokal tanpa perlu memasukkan alamat IP secara manual.
   - Menggunakan protokol `NEXHOME_UDP_V1` pada port UDP `8266`.
   - Mengidentifikasi perangkat berdasarkan `deviceId` unik, nama, tipe, firmware, dan kapabilitas sensor.
2. **Dual Mode (Simulasi vs Perangkat Riil)**:
   - **Mode Simulasi**: Berjalan penuh langsung di browser tanpa perangkat fisik (cocok untuk pengujian antarmuka dan demo awal).
   - **Mode Real Hardware**: Terhubung langsung ke REST API ESP32 fisik di jaringan lokal. Data kegagalan ditandai dengan jujur (tidak memalsukan data riil).
3. **Database MySQL Eksternal (Hostinger)**:
   - Penyimpanan riwayat telemetri time-series (`sensor_readings`) dan log perintah kontrol (`control_logs`).
   - Dilengkapi pengukuran latency koneksi database real-time dan proteksi kredensial.
4. **Desain Antarmuka Minimalis & Modern**:
   - Mobile-first, responsif, bersih, tanpa animasi berlebihan.
   - Grafik interaktif real-time menggunakan **Recharts**.
   - Ikon modern dari **Lucide React**.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend & Backend**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Visualisasi Grafik**: Recharts
- **Database**: MySQL eksternal (Hostinger Cloud)
- **Komunikasi Hardware**: HTTP REST API (Wi-Fi lokal)
- **Discovery Service**: Node.js UDP Broadcast Socket (`dgram`)
- **Firmware**: Arduino IDE / ESP32 Arduino Core
- **Sensor & Aktuator**: DHT22 (Suhu & Kelembapan), BH1750 (Cahaya Lux), LED (Simulasi Lampu)

---

## 📁 Struktur Direktori Proyek

```
smarthome/
├── docs/
│   ├── DISCOVERY_PROTOCOL.md    # Spesifikasi protokol UDP Discovery
│   └── HARDWARE_CIRCUIT.md      # Panduan pengkabelan & diagram pinout
├── firmware/
│   └── esp32-smarthome/
│       └── esp32-smarthome.ino  # Kode firmware ESP32 lengkap
├── prisma/
│   └── schema.prisma            # Definisi skema tabel Prisma
├── public/                      # Asset statis
├── scripts/
│   ├── discovery-daemon.js      # Background daemon UDP discovery
│   └── migrate.js               # Script migrasi tabel ke MySQL Hostinger
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── control/         # Endpoint kontrol lampu & riwayat
│   │   │   ├── db/status/       # Uji koneksi MySQL Hostinger
│   │   │   ├── devices/         # Manajemen & koneksi perangkat
│   │   │   ├── discovery/scan/  # Trigger scan UDP broadcast
│   │   │   ├── sensors/         # Telemetri live & riwayat sensor
│   │   │   ├── settings/        # Manajemen preferensi sistem
│   │   │   └── status/          # Ringkasan status sistem
│   │   ├── devices/             # Halaman Manajemen & Scan Perangkat
│   │   ├── history/
│   │   │   ├── controls/        # Halaman Riwayat Kontrol
│   │   │   └── sensors/         # Halaman Riwayat Sensor
│   │   ├── settings/            # Halaman Pengaturan & Diagnosa DB
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Halaman Dashboard Utama
│   ├── components/
│   │   ├── dashboard/           # Komponen kartu metrik, kontrol, grafik
│   │   └── layout/              # Navbar responsif & status badges
│   ├── lib/
│   │   ├── database/mysql.ts    # Pool koneksi MySQL Hostinger
│   │   ├── esp32/
│   │   │   ├── client.ts        # HTTP client dengan proteksi SSRF
│   │   │   └── discovery.ts     # Layanan broadcast UDP
│   │   └── simulation/
│   │       └── simulator.ts     # Generator data telemetri simulasi
│   └── types/
│       └── iot.ts               # Definisi antarmuka TypeScript
├── .env.example                 # Template environment variables
├── .env.local                   # Kredensial lokal (termasuk Hostinger DB)
├── package.json
└── README.md
```

---

## 🚀 Panduan Menjalankan Aplikasi Secara Lokal

### 1. Persyaratan Sistem
- Node.js versi 18.x atau lebih baru (direkomendasikan Node.js 20+)
- npm versi 9+

### 2. Instalasi Dependensi
Pastikan berada di direktori proyek:
```bash
npm install
```

### 3. Konfigurasi Environment Variable
File `.env.local` telah dikonfigurasikan dengan kredensial Hostinger MySQL Anda:
```env
DATABASE_URL="mysql://u500072377_smarthome:Smarthm1234@srv1412.hstgr.io:3306/u500072377_smarthome"
DB_HOST="srv1412.hstgr.io"
DB_PORT="3306"
DB_USER="u500072377_smarthome"
DB_PASSWORD="Smarthm1234"
DB_NAME="u500072377_smarthome"
IOT_MODE="simulation"
DISCOVERY_UDP_PORT="8266"
```

### 4. Eksekusi Migrasi Tabel Database
Jalankan migrasi skema tabel ke MySQL Hostinger:
```bash
npm run migrate
```
*Script ini akan memverifikasi koneksi dan membuat tabel `devices`, `sensor_readings`, `device_states`, `control_logs`, dan `system_settings`.*

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 Panduan Pengujian

### A. Pengujian Mode Simulasi (Tanpa Hardware Fisik)
1. Buka halaman utama [http://localhost:3000](http://localhost:3000).
2. Perhatikan banner mode menampilkan **MODE SIMULASI**.
3. Kartu Suhu, Kelembapan, dan Intensitas Cahaya akan berfluktuasi secara otomatis setiap 2 detik.
4. Klik tombol **Nyalakan Lampu (ON)** / **Matikan Lampu (OFF)**. Perhatikan status lampu berubah dan log kontrol tercatat di tabel riwayat.
5. Kunjungi halaman **Riwayat Sensor** dan **Riwayat Kontrol** untuk memeriksa data yang tersimpan di MySQL Hostinger.

### B. Pengujian Mode Real Hardware (Dengan ESP32 Fisik)
1. **Rangkaian Hardware**:
   - Hubungkan pin DATA DHT22 ke **GPIO 4**.
   - Hubungkan BH1750 ke jalur I2C (**SDA: GPIO 21**, **SCL: GPIO 22**, **VCC: 3.3V**, **GND: GND**).
   - Hubungkan LED indikator ke **GPIO 2** (atau gunakan onboard blue LED ESP32).
2. **Flash Firmware**:
   - Buka file `firmware/esp32-smarthome/esp32-smarthome.ino` di Arduino IDE.
   - Ubah `WIFI_SSID` dan `WIFI_PASSWORD` sesuai hotspot Wi-Fi laptop/ruangan Anda.
   - Upload firmware ke board ESP32 DevKit V1.
   - Buka Serial Monitor pada baud rate `115200` untuk melihat alamat IP lokal ESP32.
3. **Auto Discovery**:
   - Buka halaman **Perangkat** di website.
   - Klik tombol **Scan Perangkat ESP32**.
   - Sistem akan memindai melalui UDP broadcast dan menampilkan ESP32 yang terdeteksi beserta alamat IP lokalnya.
   - Klik tombol **Hubungkan** pada perangkat yang ditemukan.
4. **Beralih ke Mode Real**:
   - Buka menu **Pengaturan**, pilih **Mode Real Hardware (ESP32)**, lalu klik **Simpan Perubahan**.
   - Kembali ke Dashboard: sensor kini membaca suhu, kelembapan, dan lux asli dari sensor fisik Anda!

---

## 🔒 Keamanan & Praktik Terbaik

- **Proteksi SSRF (Server-Side Request Forgery)**: Backend Next.js secara ketat memvalidasi alamat IP target sebelum melakukan HTTP fetch, hanya mengizinkan subnet lokal privat (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`, `127.0.0.1`).
- **Kredensial Aman**: Password database tidak pernah diekspos ke frontend (selalu dimasking sebagai `••••••••••••`).
- **Toleransi Gangguan**: Jika ESP32 mati atau Wi-Fi putus, sistem segera menandai status **OFFLINE** tanpa membuat aplikasi web crash.

---

## 🎓 Demonstrasi untuk Tugas Kuliah

Saat mempresentasikan proyek ini:
1. Tunjukkan arsitektur modular yang rapi (Next.js App Router + Node.js Backend + MySQL Hostinger + ESP32).
2. Tunjukkan keunggulan **Auto Device Discovery**: perangkat baru langsung muncul di tabel tanpa konfigurasi manual IP statis.
3. Tunjukkan transparansi data: mode simulasi diberi tanda jelas terpisah dari mode real sensor DHT22/BH1750.
4. Tunjukkan tabel dan grafik historis di halaman Riwayat yang tersimpan langsung di database cloud Hostinger.
