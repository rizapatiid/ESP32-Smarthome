"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Radio,
  Cpu,
  Save,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Eye,
  Sliders,
} from "lucide-react";
import { OperatingMode } from "@/types/iot";

export default function SettingsPage() {
  const [mode, setMode] = useState<OperatingMode>("simulation");
  const [pollIntervalMs, setPollIntervalMs] = useState(2000);
  const [discoveryTimeoutMs, setDiscoveryTimeoutMs] = useState(3500);

  // Database info
  const [dbInfo, setDbInfo] = useState<{
    status: string;
    host: string;
    port: number;
    database: string;
    user: string;
    passwordMasked: string;
    latencyMs?: number;
  } | null>(null);

  // Feedback status
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // DB test status
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // Ambil pengaturan saat ini
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) {
            setMode(json.settings.mode || "simulation");
            setPollIntervalMs(json.settings.pollIntervalMs || 2000);
            setDiscoveryTimeoutMs(json.settings.discoveryTimeoutMs || 3500);
          }
          if (json.databaseInfo) {
            setDbInfo(json.databaseInfo);
          }
        }
      } catch (err: unknown) {
        console.error("Gagal mengambil pengaturan:", err);
      }
    }
    fetchSettings();
  }, []);

  // Simpan pengaturan
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          pollIntervalMs,
          discoveryTimeoutMs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage(data.message || "Pengaturan berhasil disimpan.");
      } else {
        setSaveError(data.error || "Gagal menyimpan pengaturan.");
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  // Uji koneksi database live
  const handleTestDb = async () => {
    setTestingDb(true);
    setDbTestResult(null);

    try {
      const res = await fetch("/api/db/status");
      const data = await res.json();
      if (res.ok && data.status === "ONLINE") {
        setDbTestResult({ ok: true, latencyMs: data.latencyMs });
      } else {
        setDbTestResult({ ok: false, error: data.error || "Database Offline" });
      }
    } catch (err: unknown) {
      setDbTestResult({
        ok: false,
        error: err instanceof Error ? err.message : "Gagal terhubung ke endpoint DB",
      });
    } finally {
      setTestingDb(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Konfigurasi mode operasi, interval telemetri, dan informasi koneksi Database
        </p>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Mode Operasi Sistem */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Mode Operasi Aplikasi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opsi Mode Simulasi */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                mode === "simulation"
                  ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <input
                    type="radio"
                    name="mode"
                    value="simulation"
                    checked={mode === "simulation"}
                    onChange={() => setMode("simulation")}
                    className="sr-only"
                  />
                  <span className="font-bold text-slate-900 text-sm block">
                    Mode Simulasi
                  </span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Aplikasi berjalan menggunakan generator sensor lokal. Cocok untuk pengujian antarmuka dan presentasi tanpa perangkat fisik ESP32.
                  </p>
                </div>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    mode === "simulation"
                      ? "border-amber-600 bg-amber-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {mode === "simulation" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
            </label>

            {/* Opsi Mode Real Hardware */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                mode === "real"
                  ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <input
                    type="radio"
                    name="mode"
                    value="real"
                    checked={mode === "real"}
                    onChange={() => setMode("real")}
                    className="sr-only"
                  />
                  <span className="font-bold text-slate-900 text-sm block">
                    Mode Real Hardware (ESP32)
                  </span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Data diambil langsung dari sensor DHT22 & BH1750 melalui HTTP API Wi-Fi lokal. Kontrol lampu dieksekusi secara nyata pada hardware.
                  </p>
                </div>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    mode === "real"
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {mode === "real" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Interval Polling & Discovery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Radio className="w-5 h-5 text-blue-600" />
            <span>Parameter Jaringan & Polling</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Interval Polling Sensor (milidetik)
              </label>
              <input
                type="number"
                min={1000}
                max={60000}
                step={500}
                value={pollIntervalMs}
                onChange={(e) => setPollIntervalMs(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Rekomendasi: 2000 ms (2 detik) untuk responsivitas optimal tanpa membebani ESP32.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Batas Waktu UDP Discovery (milidetik)
              </label>
              <input
                type="number"
                min={1500}
                max={10000}
                step={500}
                value={discoveryTimeoutMs}
                onChange={(e) => setDiscoveryTimeoutMs(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Durasi backend mendengarkan jawaban broadcast UDP dari ESP32 (default: 3500 ms).
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. Informasi Koneksi Database (Masked) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Koneksi Database</span>
          </div>

          <button
            type="button"
            onClick={handleTestDb}
            disabled={testingDb}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition disabled:opacity-60"
          >
            {testingDb ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Uji Koneksi DB</span>
              </>
            )}
          </button>
        </div>

        {dbTestResult && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              dbTestResult.ok
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {dbTestResult.ok ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Koneksi ke Database berhasil! Latency respons: {dbTestResult.latencyMs} ms.</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Koneksi gagal: {dbTestResult.error}</span>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Database Host:</span>
            <span className="text-slate-800 font-semibold">{dbInfo?.host || "srv1412.hstgr.io"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Port:</span>
            <span className="text-slate-800 font-semibold">{dbInfo?.port || 3306}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Nama Database:</span>
            <span className="text-slate-800 font-semibold">{dbInfo?.database || "smarthome"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">User Database:</span>
            <span className="text-slate-800 font-semibold">{dbInfo?.user || "root"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[11px] font-sans">Password Database:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold">{dbInfo?.passwordMasked || "••••••••••••"}</span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-sans">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Dilindungi (Tersimpan di .env)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
