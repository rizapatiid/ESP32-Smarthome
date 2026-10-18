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
} from "lucide-react";
import { SystemStatus } from "@/types/iot";

interface Props {
  status: SystemStatus | null;
  lastUpdated: string | null;
}

export default function StatusHeader({ status, lastUpdated }: Props) {
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [copiedIp, setCopiedIp] = useState(false);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, Sistem SmartHome Aktif
            </h1>
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse hidden sm:inline-block" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentDateStr || "Memuat kalender..."}</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">Monitoring ESP32 & Hostinger MySQL</span>
          </p>
        </div>

        {/* Action Button: Ke Halaman Perangkat / Scan */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Scan ESP32</span>
          </Link>

          <Link
            href="/history/sensors"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 transition"
          >
            <span>Riwayat MySQL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Connection Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Perangkat ESP32 */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isEspOnline
              ? "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              : "bg-rose-50/40 border-rose-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  isEspOnline
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-rose-100 text-rose-600 border border-rose-200"
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Perangkat Terhubung
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {status?.activeDevice?.deviceName || "Belum Ada Perangkat"}
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isEspOnline
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              {isEspOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">IP:</span>
              <button
                onClick={handleCopyIp}
                title="Klik untuk menyalin IP"
                className="font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-semibold transition"
              >
                {status?.activeDevice?.ipAddress || "127.0.0.1"}
              </button>
              {copiedIp && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Disalin
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 mr-1">ID:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {status?.activeDevice?.deviceId || "-"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 mr-1">Update:</span>
              <span className="font-semibold text-slate-700">
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

        {/* Status Database Hostinger MySQL */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDbConnected
              ? "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              : "bg-rose-50/40 border-rose-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  isDbConnected
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                    : "bg-rose-100 text-rose-600 border border-rose-200"
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Penyimpanan Data Cloud
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Hostinger MySQL
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
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

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-y-1.5">
            <div>
              <span className="text-slate-400 mr-1">Host:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {status?.database?.host || "srv1412.hstgr.io"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 mr-1">Port:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {status?.database?.port || 3306}
              </span>
            </div>

            <div>
              <span className="text-slate-400 mr-1">Latency:</span>
              <span className="font-semibold text-emerald-600 font-mono">
                {status?.database?.latencyMs ? `${status.database.latencyMs} ms` : "-"}
              </span>
            </div>
          </div>

          {!isDbConnected && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Gagal menghubungi MySQL: {status?.database?.error || "Koneksi terputus"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
