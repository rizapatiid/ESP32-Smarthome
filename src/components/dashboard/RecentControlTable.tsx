"use client";

import Link from "next/link";
import { History, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { ControlLogItem } from "@/types/iot";

interface Props {
  logs: ControlLogItem[];
}

export default function RecentControlTable({ logs }: Props) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Riwayat Kontrol Terkini</h3>
            <p className="text-xs text-slate-500">
              5 perintah terakhir yang tersimpan di MySQL Hostinger
            </p>
          </div>
        </div>

        <Link
          href="/history/controls"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          <span>Lihat Semua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Belum ada riwayat perintah kontrol yang dicatat.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2 px-2">Waktu Eksekusi</th>
                <th className="py-2 px-2">Perangkat</th>
                <th className="py-2 px-2">Perintah</th>
                <th className="py-2 px-2">Diminta</th>
                <th className="py-2 px-2">Dikonfirmasi</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-2 text-slate-600 font-mono">
                    {new Date(log.executedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 px-2 font-medium text-slate-800">
                    {log.deviceId}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.command}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`font-semibold ${
                        log.requestedState ? "text-amber-600" : "text-slate-500"
                      }`}
                    >
                      {log.requestedState ? "ON" : "OFF"}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    {log.confirmedState !== null ? (
                      <span
                        className={`font-semibold ${
                          log.confirmedState ? "text-amber-600" : "text-slate-500"
                        }`}
                      >
                        {log.confirmedState ? "ON" : "OFF"}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    {log.status === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        SUCCESS
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
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
      )}
    </div>
  );
}
