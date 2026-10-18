"use client";

import Link from "next/link";
import { History, CheckCircle2, XCircle, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { ControlLogItem } from "@/types/iot";

interface Props {
  logs: ControlLogItem[];
}

export default function RecentControlTable({ logs }: Props) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              Aktivitas Kontrol Terkini
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate">
              Audit log perintah yang terkonfirmasi
            </p>
          </div>
        </div>

        <Link
          href="/history/controls"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/50 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition"
        >
          <span>Lihat Semua</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          Belum ada riwayat perintah kontrol yang dieksekusi.
        </div>
      ) : (
        <>
          {/* Mobile Card List (sm:hidden) */}
          <div className="sm:hidden space-y-2">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(log.executedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  {log.status === "SUCCESS" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      SUCCESS
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                      title={log.errorMessage || undefined}
                    >
                      <XCircle className="w-3 h-3" />
                      FAILED
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                      {log.command}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px] truncate max-w-[110px]">
                      {log.deviceId}
                    </span>
                  </div>

                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      (log.confirmedState !== null ? log.confirmedState : log.requestedState)
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {(log.confirmedState !== null ? log.confirmedState : log.requestedState)
                      ? "ON"
                      : "OFF"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Perangkat</th>
                  <th className="py-2.5 px-3">Perintah</th>
                  <th className="py-2.5 px-3">Status Diminta</th>
                  <th className="py-2.5 px-3">Konfirmasi Hardware</th>
                  <th className="py-2.5 px-3">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 text-slate-600 font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(log.executedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 font-mono">
                      {log.deviceId}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200/60">
                        {log.command}
                      </span>
                    </td>
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3">
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
                        <span className="text-slate-400 italic">Belum terkonfirmasi</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {log.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          SUCCESS
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200"
                          title={log.errorMessage || undefined}
                        >
                          <XCircle className="w-3 h-3" />
                          FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
