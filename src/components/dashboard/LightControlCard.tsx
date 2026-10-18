"use client";

import { useState } from "react";
import { Lightbulb, Power, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

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
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              lampState
                ? "bg-amber-100 text-amber-600 shadow-md shadow-amber-400/20"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Lightbulb className={`w-5 h-5 ${lampState ? "fill-amber-500" : ""}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Kontrol Lampu (LED)</h3>
            <p className="text-xs text-slate-500">
              Simulasi Aktuator • ESP32 GPIO 2
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            isSimulated
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {isSimulated ? "SIMULASI" : "ESP32 HARDWARE"}
        </span>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full transition ${
              lampState ? "bg-amber-500 shadow-sm shadow-amber-400" : "bg-slate-300"
            }`}
          />
          <div>
            <span className="text-sm font-semibold text-slate-800 block">
              Status Terkonfirmasi: {lampState ? "MENYALA (ON)" : "MATI (OFF)"}
            </span>
            <span className="text-xs text-slate-500 block">
              {lampState
                ? "LED aktif mengalirkan arus tegangan tinggi"
                : "LED dalam kondisi padam non-aktif"}
            </span>
          </div>
        </div>

        {/* Tombol Toggle Kontrol */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm ${
            lampState
              ? "bg-rose-600 hover:bg-rose-700 text-white focus:ring-4 focus:ring-rose-100"
              : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-4 focus:ring-blue-100"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menunggu Konfirmasi...</span>
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              <span>{lampState ? "Matikan Lampu (OFF)" : "Nyalakan Lampu (ON)"}</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Messages */}
      {lastMessage && !loading && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{lastMessage}</span>
        </div>
      )}

      {lastError && !loading && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{lastError}</span>
        </div>
      )}
    </div>
  );
}
