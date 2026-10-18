"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Database,
  Wifi,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Moon,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import { SystemStatus } from "@/types/iot";

interface Props {
  status: SystemStatus | null;
  lastUpdated: string | null;
}

export default function StatusHeader({ status, lastUpdated }: Props) {
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [currentHour, setCurrentHour] = useState(20);
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [copiedIp, setCopiedIp] = useState(false);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setCurrentHour(hour);
    if (hour < 11) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    const formatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setCurrentDateStr(formatter.format(now));
  }, []);

  const isEspOnline = status?.activeDevice?.isOnline ?? false;
  const isDbConnected = status?.database?.status === "CONNECTED";
  const mode = status?.mode || "simulation";

  const handleCopyIp = () => {
    if (status?.activeDevice?.ipAddress) {
      navigator.clipboard.writeText(status.activeDevice.ipAddress);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-xs ${
              currentHour < 11
                ? "bg-amber-50 border-amber-200/80 text-amber-600"
                : currentHour < 15
                ? "bg-amber-50 border-amber-200/80 text-amber-600"
                : currentHour < 18
                ? "bg-orange-50 border-orange-200/80 text-orange-600"
                : "bg-indigo-50 border-indigo-200/80 text-indigo-600"
            }`}
          >
            {currentHour < 11 ? (
              <Sunrise className="w-5 h-5" />
            ) : currentHour < 15 ? (
              <Sun className="w-5 h-5" />
            ) : currentHour < 18 ? (
              <Sunset className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                {greeting}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Aktif
              </span>
            </div>

            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{currentDateStr || "Memuat kalender..."}</span>
            </div>
          </div>
        </div>

        {/* Action Button: Ke Halaman Perangkat / Scan */}
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center pt-1 md:pt-0">
          <Link
            href="/devices"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 active:scale-[0.98] transition shadow-xs text-center"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Scan ESP32</span>
          </Link>

          <Link
            href="/history/sensors"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60 active:scale-[0.98] transition shadow-xs text-center"
          >
            <span>Riwayat Aktivitas</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Connection Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Perangkat ESP32 */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isEspOnline
              ? "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              : "bg-rose-50/40 border-rose-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isEspOnline
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-rose-100 text-rose-600 border border-rose-200"
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Perangkat Terhubung
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                  {status?.activeDevice?.deviceName || "Belum Ada Perangkat"}
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                isEspOnline
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              {isEspOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block uppercase tracking-wider font-medium">IP Address</span>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  onClick={handleCopyIp}
                  title="Klik untuk menyalin IP"
                  className="font-mono bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-semibold text-[11px] truncate max-w-full transition"
                >
                  {status?.activeDevice?.ipAddress || "127.0.0.1"}
                </button>
                {copiedIp && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block uppercase tracking-wider font-medium">Device ID</span>
              <span className="font-mono text-slate-800 font-semibold text-[11px] truncate block mt-0.5">
                {status?.activeDevice?.deviceId || "-"}
              </span>
            </div>

            <div className="min-w-0 text-right sm:text-left">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block uppercase tracking-wider font-medium">Update</span>
              <span className="font-semibold text-slate-700 text-[11px] block mt-0.5">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("id-ID") : "-"}
              </span>
            </div>
          </div>

          {!isEspOnline && mode === "real" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                ESP32 tidak merespons. Periksa koneksi Wi-Fi dan daya supply mikrokontroler.
              </span>
            </div>
          )}
        </div>

        {/* Status Database */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isDbConnected
              ? "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              : "bg-rose-50/40 border-rose-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isDbConnected
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                    : "bg-rose-100 text-rose-600 border border-rose-200"
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Penyimpanan Data Cloud
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Database
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                isDbConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDbConnected ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {isDbConnected ? "TERKONEKSI" : "TERPUTUS"}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block uppercase tracking-wider font-medium">Host</span>
              <span className="font-mono text-slate-800 font-semibold text-[11px] truncate block mt-0.5" title={status?.database?.host}>
                {status?.database?.host || "srv1412.hstgr.io"}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block uppercase tracking-wider font-medium">Port</span>
              <span className="font-mono text-slate-800 font-semibold text-[11px] block mt-0.5">
                {status?.database?.port || 3306}
              </span>
            </div>

            <div className="min-w-0 text-right sm:text-left">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block uppercase tracking-wider font-medium">Latency</span>
              <span className="font-semibold text-emerald-600 font-mono text-[11px] block mt-0.5">
                {status?.database?.latencyMs ? `${status.database.latencyMs} ms` : "-"}
              </span>
            </div>
          </div>

          {!isDbConnected && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Gagal menghubungi Database: {status?.database?.error || "Koneksi terputus"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
