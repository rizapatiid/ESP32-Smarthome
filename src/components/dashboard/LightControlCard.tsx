"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Power,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { SmartLight } from "@/types/iot";

interface Props {
  lampState?: boolean;
  isSimulated: boolean;
  onToggle?: (targetState: boolean) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const DEFAULT_LIGHTS: SmartLight[] = [
  {
    id: "lamp-main",
    name: "Lampu Utama",
    pin: 2,
    state: false,
    isDefault: true,
  },
];

const AVAILABLE_GPIOS = [
  { pin: 4, label: "GPIO 4 (Pin I/O Bebas)" },
  { pin: 16, label: "GPIO 16 (Relay 2)" },
  { pin: 17, label: "GPIO 17 (Relay 3)" },
  { pin: 18, label: "GPIO 18 (Relay 4)" },
  { pin: 19, label: "GPIO 19 (Pin I/O)" },
  { pin: 23, label: "GPIO 23 (Pin I/O)" },
  { pin: 25, label: "GPIO 25 (Pin DAC/IO)" },
  { pin: 26, label: "GPIO 26 (Pin DAC/IO)" },
  { pin: 27, label: "GPIO 27 (Pin I/O)" },
  { pin: 32, label: "GPIO 32 (Pin ADC/IO)" },
  { pin: 33, label: "GPIO 33 (Pin ADC/IO)" },
];

export default function LightControlCard({ lampState, isSimulated }: Props) {
  const [lights, setLights] = useState<SmartLight[]>(DEFAULT_LIGHTS);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ message?: string; error?: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLampName, setNewLampName] = useState("");
  const [newLampPin, setNewLampPin] = useState<number>(4);
  const [modalLoading, setModalLoading] = useState(false);

  // Rename States
  const [editingLight, setEditingLight] = useState<SmartLight | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Load configured lights from backend
  const loadLights = useCallback(async () => {
    try {
      const res = await fetch("/api/control/lights");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.lights) && json.lights.length > 0) {
          // Sinkronkan state lampu utama jika lampState diberikan
          const synced = json.lights.map((l: SmartLight) => {
            if (l.isDefault && typeof lampState === "boolean") {
              return { ...l, state: lampState };
            }
            return l;
          });
          setLights(synced);
        }
      }
    } catch (err) {
      console.warn("Gagal memuat daftar lampu:", err);
    }
  }, [lampState]);

  useEffect(() => {
    loadLights();
  }, [loadLights]);

  // Sync default light state from parent prop
  useEffect(() => {
    if (typeof lampState === "boolean") {
      setLights((prev) =>
        prev.map((l) => (l.isDefault ? { ...l, state: lampState } : l))
      );
    }
  }, [lampState]);

  // Toggle single lamp
  const handleToggleLamp = async (light: SmartLight) => {
    if (loadingMap[light.id]) return;

    setLoadingMap((prev) => ({ ...prev, [light.id]: true }));
    setFeedback(null);

    const targetState = !light.state;

    try {
      const res = await fetch("/api/control/light", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: targetState,
          pin: light.pin,
          name: light.name,
          lightId: light.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update local state
        setLights((prev) =>
          prev.map((l) => (l.id === light.id ? { ...l, state: targetState } : l))
        );
        setFeedback({
          message: `${light.name} berhasil ${targetState ? "dinyalakan" : "dimatikan"}`,
        });
      } else {
        setFeedback({ error: data.error || `Gagal mengubah status ${light.name}` });
      }
    } catch (err: unknown) {
      setFeedback({
        error: err instanceof Error ? err.message : "Terjadi kesalahan saat kontrol lampu",
      });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [light.id]: false }));
    }
  };

  // Add new lamp
  const handleAddLamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLampName.trim()) return;

    setModalLoading(true);
    try {
      const res = await fetch("/api/control/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          name: newLampName.trim(),
          pin: newLampPin,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLights(json.lights);
        setIsAddModalOpen(false);
        setNewLampName("");
        setFeedback({ message: `Lampu "${newLampName.trim()}" berhasil ditambahkan!` });
      } else {
        setFeedback({ error: json.error || "Gagal menambahkan lampu" });
      }
    } catch (err) {
      setFeedback({ error: "Gagal menghubungi server untuk menambah lampu" });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete lamp
  const handleDeleteLamp = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}" dari daftar lampu?`)) return;

    try {
      const res = await fetch("/api/control/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLights(json.lights);
        setFeedback({ message: `Lampu "${name}" telah dihapus.` });
      }
    } catch (err) {
      setFeedback({ error: "Gagal menghapus lampu" });
    }
  };

  // Rename lamp
  const handleSaveRename = async () => {
    if (!editingLight || !editNameValue.trim()) return;

    try {
      const res = await fetch("/api/control/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          id: editingLight.id,
          name: editNameValue.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLights(json.lights);
        setEditingLight(null);
        setFeedback({ message: `Nama lampu berhasil diubah menjadi "${editNameValue.trim()}".` });
      }
    } catch (err) {
      setFeedback({ error: "Gagal menyimpan nama baru lampu" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Panel Kontrol Lampu */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Kontrol Lampu
          </h2>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {lights.length} Lampu
          </span>
        </div>

        <button
          onClick={() => {
            setNewLampName("");
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Lampu</span>
        </button>
      </div>

      {/* Grid Kartu Lampu */}
      <div
        className={`grid gap-3 ${
          lights.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {lights.map((light) => {
          const isLoading = Boolean(loadingMap[light.id]);
          const isOn = light.state;

          return (
            <div
              key={light.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex items-center justify-between gap-3 ${
                isOn
                  ? "bg-gradient-to-r from-amber-500/[0.08] via-white to-amber-500/[0.04] border-amber-300/80 shadow-[0_4px_16px_rgba(245,158,11,0.1)]"
                  : "bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              }`}
            >
              {/* Left: Icon & Lamp Status */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 relative ${
                    isOn
                      ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/30 scale-105"
                      : "bg-slate-100 text-slate-400 border border-slate-200/80"
                  }`}
                >
                  {isOn && (
                    <span className="absolute inset-0 rounded-2xl bg-amber-400/40 animate-ping -z-10" />
                  )}
                  <Lightbulb
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isOn ? "fill-white text-white drop-shadow" : "stroke-[1.8]"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                      {light.name}
                    </h3>
                    <button
                      onClick={() => {
                        setEditingLight(light);
                        setEditNameValue(light.name);
                      }}
                      title="Ubah nama lampu"
                      className="text-slate-300 hover:text-blue-600 p-0.5 rounded transition"
                    >
                      <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isOn ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-semibold ${
                        isOn ? "text-amber-600 font-bold" : "text-slate-400"
                      }`}
                    >
                      {isOn ? "Menyala (ON)" : "Padam (OFF)"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 border-l border-slate-200 pl-1.5 shrink-0">
                      GPIO {light.pin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleLamp(light)}
                  disabled={isLoading}
                  className={`inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs ${
                    isOn
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 active:scale-95"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                      <span className="hidden sm:inline">Proses...</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{isOn ? "Matikan" : "Nyalakan"}</span>
                    </>
                  )}
                </button>

                {!light.isDefault && (
                  <button
                    onClick={() => handleDeleteLamp(light.id, light.name)}
                    title="Hapus lampu"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Bar */}
      {feedback && (
        <div className="pt-1">
          {feedback.message && (
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-emerald-500 hover:text-emerald-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {feedback.error && (
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-rose-800 bg-rose-50/80 border border-rose-200 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{feedback.error}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Lampu Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tambah Lampu Baru</h3>
                  <p className="text-[11px] text-slate-400">Beri nama & pilih pin GPIO ESP32</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLamp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Lampu</label>
                <input
                  type="text"
                  placeholder="Contoh: Lampu Teras Depan"
                  value={newLampName}
                  onChange={(e) => setNewLampName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Pin GPIO ESP32 (Hardware)
                </label>
                <select
                  value={newLampPin}
                  onChange={(e) => setNewLampPin(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white transition"
                >
                  {AVAILABLE_GPIOS.map((g) => (
                    <option key={g.pin} value={g.pin}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pin GPIO ini akan dikendalikan otomatis oleh ESP32 (Relay / LED).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !newLampName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50 text-xs"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Lampu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Nama Lampu */}
      {editingLight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ubah Nama Lampu</h3>
              <button
                onClick={() => setEditingLight(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Baru</label>
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setEditingLight(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveRename}
                  disabled={!editNameValue.trim()}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50 text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
