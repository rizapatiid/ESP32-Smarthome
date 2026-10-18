"use client";

import React, { useState } from "react";
import {
  X,
  Cpu,
  Layers,
  Thermometer,
  Sun,
  Lightbulb,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export interface ConfiguredLight {
  id: string;
  name: string;
  pin: number;
  state?: boolean;
  isDefault?: boolean;
}

interface WiringSchematicModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuredLights?: ConfiguredLight[];
}

export default function WiringSchematicModal({
  isOpen,
  onClose,
  configuredLights = [],
}: WiringSchematicModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "diagram">("summary");

  if (!isOpen) return null;

  const effectiveLights: ConfiguredLight[] =
    configuredLights.length > 0
      ? configuredLights
      : [{ id: "lamp-main", name: "Lampu Utama", pin: 2, isDefault: true }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bersih & Ringkas */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Skema Perakitan ESP32
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Database className="w-2.5 h-2.5" />
                  <span>{effectiveLights.length} Relay di DB</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Panduan pengkabelan sensor &amp; modul relay lampu ke pin GPIO ESP32.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Ringkasan Pinout vs Diagram Grafis */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg transition ${
                activeTab === "summary"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Daftar Sambungan Pin</span>
            </button>
            <button
              onClick={() => setActiveTab("diagram")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg transition ${
                activeTab === "diagram"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Diagram Sirkuit</span>
            </button>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            ESP32 DevKit V1 (30 Pin)
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ============================================================== */}
          {/* TAB 1: RINGKASAN PINOUT (Bersih, Rapi, Langsung Paham)         */}
          {/* ============================================================== */}
          {activeTab === "summary" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Grid 3 Kartu Komponen Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Sensor DHT22 */}
                <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                      DHT22 (Suhu)
                    </span>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                      Digital
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-blue-100/60">
                      <span className="text-slate-500 text-[11px]">Pin Data</span>
                      <span className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                        GPIO 4
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-blue-100/60">
                      <span className="text-slate-500 text-[11px]">VCC (Daya)</span>
                      <span className="font-mono font-bold text-rose-600 text-[11px]">3.3V (3V3)</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 text-[11px]">GND (Ground)</span>
                      <span className="font-mono font-bold text-slate-600 text-[11px]">GND</span>
                    </div>
                  </div>
                </div>

                {/* 2. Sensor BH1750 */}
                <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      BH1750 (Cahaya)
                    </span>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                      I2C Bus
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-amber-100/60">
                      <span className="text-slate-500 text-[11px]">Pin SDA</span>
                      <span className="font-mono font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
                        GPIO 21
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-amber-100/60">
                      <span className="text-slate-500 text-[11px]">Pin SCL</span>
                      <span className="font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                        GPIO 22
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 text-[11px]">VCC &amp; GND</span>
                      <span className="font-mono font-bold text-slate-700 text-[11px]">3.3V &amp; GND</span>
                    </div>
                  </div>
                </div>

                {/* 3. Power Relay Module */}
                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                      Relay (Daya)
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Koil 5V
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-emerald-100/60">
                      <span className="text-slate-500 text-[11px]">VCC Koil</span>
                      <span className="font-mono font-bold text-rose-600 text-[11px]">VIN (5V)</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-emerald-100/60">
                      <span className="text-slate-500 text-[11px]">GND Koil</span>
                      <span className="font-mono font-bold text-slate-600 text-[11px]">GND</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 text-[11px]">Kanal Aktif</span>
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">
                        {effectiveLights.length} Relay DB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Pin Relay Lampu Tersimpan di MySQL */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>Jalur Kabel Relay Lampu (Tersinkron Database MySQL)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Otomatis diperbarui saat tambah/hapus lampu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {effectiveLights.map((light, idx) => (
                    <div
                      key={light.id}
                      className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              light.isDefault
                                ? "bg-emerald-500"
                                : idx % 2 === 1
                                ? "bg-purple-500"
                                : "bg-orange-500"
                            }`}
                          />
                          <span className="font-bold text-slate-900 text-xs truncate block">
                            {light.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Channel Relay {idx + 1} ({light.isDefault ? "Utama" : "Eksternal"})
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono font-extrabold text-xs shadow-2xs">
                          GPIO {light.pin}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabel Rujukan Kabel Jumper Lengkap */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Komponen</th>
                      <th className="py-2.5 px-3">Pin Komponen</th>
                      <th className="py-2.5 px-3">Pin ESP32</th>
                      <th className="py-2.5 px-3">Warna Standar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">DHT22</td>
                      <td className="py-2 px-3 font-mono">Data</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">GPIO 4 (D4)</td>
                      <td className="py-2 px-3 text-slate-600">🔵 Biru</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">BH1750</td>
                      <td className="py-2 px-3 font-mono">SDA</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-700">GPIO 21 (D21)</td>
                      <td className="py-2 px-3 text-slate-600">🟡 Kuning</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">BH1750</td>
                      <td className="py-2 px-3 font-mono">SCL</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700">GPIO 22 (D22)</td>
                      <td className="py-2 px-3 text-slate-600">🟢 Hijau</td>
                    </tr>
                    {effectiveLights.map((light, idx) => (
                      <tr key={light.id} className="bg-emerald-50/15">
                        <td className="py-2 px-3 font-bold text-slate-900">{light.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">IN{idx + 1} (Relay)</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-800">
                          GPIO {light.pin} (D{light.pin})
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {idx === 0 ? "🟣 Ungu" : idx === 1 ? "🟠 Oranye" : "🔵 Sian"}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">Relay Power</td>
                      <td className="py-2 px-3 font-mono">VCC</td>
                      <td className="py-2 px-3 font-mono font-bold text-rose-700">VIN (5V)</td>
                      <td className="py-2 px-3 text-slate-600">🔴 Merah</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DIAGRAM SIRKUIT (Skala Penuh, Responsif, Tidak Terpotong) */}
          {/* ============================================================== */}
          {activeTab === "diagram" && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-hidden">
                <svg
                  viewBox="0 0 620 340"
                  className="w-full h-auto select-none"
                  style={{ maxHeight: "360px" }}
                >
                  <defs>
                    <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>

                  {/* ESP32 DEV BOARD (Left) */}
                  <rect
                    x="25"
                    y="30"
                    width="140"
                    height="280"
                    rx="10"
                    fill="url(#boardGrad)"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                  <rect x="45" y="55" width="100" height="85" rx="5" fill="#475569" stroke="#64748b" />
                  <text x="95" y="98" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ESP32
                  </text>
                  <text x="95" y="112" fill="#cbd5e1" fontSize="7" textAnchor="middle">
                    WROOM-32
                  </text>
                  <rect x="65" y="295" width="60" height="15" rx="3" fill="#94a3b8" />

                  {/* Pin Labels on ESP32 Left Header */}
                  <text x="35" y="165" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    3V3
                  </text>
                  <text x="35" y="185" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    GND
                  </text>
                  <text x="35" y="210" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    GPIO 4
                  </text>
                  <text x="35" y="235" fill="#fde047" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    GPIO 21
                  </text>
                  <text x="35" y="255" fill="#4ade80" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    GPIO 22
                  </text>
                  <text x="135" y="165" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                    VIN (5V)
                  </text>

                  {/* Components on Right */}
                  {/* 1. DHT22 */}
                  <rect x="430" y="30" width="165" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.2" />
                  <text x="445" y="50" fill="#ffffff" fontSize="10" fontWeight="bold">
                    DHT22 (Suhu/Kelembapan)
                  </text>
                  <text x="445" y="65" fill="#93c5fd" fontSize="8" fontFamily="monospace">
                    Data ➔ GPIO 4 | 3.3V
                  </text>

                  {/* 2. BH1750 */}
                  <rect x="430" y="110" width="165" height="65" rx="8" fill="#1e293b" stroke="#eab308" strokeWidth="1.2" />
                  <text x="445" y="130" fill="#ffffff" fontSize="10" fontWeight="bold">
                    BH1750 (Cahaya I2C)
                  </text>
                  <text x="445" y="145" fill="#fde047" fontSize="8" fontFamily="monospace">
                    SDA ➔ 21 | SCL ➔ 22
                  </text>

                  {/* 3. Relay Block with Dynamic Lamps */}
                  <rect x="430" y="190" width="165" height="120" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="1.2" />
                  <text x="445" y="210" fill="#4ade80" fontSize="10" fontWeight="bold">
                    Modul Relay ({effectiveLights.length} Lampu DB)
                  </text>
                  {effectiveLights.slice(0, 3).map((light, idx) => (
                    <text
                      key={light.id}
                      x="445"
                      y={230 + idx * 20}
                      fill={idx === 0 ? "#c084fc" : idx === 1 ? "#fb923c" : "#38bdf8"}
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      • {light.name.substring(0, 10)} ➔ D{light.pin}
                    </text>
                  ))}

                  {/* Clean Connection Lines */}
                  {/* GPIO 4 to DHT22 */}
                  <path d="M 75 208 C 250 208, 300 65, 430 65" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                  {/* GPIO 21 to BH1750 SDA */}
                  <path d="M 80 232 C 260 232, 320 142, 430 142" fill="none" stroke="#eab308" strokeWidth="2.5" />
                  {/* GPIO 22 to BH1750 SCL */}
                  <path d="M 80 252 C 260 252, 340 155, 430 155" fill="none" stroke="#22c55e" strokeWidth="2.5" />

                  {/* Relays from DB */}
                  {effectiveLights.map((light, idx) => {
                    const startY = 270 + idx * 12;
                    const endY = 227 + idx * 20;
                    const strokeColor = idx === 0 ? "#c084fc" : idx === 1 ? "#fb923c" : "#38bdf8";
                    return (
                      <path
                        key={light.id}
                        d={`M 140 ${startY} C 280 ${startY}, 350 ${endY}, 430 ${endY}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                      />
                    );
                  })}
                </svg>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Semua jalur kabel relay di atas terhubung secara otomatis ke pin lampu yang Anda daftarkan di dashboard.
              </p>
            </div>
          )}

          {/* Tips Keamanan Listrik Singkat */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs flex items-center gap-2 text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              <strong>Keamanan:</strong> Matikan saklar PLN saat memasang kabel lampu 220V ke terminal relay (*COM* dan *NO*).
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <span className="text-[11px] text-slate-400">
            Tersinkronisasi otomatis dengan database MySQL.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition active:scale-95 shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
