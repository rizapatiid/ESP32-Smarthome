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
} from "lucide-react";
import { ControlLogItem } from "@/types/iot";

export default function ControlHistoryPage() {
  const [logs, setLogs] = useState<ControlLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (deviceId) params.set("deviceId", deviceId);

      const res = await fetch(`/api/control/history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err: unknown) {
      console.error("Gagal memuat log kontrol:", err);
    } finally {
      setLoading(false);
    }
  }, [page, deviceId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Riwayat Kontrol Aktuator
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log audit seluruh perintah kontrol lampu dengan verifikasi konfirmasi hardware di MySQL
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang Log</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari ID Perangkat..."
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
          />
        </div>
      </div>

      {/* Tabel Control Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Tabel control_logs ({total} catatan)</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Belum ada riwayat perintah kontrol yang tersimpan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Waktu Eksekusi</th>
                  <th className="py-3 px-4">Perangkat Tujuan</th>
                  <th className="py-3 px-4">Perintah</th>
                  <th className="py-3 px-4">Diminta</th>
                  <th className="py-3 px-4">Dikonfirmasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Keterangan / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-700 font-mono whitespace-nowrap">
                      {new Date(log.executedAt).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 font-mono">
                      {log.deviceId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                        {log.command}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          log.requestedState ? "text-amber-600" : "text-slate-600"
                        }`}
                      >
                        {log.requestedState ? "ON (Menyala)" : "OFF (Mati)"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.confirmedState !== null ? (
                        <span
                          className={`font-semibold ${
                            log.confirmedState ? "text-amber-600" : "text-slate-600"
                          }`}
                        >
                          {log.confirmedState ? "ON (Menyala)" : "OFF (Mati)"}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Tidak terkonfirmasi</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {log.errorMessage ? (
                        <span className="text-rose-600 font-mono text-[11px]">
                          {log.errorMessage}
                        </span>
                      ) : log.isSimulated ? (
                        <span className="text-amber-700 text-[11px]">Dikonfirmasi oleh simulator</span>
                      ) : (
                        <span className="text-emerald-700 text-[11px]">Dikonfirmasi oleh ESP32</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Halaman {page} dari {totalPages} (Total: {total} perintah)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
