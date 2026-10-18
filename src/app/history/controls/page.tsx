"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  Clock,
  Terminal,
  Cpu,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  FileText,
  Radio,
  ArrowRight,
  Lightbulb,
  Info,
} from "lucide-react";
import { ControlLogItem, OperatingMode } from "@/types/iot";

export default function ControlHistoryPage() {
  const [logs, setLogs] = useState<ControlLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [systemMode, setSystemMode] = useState<OperatingMode>("simulation");
  const [deviceId, setDeviceId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "SUCCESS" | "FAILED">("all");

  // Cek mode sistem aktif
  useEffect(() => {
    async function checkMode() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const json = await res.json();
          if (json.mode) setSystemMode(json.mode);
        }
      } catch (err) {
        console.warn("Gagal mengecek mode sistem:", err);
      }
    }
    checkMode();
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");
      if (deviceId) params.set("deviceId", deviceId);

      const res = await fetch(`/api/control/history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.mode) setSystemMode(json.mode);
        let items: ControlLogItem[] = json.data || [];
        if (statusFilter !== "all") {
          items = items.filter((i) => i.status === statusFilter);
        }
        setLogs(items);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err: unknown) {
      console.error("Gagal memuat log kontrol:", err);
    } finally {
      setLoading(false);
    }
  }, [page, deviceId, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <History className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Riwayat Kontrol
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  systemMode === "real"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    systemMode === "real" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {systemMode === "real" ? "Real" : "Simulasi"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Audit log perintah kendali aktuator yang tersimpan di Database
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 active:scale-[0.98] w-full sm:w-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang Log</span>
        </button>
      </div>

      {/* Filter Bar dengan Ikon SVG */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md text-xs">
          <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] mb-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>ID Perangkat</span>
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari ID Perangkat..."
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs transition"
            />
          </div>
        </div>

        <div className="w-full sm:w-auto self-end sm:self-auto text-xs">
          <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] mb-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Filter Status</span>
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-700 transition"
          >
            <option value="all">Semua Status</option>
            <option value="SUCCESS">Hanya Sukses</option>
            <option value="FAILED">Hanya Gagal</option>
          </select>
        </div>
      </div>

      {/* Tabel & Daftar Log Kontrol */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Rekaman Aktivitas Kontrol</span>
            <span className="text-xs font-normal text-slate-400 font-mono">({total} perintah)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>Sumber: {systemMode === "real" ? "ESP32 Hardware" : "Simulator"}</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs px-4">
            {systemMode === "real"
              ? "Belum ada catatan perintah kontrol fisik ESP32 di database."
              : "Belum ada catatan perintah kontrol simulasi di database."}
          </div>
        ) : (
          <>
            {/* Tampilan Mobile: Kartu Vertikal Ringkas & Rapi dengan Ikon SVG */}
            <div className="sm:hidden divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/50 transition">
                  {/* Top: Device + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 truncate">
                        <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                        {log.deviceId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        #{log.id}
                      </span>
                    </div>

                    {log.status === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shrink-0">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        FAILED
                      </span>
                    )}
                  </div>

                  {/* Perintah & Status Transisi */}
                  <div className="flex items-center justify-between gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Terminal className="w-2.5 h-2.5 text-slate-400" />
                        Perintah
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-[11px] block">{log.command}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-right">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diminta</span>
                        <span
                          className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            log.requestedState
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {log.requestedState ? "ON" : "OFF"}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-400 mt-3 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Konfirmasi</span>
                        <span
                          className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            log.confirmedState
                              ? "bg-emerald-100 text-emerald-800"
                              : log.confirmedState === false
                              ? "bg-slate-200 text-slate-700"
                              : "bg-slate-100 text-slate-400 italic"
                          }`}
                        >
                          {log.confirmedState === true ? "ON" : log.confirmedState === false ? "OFF" : "?"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    {log.errorMessage ? (
                      <span className="text-rose-600 font-mono font-medium truncate">{log.errorMessage}</span>
                    ) : log.isSimulated ? (
                      <span className="text-amber-700 truncate">Dikonfirmasi oleh simulator virtual</span>
                    ) : (
                      <span className="text-emerald-700 truncate">Dikonfirmasi oleh ESP32 fisik</span>
                    )}
                  </div>

                  {/* Waktu Eksekusi */}
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Waktu Eksekusi
                    </span>
                    <span className="text-slate-600 font-medium">
                      {new Date(log.executedAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tampilan Desktop: Tabel Lengkap dengan Ikon SVG */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Waktu Eksekusi
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        Perangkat
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        Perintah
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        Diminta
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        Dikonfirmasi
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-slate-400" />
                        Status
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400" />
                        Keterangan
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {new Date(log.executedAt).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {log.deviceId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded font-bold border border-slate-200/60 text-[11px]">
                          {log.command}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            log.requestedState
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.requestedState ? "ON (MENYALA)" : "OFF (PADAM)"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.confirmedState !== null ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              log.confirmedState
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {log.confirmedState ? "ON (TERKONFIRMASI)" : "OFF (TERKONFIRMASI)"}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Tidak terkonfirmasi</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SUCCESS
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200"
                            title={log.errorMessage || undefined}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate text-[11px]">
                        {log.errorMessage ? (
                          <span className="text-rose-600 font-mono font-semibold">
                            {log.errorMessage}
                          </span>
                        ) : log.isSimulated ? (
                          <span className="text-amber-700">Dikonfirmasi oleh simulator virtual</span>
                        ) : (
                          <span className="text-emerald-700">Dikonfirmasi oleh ESP32 fisik</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-center sm:text-left justify-center sm:justify-start">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Halaman <strong className="text-slate-700 font-bold">{page}</strong> dari{" "}
              <strong className="text-slate-700 font-bold">{totalPages}</strong>{" "}
              <span className="text-slate-400">({total} perintah)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
