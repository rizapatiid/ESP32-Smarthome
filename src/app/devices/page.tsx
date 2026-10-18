"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wifi,
  Radio,
  Plug,
  Unplug,
  Copy,
  Info,
  Server,
  Plus,
  Terminal,
  FileCode,
  Download,
  Check,
  X,
  Code2,
  ExternalLink,
} from "lucide-react";
import { DeviceInfo } from "@/types/iot";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Array<DeviceInfo & { isActive?: boolean }>>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Firmware Modal State
  const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
  const [firmwareCode, setFirmwareCode] = useState("");
  const [firmwareLoading, setFirmwareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customSsid, setCustomSsid] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [showCodePreview, setShowCodePreview] = useState(false);

  // Manual IP Form State
  const [manualIp, setManualIp] = useState("");
  const [manualName, setManualName] = useState("ESP32 Living Room");
  const [manualLoading, setManualLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Fetch daftar perangkat dari MySQL
  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const json = await res.json();
        if (json.devices) {
          setDevices(json.devices);
          setActiveDeviceId(json.activeDeviceId || null);
        }
      }
    } catch (err: unknown) {
      console.error("Gagal memuat perangkat:", err);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Handler Trigger UDP Scan
  const handleStartScan = async () => {
    if (scanning) return;
    setScanning(true);
    setScanError(null);
    setScanMessage("Mengirim UDP Broadcast (255.255.255.255:8266) di jaringan Wi-Fi lokal...");

    try {
      const res = await fetch("/api/discovery/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeoutMs: 3500 }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScanMessage(
          `Pencarian selesai dalam ${data.durationMs}ms. Ditemukan ${data.count} perangkat.`
        );
        await loadDevices();
      } else {
        setScanError(data.error || "Gagal melakukan scan UDP");
      }
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "Kesalahan jaringan scan");
    } finally {
      setScanning(false);
    }
  };

  // Handler Hubungkan Perangkat
  const handleConnect = async (deviceId: string) => {
    setConnectingId(deviceId);
    setScanError(null);

    try {
      const res = await fetch("/api/devices/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScanMessage(data.message || `Berhasil terhubung ke ${deviceId}`);
        await loadDevices();
      } else {
        setScanError(data.error || "Gagal menghubungkan perangkat");
      }
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "Kesalahan koneksi perangkat");
    } finally {
      setConnectingId(null);
    }
  };

  // Handler Modal Firmware ESP32
  const handleOpenFirmwareModal = async () => {
    setIsFirmwareModalOpen(true);
    if (!firmwareCode) {
      setFirmwareLoading(true);
      try {
        const res = await fetch("/api/firmware");
        const json = await res.json();
        if (json.success && json.code) {
          setFirmwareCode(json.code);
        }
      } catch (err) {
        console.warn("Gagal memuat kode firmware:", err);
      } finally {
        setFirmwareLoading(false);
      }
    }
  };

  const getEffectiveCode = () => {
    let code = firmwareCode;
    if (customSsid.trim()) {
      code = code.replace(
        /const char\* WIFI_SSID\s*=\s*"[^"]*";/,
        `const char* WIFI_SSID     = "${customSsid.trim().replace(/"/g, '\\"')}";`
      );
    }
    if (customPassword.trim()) {
      code = code.replace(
        /const char\* WIFI_PASSWORD\s*=\s*"[^"]*";/,
        `const char* WIFI_PASSWORD = "${customPassword.trim().replace(/"/g, '\\"')}";`
      );
    }
    return code;
  };

  const handleCopyCode = async () => {
    const code = getEffectiveCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Gagal menyalin:", err);
    }
  };

  const handleDownloadIno = () => {
    const params = new URLSearchParams();
    params.set("download", "1");
    if (customSsid.trim()) params.set("ssid", customSsid.trim());
    if (customPassword.trim()) params.set("password", customPassword.trim());
    window.open(`/api/firmware?${params.toString()}`, "_blank");
  };

  // Handler Putuskan Perangkat
  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/devices/disconnect", { method: "POST" });
      if (res.ok) {
        setActiveDeviceId(null);
        setScanMessage("Koneksi perangkat berhasil diputuskan.");
        await loadDevices();
      }
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "Gagal memutuskan perangkat");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Manajemen & Penemuan Perangkat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auto Device Discovery melalui UDP Broadcast port 8266 pada jaringan Wi-Fi lokal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Tombol Simpan Program ESP32 */}
          <button
            onClick={handleOpenFirmwareModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Simpan Program ESP32</span>
          </button>

          {/* Tombol Scan ESP32 */}
          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memindai Wi-Fi...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Scan Perangkat ESP32</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pesan Notifikasi Feedback */}
      {scanMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          <span>{scanMessage}</span>
        </div>
      )}

      {scanError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs font-medium">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Animasi Scan Radar Jika Scanning */}
      {scanning && (
        <div className="p-8 rounded-2xl bg-white border border-blue-200 text-center space-y-3 shadow-sm">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
            <span className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base">Memindai Jaringan Wi-Fi Lokal</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Backend menyebarkan paket UDP broadcast ke port 8266. ESP32 yang merespons akan diidentifikasi secara otomatis ke Database.
          </p>
        </div>
      )}

      {/* Grid Daftar Perangkat */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Perangkat Terdeteksi ({devices.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Divalidasi dari tabel <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">devices</code>
          </span>
        </div>

        {devices.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <Radio className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
            <p className="text-sm font-bold text-slate-700">Belum ada perangkat terdeteksi</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik tombol <strong>Scan Perangkat ESP32</strong> di atas untuk memindai jaringan lokal secara instan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => {
              const isConnected = activeDeviceId === device.deviceId;
              const isConnecting = connectingId === device.deviceId;
              const isSim = device.deviceId === "sim-esp32-01";

              return (
                <div
                  key={device.deviceId}
                  className={`p-5 rounded-2xl border transition-all ${
                    isConnected
                      ? "bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/20 border-blue-300 ring-2 ring-blue-500/10 shadow-sm"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isConnected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{device.name}</h3>
                          {isConnected && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-mono block">
                          ID: {device.deviceId}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        device.isOnline
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <Wifi className="w-3 h-3" />
                      {device.isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  {/* Metadata Perangkat */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Alamat IP
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {device.lastIp || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Tipe Board
                      </span>
                      <span className="font-semibold text-slate-800">{device.deviceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Versi Firmware
                      </span>
                      <span className="font-semibold text-slate-800">{device.firmwareVersion || "1.0.0"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Terakhir Aktif
                      </span>
                      <span className="text-slate-700">
                        {device.lastSeenAt
                          ? new Date(device.lastSeenAt).toLocaleTimeString("id-ID")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Capabilities Chips */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    {device.capabilities?.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {cap}
                      </span>
                    ))}
                    {isSim && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        SIMULATOR VIRTUAL
                      </span>
                    )}
                  </div>

                  {/* Aksi Hubungkan / Putuskan */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {isConnected ? (
                      <button
                        onClick={handleDisconnect}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Unplug className="w-3.5 h-3.5" />
                        <span>Putuskan Koneksi</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(device.deviceId)}
                        disabled={isConnecting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-60"
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Memvalidasi...</span>
                          </>
                        ) : (
                          <>
                            <Plug className="w-3.5 h-3.5" />
                            <span>Hubungkan Perangkat</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Troubleshooting Info Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Panduan Deteksi & Program ESP32</span>
          </div>
          <button
            onClick={handleOpenFirmwareModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Program .ino</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">1. Wi-Fi Jaringan Sama</span>
            <p className="text-slate-500">
              ESP32 dan laptop harus terhubung ke SSID Wi-Fi yang sama agar transmisi UDP broadcast port 8266 dapat diterima oleh dashboard.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">2. Firmware UDP Port 8266</span>
            <p className="text-slate-500">
              Gunakan firmware resmi di <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">firmware/esp32-smarthome</code> yang sudah mendukung multi-lampu dinamis & auto discovery.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Simpan Program ESP32 */}
      {isFirmwareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Program Firmware ESP32
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    esp32-smarthome.ino (Arduino IDE)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFirmwareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Highlight Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Program Siap Diunggah ke ESP32 Fisik</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Kode ini sudah mencakup Auto Discovery UDP (Port 8266), API Sensor DHT22 & BH1750, serta kontrol multi-lampu dinamis (GPIO 2, 4, 16, dsb.).
                </p>
              </div>

              {/* Wi-Fi Configuration Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Konfigurasi Wi-Fi Otomatis (Opsional)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Otomatis dimasukkan ke file .ino
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama SSID Wi-Fi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: MyHome_WiFi"
                      value={customSsid}
                      onChange={(e) => setCustomSsid(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Password Wi-Fi
                    </label>
                    <input
                      type="text"
                      placeholder="Password Wi-Fi Anda"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Simpan & Unduh */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={handleDownloadIno}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File (.ino)</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  disabled={firmwareLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Semua Kode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition border border-slate-200"
                >
                  <Code2 className="w-4 h-4 text-slate-500" />
                  <span>{showCodePreview ? "Sembunyikan Kode" : "Pratinjau Kode"}</span>
                </button>
              </div>

              {/* Pratinjau Kode (Collapsible) */}
              {showCodePreview && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Source: esp32-smarthome.ino</span>
                    <span>{getEffectiveCode().split("\n").length} baris</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto border border-slate-800 select-all">
                    {firmwareLoading ? "Memuat kode firmware dari server..." : getEffectiveCode()}
                  </pre>
                </div>
              )}

              {/* Panduan Langkah Upload ke ESP32 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Langkah Mengunggah (Flash) ke Board ESP32</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Unduh file <strong>esp32-smarthome.ino</strong> di atas dan buka menggunakan aplikasi <strong>Arduino IDE</strong> (versi 2.x disarankan).
                  </li>
                  <li>
                    Install 4 library wajib melalui <em>Sketch &gt; Include Library &gt; Manage Libraries</em>:
                    <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">DHT sensor library</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">Adafruit Unified Sensor</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">BH1750 (Stefan Sell)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">ArduinoJson (v6/v7)</span>
                    </div>
                  </li>
                  <li>
                    Hubungkan board ESP32 ke komputer via kabel data USB. Pada Arduino IDE pilih Board <strong>ESP32 Dev Module</strong> dan Port COM yang sesuai.
                  </li>
                  <li>
                    Klik tombol <strong>Upload (➔)</strong> di Arduino IDE. Tunggu hingga proses compiling selesai dan muncul pesan <code>Done uploading</code>.
                  </li>
                  <li>
                    Buka <strong>Serial Monitor</strong> (kecepatan 115200 baud) untuk melihat alamat IP yang didapat ESP32.
                  </li>
                  <li>
                    Kembali ke web dashboard ini dan klik <strong>Scan Perangkat ESP32</strong>. ESP32 Anda akan langsung otomatis terhubung!
                  </li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <span className="text-[11px] text-slate-400">
                File tersimpan di: <code>firmware/esp32-smarthome/esp32-smarthome.ino</code>
              </span>
              <button
                onClick={() => setIsFirmwareModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/60 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
