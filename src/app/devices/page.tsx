"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wifi,
  Radio,
  AlertTriangle,
  Info,
  Plug,
  Unplug,
  ShieldCheck,
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
  const [manualName, setManualName] = useState("ESP32 Manual");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

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
    setScanMessage("Mengirim UDP Broadcast ke 255.255.255.255:8266 di jaringan lokal...");

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Manajemen Perangkat IoT
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Auto Device Discovery melalui UDP Broadcast di jaringan Wi-Fi lokal
          </p>
        </div>

        {/* Tombol Scan ESP32 */}
        <button
          onClick={handleStartScan}
          disabled={scanning}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition focus:ring-4 focus:ring-blue-100 disabled:opacity-60 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          {scanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memindai Jaringan Wi-Fi...</span>
            </>
          ) : (
            <>
              <Radio className="w-4 h-4" />
              <span>Scan Perangkat ESP32</span>
            </>
          )}
        </button>
      </div>

      {/* Pesan Status Scan */}
      {scanMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          <span>{scanMessage}</span>
        </div>
      )}

      {scanError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Animasi Scan Radar Jika Scanning */}
      {scanning && (
        <div className="p-8 rounded-2xl bg-white border border-blue-200 text-center space-y-3 shadow-sm">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
            <span className="relative w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base">Sedang Memindai Jaringan Lokal</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Backend mengirim paket UDP Broadcast ke port 8266. ESP32 yang terhubung pada Wi-Fi yang sama akan merespons dengan identitas perangkat.
          </p>
        </div>
      )}

      {/* Grid Daftar Perangkat */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Perangkat yang Ditemukan ({devices.length})</span>
        </h2>

        {devices.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
            <Radio className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
            <p className="text-base font-semibold text-slate-700">Belum ada perangkat terdeteksi</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik tombol <strong>Scan Perangkat ESP32</strong> di atas untuk mencari perangkat di jaringan Wi-Fi Anda.
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
                  className={`p-5 rounded-xl border transition ${
                    isConnected
                      ? "bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/10 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          isConnected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{device.name}</h3>
                          {isConnected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 block">
                          ID: <code className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700">{device.deviceId}</code>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        device.isOnline
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <Wifi className="w-3 h-3" />
                      {device.isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  {/* Detail Info Perangkat */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Alamat IP:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {device.lastIp || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tipe Perangkat:</span>
                      <span className="font-medium text-slate-800">{device.deviceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Versi Firmware:</span>
                      <span className="font-medium text-slate-800">{device.firmwareVersion || "1.0.0"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Terakhir Terlihat:</span>
                      <span className="text-slate-700">
                        {device.lastSeenAt
                          ? new Date(device.lastSeenAt).toLocaleTimeString("id-ID")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Kemampuan Sensor */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {device.capabilities?.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider"
                      >
                        {cap}
                      </span>
                    ))}
                    {isSim && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        VIRTUAL SIMULATOR
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {isConnected ? (
                      <button
                        onClick={handleDisconnect}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Unplug className="w-3.5 h-3.5" />
                        <span>Putuskan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(device.deviceId)}
                        disabled={isConnecting}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menghubungkan...</span>
                          </>
                        ) : (
                          <>
                            <Plug className="w-3.5 h-3.5" />
                            <span>Hubungkan</span>
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

      {/* Petunjuk Troubleshooting Jika ESP32 Tidak Terdeteksi */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Panduan Pemecahan Masalah (ESP32 Tidak Ditemukan)</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            Pastikan ESP32 telah diberi daya dan LED indikator board menyala.
          </li>
          <li>
            Pastikan ESP32 dan laptop terhubung ke <strong>jaringan Wi-Fi / Hotspot yang sama</strong>.
          </li>
          <li>
            Pastikan fitur <em>Client Isolation / AP Isolation</em> pada router dimatikan agar paket UDP Broadcast tidak diblokir.
          </li>
          <li>
            Pastikan firmware pada ESP32 sudah di-upload dengan kode dari folder <code className="font-mono bg-slate-200 px-1 py-0.2 rounded">firmware/esp32-smarthome</code>.
          </li>
          <li>
            Gunakan <strong>Mode Simulasi</strong> jika perangkat ESP32 fisik belum tersedia.
          </li>
        </ul>
      </div>
    </div>
  );
}
