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
} from "lucide-react";
import { DeviceInfo } from "@/types/iot";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Array<DeviceInfo & { isActive?: boolean }>>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

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

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Tombol Scan ESP32 */}
          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Panduan Deteksi Perangkat ESP32</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">1. Wi-Fi Jaringan Sama</span>
            <p className="text-slate-500">
              ESP32 dan laptop harus terhubung ke SSID Wi-Fi yang sama agar transmisi UDP broadcast dapat diterima.
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">2. Firmware UDP Port 8266</span>
            <p className="text-slate-500">
              Gunakan firmware yang disediakan di folder <code className="font-mono bg-slate-200 px-1 py-0.2 rounded text-[11px]">firmware/esp32-smarthome</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
