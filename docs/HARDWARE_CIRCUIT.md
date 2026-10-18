# Panduan Rangkaian Perangkat Keras ESP32 SmartHome IoT

Dokumentasi ini menjelaskan konfigurasi pin, skema rangkaian kabel, dan spesifikasi komponen untuk modul hardware ESP32.

---

## 1. Daftar Komponen

| Komponen | Spesifikasi / Tipe | Fungsi |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32 DevKit V1 (30-pin / 38-pin) | Otak pemrosesan, Wi-Fi client, HTTP Server & UDP Responder |
| **Sensor Suhu & Kelembapan** | DHT22 (AM2302) | Mengukur suhu (°C) dan kelembapan udara (%) |
| **Sensor Intensitas Cahaya** | BH1750 (GY-302) | Mengukur tingkat pencahayaan (Lux) via antarmuka I2C |
| **Simulasi Lampu** | LED 5mm (Biru / Putih) | Indikator visual status aktuator/lampu |
| **Resistor Pembatas Arus LED** | 220 Ω s/d 330 Ω | Mencegah arus berlebih merusak pin GPIO ESP32 |
| **Resistor Pull-up DHT22** | 4.7 kΩ s/d 10 kΩ | Menjaga stabilitas sinyal data 1-Wire (jika modul 4-pin polos) |
| **Breadboard & Jumper** | Breadboard 400/830 titik + Kabel Dupont | Menghubungkan rangkaian tanpa solder |

---

## 2. Tabel Pengkabelan (Pin Mapping)

### A. Sensor DHT22 (Suhu & Kelembapan)
| Pin DHT22 | Pin ESP32 | Keterangan |
| :--- | :--- | :--- |
| **VCC (Pin 1)** | 3V3 (atau VIN 5V) | Catu daya modul sensor |
| **DATA (Pin 2)** | **GPIO 4** | Jalur komunikasi data digital 1-Wire |
| **NC (Pin 3)** | Tidak terhubung | Tidak digunakan pada modul 4-pin |
| **GND (Pin 4)** | **GND** | Ground bersama |

> *Catatan*: Jika Anda menggunakan modul DHT22 PCB (3-pin: VCC, DATA, GND), resistor pull-up 10k sudah terpasang secara onboard.

---

### B. Sensor BH1750 (Cahaya Lux via I2C)
| Pin BH1750 | Pin ESP32 | Keterangan |
| :--- | :--- | :--- |
| **VCC** | **3V3** | Catu daya logika 3.3V (jangan gunakan 5V) |
| **GND** | **GND** | Ground |
| **SCL** | **GPIO 22** | I2C Clock bawaan ESP32 |
| **SDA** | **GPIO 21** | I2C Data bawaan ESP32 |
| **ADDR** | **GND** | Menentukan I2C Address `0x23` (default) |

---

### C. LED Simulasi Lampu
| Komponen | Pin ESP32 | Keterangan |
| :--- | :--- | :--- |
| **Anoda (+) LED** (kaki panjang) | Resistor 220 Ω -> **GPIO 2** | Built-in LED ESP32 atau pin GPIO eksternal |
| **Katoda (-) LED** (kaki pendek) | **GND** | Ground |

---

## 3. Diagram Blok Sambungan Kabel

```
               +--------------------------------------+
               |             ESP32 DevKit             |
               |                                      |
  (VCC 3.3V) --+ 3V3                                  |
    (GND)    --+ GND                                  |
               |                                      |
  (DHT22 DATA)-+ GPIO 4                               |
  (BH1750 SDA)-+ GPIO 21                              |
  (BH1750 SCL)-+ GPIO 22                              |
    (LED +)  --+ GPIO 2  --> [220Ω Resistor] --> (LED)|
               +--------------------------------------+
```

---

## 4. Keamanan dan Tindakan Pencegahan

1. **Gunakan Tegangan Rendah DC (3.3V / 5V)**: Untuk tahap pengujian dan demonstrasi tugas kuliah, gunakan selalu LED tegangan rendah DC. **Jangan** langsung menghubungkan rangkaian ke jaringan listrik 220V PLN AC.
2. **Pengembangan Modul Relay**: Jika di masa mendatang ingin mengontrol lampu 220V AC sungguhan, gunakan **Modul Relay Optocoupler 5V** yang memiliki isolasi optik penuh.
3. **Common Ground**: Pastikan semua pin GND sensor dan modul terhubung ke pin GND ESP32 yang sama.
