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

const STORAGE_KEY = "smarthome_configured_lights_v1";

const saveToStorage = (list: SmartLight[]) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn("Gagal menyimpan ke localStorage:", e);
  }
};

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

  // Load configured lights from backend (tidak bergantung pada lampState)
  const loadLights = useCallback(async () => {
    try {
      const res = await fetch("/api/control/lights");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.lights) && json.lights.length > 0) {
          setLights((prev) => {
            // Server sebagai sumber utama, pertahankan lampu lokal jika belum tersinkron
            const serverIds = new Set(json.lights.map((l: SmartLight) => l.id));
            const localOnly = prev.filter((l) => !l.isDefault && !serverIds.has(l.id));
            const merged = [...json.lights, ...localOnly];
            saveToStorage(merged);
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn("Gagal memuat daftar lampu dari server:", err);
    }
  }, []);

  // Inisialisasi awal: pulihkan seketika dari localStorage (anti hilang / anti flicker) lalu load dari server
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLights(parsed);
          }
        }
      }
    } catch {}

    loadLights();
  }, [loadLights]);

  // Sinkronkan HANYA status lampu utama (isDefault) ketika ada polling lampState dari parent
  useEffect(() => {
    if (typeof lampState === "boolean") {
      setLights((prev) => {
        const defaultLight = prev.find((l) => l.isDefault);
        if (defaultLight && defaultLight.state === lampState) {
          return prev;
        }
        const updated = prev.map((l) => (l.isDefault ? { ...l, state: lampState } : l));
        saveToStorage(updated);
        return updated;
      });
    }
  }, [lampState]);

  // Toggle single lamp
  const handleToggleLamp = async (light: SmartLight) => {
    if (loadingMap[light.id]) return;

    setLoadingMap((prev) => ({ ...prev, [light.id]: true }));
    setFeedback(null);

    const targetState = !light.state;

    // 1. Optimistic update: langsung ubah di UI dan simpan ke localStorage seketika
    setLights((prev) => {
      const updated = prev.map((l) => (l.id === light.id ? { ...l, state: targetState } : l));
      saveToStorage(updated);
      return updated;
    });

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
        setFeedback({
          message: `${light.name} berhasil ${targetState ? "dinyalakan" : "dimatikan"}`,
        });
      } else {
        // Rollback jika gagal
        setLights((prev) => {
          const reverted = prev.map((l) => (l.id === light.id ? { ...l, state: light.state } : l));
          saveToStorage(reverted);
          return reverted;
        });
        setFeedback({ error: data.error || `Gagal mengubah status ${light.name}` });
      }
    } catch (err: unknown) {
      // Rollback jika error koneksi
      setLights((prev) => {
        const reverted = prev.map((l) => (l.id === light.id ? { ...l, state: light.state } : l));
        saveToStorage(reverted);
        return reverted;
      });
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
    const trimmedName = newLampName.trim();
    if (!trimmedName) return;

    setModalLoading(true);

    // Buat objek lampu baru secara lokal seketika
    const newLight: SmartLight = {
      id: `lamp-${Date.now()}`,
      name: trimmedName,
      pin: newLampPin,
      state: false,
      isDefault: false,
    };

    // Langsung masukkan ke state & localStorage agar tidak pernah hilang
    setLights((prev) => {
      const updated = [...prev, newLight];
      saveToStorage(updated);
      return updated;
    });

    setIsAddModalOpen(false);
    setNewLampName("");

    try {
      const res = await fetch("/api/control/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          name: trimmedName,
          pin: newLampPin,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.lights)) {
        setLights(json.lights);
        saveToStorage(json.lights);
        setFeedback({ message: `Lampu "${trimmedName}" berhasil ditambahkan & disimpan permanen!` });
      } else {
        setFeedback({ message: `Lampu "${trimmedName}" tersimpan di perangkat lokal.` });
      }
    } catch (err) {
      setFeedback({ message: `Lampu "${trimmedName}" tersimpan secara lokal.` });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete lamp
  const handleDeleteLamp = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}" dari daftar lampu?`)) return;

    // Optimistic delete
    setLights((prev) => {
      const updated = prev.filter((l) => l.id !== id || l.isDefault);
      saveToStorage(updated);
      return updated;
    });

    try {
      const res = await fetch("/api/control/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.lights)) {
        setLights(json.lights);
        saveToStorage(json.lights);
        setFeedback({ message: `Lampu "${name}" telah dihapus.` });
      }
    } catch (err) {
      setFeedback({ error: "Gagal menghapus lampu dari server" });
    }
  };

  // Rename lamp
  const handleSaveRename = async () => {
    if (!editingLight || !editNameValue.trim()) return;

    const targetId = editingLight.id;
    const newName = editNameValue.trim();

    // Optimistic rename
    setLights((prev) => {
      const updated = prev.map((l) => (l.id === targetId ? { ...l, name: newName } : l));
      saveToStorage(updated);
      return updated;
    });

    setEditingLight(null);

    try {
      const res = await fetch("/api/control/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          id: targetId,
          name: newName,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.lights)) {
        setLights(json.lights);
        saveToStorage(json.lights);
        setFeedback({ message: `Nama lampu berhasil diubah menjadi "${newName}".` });
      }
    } catch (err) {
      setFeedback({ error: "Gagal menyimpan nama baru lampu ke database" });
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
        className={`grid gap-3.5 ${
          lights.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {lights.map((light) => {
          const isLoading = Boolean(loadingMap[light.id]);
          const isOn = light.state;

          return (
            <div
              key={light.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex items-center justify-between gap-3 sm:gap-4 ${
                isOn
                  ? "bg-gradient-to-r from-amber-500/[0.08] via-white to-amber-500/[0.03] border-amber-300/80 shadow-[0_4px_16px_rgba(245,158,11,0.08)]"
                  : "bg-white border-slate-200 hover:border-slate-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              }`}
            >
              {/* Left: Icon & Lamp Info */}
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 relative ${
                    isOn
                      ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/25 scale-102"
                      : "bg-slate-100 text-slate-400 border border-slate-200/80"
                  }`}
                >
                  {isOn && (
                    <span className="absolute inset-0 rounded-2xl bg-amber-400/30 animate-ping -z-10" />
                  )}
                  <Lightbulb
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isOn ? "fill-white text-white drop-shadow" : "stroke-[1.8]"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Nama Lampu & Aksi Edit/Hapus */}
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                      {light.name}
                    </h3>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingLight(light);
                          setEditNameValue(light.name);
                        }}
                        title="Ubah nama lampu"
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>

                      {!light.isDefault && (
                        <button
                          onClick={() => handleDeleteLamp(light.id, light.name)}
                          title="Hapus lampu"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Baris Tunggal (Tidak Pernah Terpotong / Wrap) */}
                  <div className="flex items-center gap-2 mt-1 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isOn ? "bg-amber-500 animate-pulse" : "bg-slate-300"
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          isOn ? "text-amber-600 font-bold" : "text-slate-500"
                        }`}
                      >
                        {isOn ? "Menyala" : "Padam"}
                      </span>
                    </div>

                    <span className="text-slate-300 font-light select-none">·</span>

                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded-md border border-slate-200/70 shrink-0">
                      GPIO {light.pin}
                    </span>

                    {light.isDefault && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/60 shrink-0 hidden sm:inline">
                        Utama
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Tombol Saklar Terpasang Seragam di Kanan */}
              <button
                onClick={() => handleToggleLamp(light)}
                disabled={isLoading}
                className={`w-26 sm:w-28 h-9 sm:h-10 shrink-0 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs ${
                  isOn
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/90 active:scale-95"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Proses...</span>
                  </>
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>{isOn ? "Matikan" : "Nyalakan"}</span>
                  </>
                )}
              </button>
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
