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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
} from "lucide-react";
import { DeviceInfo } from "@/types/iot";
import WiringSchematicModal, { ConfiguredLight } from "@/components/devices/WiringSchematicModal";

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

  // Panduan Setup State
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [activeGuideTab, setActiveGuideTab] = useState<"step1" | "step2" | "step3" | "troubleshooting">("step1");
  const [isSchematicModalOpen, setIsSchematicModalOpen] = useState(false);
  const [configuredLights, setConfiguredLights] = useState<ConfiguredLight[]>([]);

  // Fetch daftar lampu tersimpan dari MySQL (configured_lights)
  const loadConfiguredLights = useCallback(async () => {
    try {
      const res = await fetch("/api/control/lights");
      if (res.ok) {
        const json = await res.json();
        if (json.lights) {
          setConfiguredLights(json.lights);
        }
      }
    } catch (err: unknown) {
      console.error("Gagal memuat configured_lights dari DB:", err);
    }
  }, []);

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
    loadConfiguredLights();
  }, [loadDevices, loadConfiguredLights]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen & Penemuan Perangkat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Auto Device Discovery melalui UDP Broadcast port 8266 pada jaringan Wi-Fi lokal
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto">
          {/* Tombol Simpan Program ESP32 */}
          <button
            onClick={handleOpenFirmwareModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-95 whitespace-nowrap"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Program ESP32</span>
          </button>

          {/* Tombol Scan ESP32 */}
          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Memindai...</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 shrink-0" />
                <span>Scan ESP32</span>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Perangkat Terdeteksi</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold font-mono">
              {devices.length}
            </span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 hidden sm:inline-block">
            tabel: devices
          </span>
        </div>

        {devices.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <Radio className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
            <p className="text-sm font-bold text-slate-700">Belum ada perangkat terdeteksi</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik tombol <strong>Scan ESP32</strong> di atas untuk memindai jaringan lokal secara instan.
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
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isConnected
                      ? "bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 border-blue-300 ring-2 ring-blue-500/10 shadow-sm"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isConnected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {device.name}
                          </h3>
                          {isConnected && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-600 text-white tracking-wide">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          ID: {device.deviceId}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        device.isOnline
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${device.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {device.isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  {/* Metadata Perangkat (2x2 Micro Cards) */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Alamat IP
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">
                        {device.lastIp || "-"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Tipe Board
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate block">
                        {device.deviceType}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Versi Firmware
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate block">
                        {device.firmwareVersion || "1.0.0"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Terakhir Aktif
                      </span>
                      <span className="text-slate-700 text-[11px] truncate block">
                        {device.lastSeenAt
                          ? new Date(device.lastSeenAt).toLocaleTimeString("id-ID")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Capabilities Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-end">
                    {isConnected ? (
                      <button
                        onClick={handleDisconnect}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Unplug className="w-3.5 h-3.5" />
                        <span>Putuskan Koneksi</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(device.deviceId)}
                        disabled={isConnecting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-60"
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

      {/* Panduan Lengkap Setup & Integrasi ESP32 Fisik */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Header Panduan dengan Toggle Collapse */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Panduan Setup & Integrasi ESP32 Fisik
              </h2>
              <p className="text-[11px] text-slate-500">
                Langkah pengkabelan pin, upload firmware, dan deteksi Wi-Fi otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
            <button
              onClick={() => setIsSchematicModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition active:scale-95 shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Skema Perakitan ({configuredLights.length} Relay DB)</span>
            </button>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              UDP: 8266 · HTTP: 80
            </span>
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <span>{isGuideOpen ? "Sembunyikan" : "Buka Panduan"}</span>
              {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Konten Panduan (Jika Terbuka) */}
        {isGuideOpen && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Tab Selector di Mobile (< lg) */}
            <div className="flex lg:hidden items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold overflow-x-auto gap-1">
              <button
                onClick={() => setActiveGuideTab("step1")}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition whitespace-nowrap text-[11px] ${
                  activeGuideTab === "step1" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                1. Pinout
              </button>
              <button
                onClick={() => setActiveGuideTab("step2")}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition whitespace-nowrap text-[11px] ${
                  activeGuideTab === "step2" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                2. Firmware
              </button>
              <button
                onClick={() => setActiveGuideTab("step3")}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition whitespace-nowrap text-[11px] ${
                  activeGuideTab === "step3" ? "bg-white text-indigo-700 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                3. Wi-Fi
              </button>
              <button
                onClick={() => setActiveGuideTab("troubleshooting")}
                className={`py-1.5 px-2.5 rounded-lg text-center transition whitespace-nowrap text-[11px] ${
                  activeGuideTab === "troubleshooting" ? "bg-white text-amber-700 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                💡 Tips
              </button>
            </div>

            {/* Desktop (Grid 3 Kolom) & Mobile (Sesuai Tab Aktif) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* Langkah 1: Pinout Hardware */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 ${
                  activeGuideTab !== "step1" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Pengkabelan Sensor & Relay
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Hubungkan kaki komponen ke pin GPIO ESP32:
                </p>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                    <span className="font-sans font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      DHT22 (Suhu)
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">GPIO 4</span> · 3.3V
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                    <span className="font-sans font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      BH1750 (Cahaya)
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      SDA <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">21</span> · SCL <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">22</span>
                    </span>
                  </div>

                  {/* Dynamic Relay Lamp Rows from MySQL (configured_lights) */}
                  {configuredLights.length === 0 ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                      <span className="font-sans font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Relay Lampu (Utama)
                      </span>
                      <span className="text-slate-600 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          GPIO 2
                        </span>
                      </span>
                    </div>
                  ) : (
                    configuredLights.map((light, idx) => (
                      <div
                        key={light.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70"
                      >
                        <span className="font-sans font-semibold text-slate-800 text-[11px] flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              light.isDefault
                                ? "bg-emerald-500"
                                : idx % 2 === 1
                                ? "bg-purple-500"
                                : "bg-orange-500"
                            }`}
                          ></span>
                          <span className="truncate max-w-[125px] sm:max-w-[145px] font-bold text-slate-800">
                            {light.name}
                          </span>
                          {light.isDefault && (
                            <span className="text-[9px] text-slate-400 font-sans font-normal shrink-0">
                              (Utama)
                            </span>
                          )}
                        </span>
                        <span className="text-slate-600 text-[11px] shrink-0 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            GPIO {light.pin}
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Tombol Buka Skema Perakitan Visual */}
                <button
                  onClick={() => setIsSchematicModalOpen(true)}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-200" />
                  <span>Lihat Diagram Skema Lengkap</span>
                </button>
              </div>

              {/* Langkah 2: Upload Firmware Arduino IDE */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 ${
                  activeGuideTab !== "step2" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Upload Firmware Arduino IDE
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Unggah program firmware ke board ESP32:
                </p>

                <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Klik <strong>"Program ESP32"</strong> di header atas untuk mengunduh <code className="font-mono bg-white px-1 py-0.5 rounded border text-[10px]">esp32-smarthome.ino</code>.
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Install library di Arduino IDE: <strong className="text-slate-800">DHT sensor, Adafruit Unified, BH1750, ArduinoJson</strong>.
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Pilih Board: <strong>ESP32 Dev Module</strong>, port COM yang aktif, lalu tekan tombol <strong>Upload (➔)</strong>.
                    </span>
                  </div>
                </div>
              </div>

              {/* Langkah 3: Auto-Discovery & Koneksi */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 ${
                  activeGuideTab !== "step3" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Deteksi Otomatis & Terhubung
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sinkronisasi nirkabel melalui Wi-Fi lokal:
                </p>

                <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Pastikan ESP32 & Laptop/HP terhubung ke <strong>SSID Wi-Fi yang sama</strong> (frekuensi 2.4 GHz).
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Buka <strong>Serial Monitor</strong> (115200 baud) untuk memastikan ESP32 sudah mendapat IP lokal.
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Klik <strong>"Scan ESP32"</strong> di atas, lalu klik <strong>"Hubungkan Perangkat"</strong> untuk kontrol live.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Callout Troubleshooting Tips (Desktop selalu tampil di bawah, Mobile tampil saat tab tips dipilih) */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs space-y-1.5 ${
                activeGuideTab !== "troubleshooting" ? "hidden lg:block" : "block"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tips Pemecahan Masalah (Troubleshooting)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-amber-800 leading-relaxed pl-6">
                <p>
                  • <strong>AP Isolation:</strong> Wi-Fi kantor/publik memblokir komunikasi. Gunakan Wi-Fi rumah atau Hotspot HP.
                </p>
                <p>
                  • <strong>Kabel USB:</strong> Pastikan menggunakan kabel transfer data, bukan kabel charger saja.
                </p>
                <p>
                  • <strong>Firewall:</strong> Beri izin port UDP 8266 pada sistem Windows agar broadcast tidak diblokir.
                </p>
                <p>
                  • <strong>Baudrate:</strong> Gunakan baudrate <code>115200</code> di Serial Monitor Arduino IDE.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Simpan Program ESP32 */}
      {isFirmwareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2.5 shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-base tracking-tight truncate">
                    Program Firmware ESP32
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">
                    esp32-smarthome.ino (Arduino IDE)
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {/* Highlight Banner */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Program Siap Diunggah</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                    {configuredLights.length} Relay Aktif
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  DHT22 (D4), BH1750 (D21/D22), &amp; {configuredLights.length} Relay ({configuredLights.map((l) => `D${l.pin}`).join(", ")}) otomatis diinjeksi dari database MySQL.
                </p>
              </div>

              {/* Wi-Fi Configuration Bar */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Konfigurasi Wi-Fi (Opsional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap hidden sm:inline">
                    Otomatis diisi ke file .ino
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-600 mb-1">
                      Nama SSID Wi-Fi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: MyHome_WiFi"
                      value={customSsid}
                      onChange={(e) => setCustomSsid(e.target.value)}
                      className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-600 mb-1">
                      Password Wi-Fi
                    </label>
                    <input
                      type="text"
                      placeholder="Password Wi-Fi Anda"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Simpan & Unduh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                <button
                  onClick={handleDownloadIno}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs active:scale-95 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Unduh File (.ino)</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  disabled={firmwareLoading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition active:scale-95 text-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>Salin Semua Kode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition border border-slate-200 bg-white text-xs cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{showCodePreview ? "Tutup Pratinjau" : "Pratinjau Kode"}</span>
                </button>
              </div>

              {/* Pratinjau Kode (Collapsible) */}
              {showCodePreview && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Source: esp32-smarthome.ino</span>
                    <span>{getEffectiveCode().split("\n").length} baris</span>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto border border-slate-800 select-all">
                    {firmwareLoading ? "Memuat kode firmware dari server..." : getEffectiveCode()}
                  </pre>
                </div>
              )}

              {/* Panduan Langkah Upload ke ESP32 */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Terminal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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
            <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50/60">
              <span className="text-[11px] text-slate-400 font-mono truncate hidden sm:inline">
                firmware/esp32-smarthome/esp32-smarthome.ino
              </span>
              <button
                onClick={() => setIsFirmwareModalOpen(false)}
                className="w-full sm:w-auto ml-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition active:scale-95 shadow-xs cursor-pointer text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Skema Perakitan Visual */}
      <WiringSchematicModal
        isOpen={isSchematicModalOpen}
        onClose={() => setIsSchematicModalOpen(false)}
        configuredLights={configuredLights}
      />
    </div>
  );
}
