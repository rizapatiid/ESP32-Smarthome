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
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        lampState
          ? "bg-gradient-to-r from-amber-500/[0.08] via-white to-amber-500/[0.04] border-amber-300/80 shadow-[0_4px_20px_rgba(245,158,11,0.1)]"
          : "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon & Lamp Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 relative ${
              lampState
                ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/30 scale-105"
                : "bg-slate-100 text-slate-400 border border-slate-200/80"
            }`}
          >
            {lampState && (
              <span className="absolute inset-0 rounded-2xl bg-amber-400/40 animate-ping -z-10" />
            )}
            <Lightbulb
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                lampState ? "fill-white text-white drop-shadow" : "stroke-[1.8]"
              }`}
            />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              Lampu Utama
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  lampState ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  lampState ? "text-amber-600 font-bold" : "text-slate-400"
                }`}
              >
                {lampState ? "Menyala (ON)" : "Padam (OFF)"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Compact Tactile Action Button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs ${
            lampState
              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 active:scale-95"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{lampState ? "Matikan" : "Nyalakan"}</span>
            </>
          )}
        </button>
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
