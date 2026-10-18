"use client";

import { useState } from "react";
import { Lightbulb, Power, Loader2, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

interface Props {
  lampState: boolean;
  isSimulated: boolean;
  onToggle: (targetState: boolean) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export default function LightControlCard({ lampState, isSimulated, onToggle }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    setLastError(null);
    setLastMessage(null);

    const targetState = !lampState;
    try {
      const result = await onToggle(targetState);
      if (result.success) {
        setLastMessage(result.message || `Lampu berhasil ${targetState ? "dinyalakan" : "dimatikan"}`);
      } else {
        setLastError(result.error || "Gagal mengubah status lampu");
      }
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : "Terjadi kesalahan kontrol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        lampState
          ? "bg-gradient-to-br from-amber-500/[0.08] via-white to-amber-500/[0.03] border-amber-300/80 shadow-[0_4px_20px_rgba(245,158,11,0.12)]"
          : "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info & Visual Icon */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
              lampState
                ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/30 scale-105"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {lampState && (
              <span className="absolute inset-0 rounded-2xl bg-amber-400/40 animate-ping -z-10" />
            )}
            <Lightbulb
              className={`w-7 h-7 transition-transform duration-300 ${
                lampState ? "fill-white text-white drop-shadow" : "stroke-1"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                Kontrol Lampu (LED)
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isSimulated
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {isSimulated ? "SIMULASI" : "ESP32 HARDWARE"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Simulasi Aktuator • ESP32 Pin GPIO 2</span>
            </p>
          </div>
        </div>

        {/* Right Status Badge & Big Toggle Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Kondisi Aktuator
            </span>
            <span
              className={`text-sm font-extrabold tracking-tight ${
                lampState ? "text-amber-600" : "text-slate-500"
              }`}
            >
              {lampState ? "MENYALA (ON)" : "PADAM (OFF)"}
            </span>
          </div>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md ${
              lampState
                ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-rose-600/20 active:scale-95"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/20 active:scale-95"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menunggu ESP32...</span>
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                <span>{lampState ? "Matikan Lampu" : "Nyalakan Lampu"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Feedback Bar */}
      {(lastMessage || lastError) && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          {lastMessage && !loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{lastMessage}</span>
            </div>
          )}

          {lastError && !loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 bg-rose-50/80 border border-rose-200 p-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{lastError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
