"use client";

import { useEffect, useState } from "react";
import { Cpu, Database, Wifi, AlertTriangle } from "lucide-react";
import { SystemStatus } from "@/types/iot";

interface Props {
  status: SystemStatus | null;
  lastUpdated: string | null;
}

export default function StatusHeader({ status, lastUpdated }: Props) {
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
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

  return (
    <div className="space-y-4">
      {/* Sapaan & Tanggal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Monitoring & Kontrol
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentDateStr ? currentDateStr : "Memuat tanggal..."} • Sistem Otomasi Rumah Berbasis ESP32
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {mode === "simulation" ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>
                <strong>Mode Simulasi Aktif:</strong> Beroperasi tanpa perangkat keras fisik
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>Mode Real Hardware:</strong> Terhubung ke ESP32 fisik
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Status ESP32 */}
        <div
          className={`p-4 rounded-xl border transition ${
            isEspOnline
              ? "bg-white border-slate-200 shadow-sm"
              : "bg-rose-50/50 border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isEspOnline ? "bg-blue-50 text-blue-600" : "bg-rose-100 text-rose-600"
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Perangkat IoT (ESP32)
                </span>
                <span className="text-base font-bold text-slate-900 block">
                  {status?.activeDevice?.deviceName || "Belum ada perangkat terpilih"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isEspOnline
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                {isEspOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-y-1">
            <span>
              IP: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">{status?.activeDevice?.ipAddress || "Tidak ada IP"}</code>
            </span>
            <span>
              ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">{status?.activeDevice?.deviceId || "-"}</code>
            </span>
            <span>
              Update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("id-ID") : "-"}
            </span>
          </div>

          {!isEspOnline && mode === "real" && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-100/70 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ESP32 terputus atau tidak terjangkau. Periksa Wi-Fi dan daya ESP32.</span>
            </div>
          )}
        </div>

        {/* Status Database Hostinger MySQL */}
        <div
          className={`p-4 rounded-xl border transition ${
            isDbConnected
              ? "bg-white border-slate-200 shadow-sm"
              : "bg-rose-50/50 border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDbConnected ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-600"
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Database Eksternal
                </span>
                <span className="text-base font-bold text-slate-900 block">
                  Hostinger MySQL
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isDbConnected
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDbConnected ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {isDbConnected ? "TERHUBUNG" : "TERPUTUS"}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-y-1">
            <span>
              Host: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">{status?.database?.host || "srv1412.hstgr.io"}</code>
            </span>
            <span>
              Port: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">{status?.database?.port || "3306"}</code>
            </span>
            <span>
              Latency: {status?.database?.latencyMs ? `${status.database.latencyMs} ms` : "-"}
            </span>
          </div>

          {!isDbConnected && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-100/70 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Gagal menghubungi MySQL Hostinger: {status?.database?.error || "Koneksi bermasalah"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
