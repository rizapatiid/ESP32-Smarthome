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
} from "lucide-react";
import { ControlLogItem } from "@/types/iot";

export default function ControlHistoryPage() {
  const [logs, setLogs] = useState<ControlLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "SUCCESS" | "FAILED">("all");

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Kontrol Aktuator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit log perintah kendali lampu yang terkonfirmasi di database Hostinger MySQL
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang Log</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:max-w-md text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari ID Perangkat..."
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 self-end sm:self-auto">
          <span>Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="SUCCESS">Hanya Sukses</option>
            <option value="FAILED">Hanya Gagal</option>
          </select>
        </div>
      </div>

      {/* Tabel Control Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Tabel control_logs ({total} catatan)</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada catatan perintah kontrol yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Waktu Eksekusi</th>
                  <th className="py-3 px-4">Perangkat</th>
                  <th className="py-3 px-4">Perintah</th>
                  <th className="py-3 px-4">Diminta</th>
                  <th className="py-3 px-4">Dikonfirmasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Keterangan</th>
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
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Halaman {page} dari {totalPages} ({total} perintah)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
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
