"use client";

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  Thermometer,
  Sun,
  Lightbulb,
  Database,
  ZoomIn,
  ShieldAlert,
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

type ComponentFilter = "all" | "dht22" | "bh1750" | "relay";

const LIGHT_PALETTES = [
  { stroke: "#c084fc", fill: "#581c87", text: "#f3e8ff", bg: "bg-purple-100", textCls: "text-purple-800", dot: "bg-purple-600", name: "Ungu" },
  { stroke: "#fb923c", fill: "#7c2d12", text: "#ffedd5", bg: "bg-orange-100", textCls: "text-orange-800", dot: "bg-orange-500", name: "Oranye" },
  { stroke: "#38bdf8", fill: "#164e63", text: "#e0f2fe", bg: "bg-sky-100", textCls: "text-sky-800", dot: "bg-sky-500", name: "Biru Langit" },
  { stroke: "#a3e635", fill: "#365314", text: "#f7fee7", bg: "bg-lime-100", textCls: "text-lime-800", dot: "bg-lime-500", name: "Lime" },
  { stroke: "#f472b6", fill: "#831843", text: "#fdf2f8", bg: "bg-pink-100", textCls: "text-pink-800", dot: "bg-pink-500", name: "Pink" },
];

export default function WiringSchematicModal({
  isOpen,
  onClose,
  configuredLights = [],
}: WiringSchematicModalProps) {
  const [activeFilter, setActiveFilter] = useState<ComponentFilter>("all");
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  if (!isOpen) return null;

  // Fallback lampu jika DB kosong
  const effectiveLights: ConfiguredLight[] =
    configuredLights.length > 0
      ? configuredLights
      : [
          { id: "lamp-main", name: "Lampu Utama", pin: 2, isDefault: true },
          { id: "lamp-teras", name: "LAMPU TERAS", pin: 16, isDefault: false },
          { id: "lamp-dapur", name: "LAMPU DAPUR", pin: 18, isDefault: false },
        ];

  const isDhtActive = activeFilter === "all" || activeFilter === "dht22";
  const isBhActive = activeFilter === "all" || activeFilter === "bh1750";
  const isRelayActive = activeFilter === "all" || activeFilter === "relay";

  // Dimensi modul relay dinamis berdasarkan jumlah lampu di database
  const relayCount = effectiveLights.length;
  const relayModuleHeight = Math.max(220, 80 + relayCount * 56);
  const svgCanvasHeight = Math.max(560, 290 + relayModuleHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-5xl xl:max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header Modal - Clean & Simple Mobile */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2.5 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-base tracking-tight truncate">
                  Skema Visual ESP32 DevKit V1
                </h3>
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                  <Database className="w-2.5 h-2.5" />
                  <span>{effectiveLights.length} Relay Aktif</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                Diagram pengkabelan pin hardware yang presisi dan tersinkronisasi langsung dengan database.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Filter & Zoom - Single Clean Line on Mobile */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs py-0.5 min-w-0">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold transition text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer shrink-0 ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua<span className="hidden sm:inline"> Komponen</span>
            </button>
            <button
              onClick={() => setActiveFilter("dht22")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold transition text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer shrink-0 ${
                activeFilter === "dht22"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <Thermometer className="w-3 h-3" />
              <span>DHT22<span className="hidden sm:inline"> (Suhu)</span></span>
            </button>
            <button
              onClick={() => setActiveFilter("bh1750")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold transition text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer shrink-0 ${
                activeFilter === "bh1750"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>BH1750<span className="hidden sm:inline"> (Cahaya)</span></span>
            </button>
            <button
              onClick={() => setActiveFilter("relay")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold transition text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer shrink-0 ${
                activeFilter === "relay"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>Relay ({effectiveLights.length}<span className="hidden sm:inline"> Lampu</span>)</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] shrink-0 pl-1 border-l border-slate-100">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition whitespace-nowrap"
            >
              <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
              <span>{isZoomed ? "Reset" : "Zoom"}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* ============================================================== */}
          {/* DIAGRAM ELEKTRONIKA REALISTIS & RESPONSIF (SVG)                */}
          {/* ============================================================== */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-4 overflow-x-auto shadow-inner">
            <div
              className={`transition-all duration-200 ${
                isZoomed ? "min-w-[980px]" : "w-full"
              }`}
            >
              <svg
                viewBox={`0 0 980 ${svgCanvasHeight}`}
                className="w-full h-auto select-none"
                style={{ maxHeight: isZoomed ? "none" : "490px" }}
              >
                {/* Patterns & Gradients */}
                <defs>
                  <pattern id="pcbGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="0.75" fill="#334155" opacity="0.4" />
                  </pattern>
                  <linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="rfShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <rect width="980" height={svgCanvasHeight} fill="#090d16" rx="14" />
                <rect width="980" height={svgCanvasHeight} fill="url(#pcbGrid)" rx="14" />

                {/* ============================================================== */}
                {/* 1. ESP32 DevKit V1 Board (Center-Left)                         */}
                {/* ============================================================== */}
                <g transform="translate(60, 40)">
                  {/* Board PCB Outer */}
                  <rect
                    x="0"
                    y="0"
                    width="190"
                    height="490"
                    rx="12"
                    fill="url(#boardGrad)"
                    stroke="#3b82f6"
                    strokeWidth="1.8"
                  />
                  {/* Copper Mounting Holes */}
                  <circle cx="16" cy="16" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="174" cy="16" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="16" cy="474" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="174" cy="474" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />

                  {/* Micro-USB Port at Bottom */}
                  <rect x="70" y="472" width="50" height="20" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                  <rect x="80" y="480" width="30" height="9" rx="1.5" fill="#0f172a" />

                  {/* Metal RF Shield ESP-WROOM-32 */}
                  <rect x="25" y="45" width="140" height="120" rx="6" fill="url(#rfShieldGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Antenna Traces */}
                  <path d="M 45 45 L 45 30 L 65 30 L 65 45 M 85 45 L 85 30 L 105 30 L 105 45 M 125 45 L 125 30" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <text x="95" y="100" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    ESP-WROOM-32
                  </text>
                  <text x="95" y="118" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                    Wi-Fi 2.4GHz + BLE
                  </text>

                  {/* Blue LED GPIO 2 */}
                  <circle cx="155" cy="185" r="4" fill="#3b82f6" filter="url(#wireGlow)" />
                  <text x="145" y="188" fill="#60a5fa" fontSize="8" fontFamily="monospace" textAnchor="end">
                    LED D2
                  </text>

                  {/* Clear Centered Title (Zero Overlap with Pins!) */}
                  <text x="95" y="215" fill="#38bdf8" fontSize="11" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">
                    ESP32 DevKit V1
                  </text>
                  <text x="95" y="230" fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                    UDP Port: 8266
                  </text>

                  {/* LEFT HEADER PINS (Sensor & Relay Signals) */}
                  {/* 3V3 */}
                  <rect x="-6" y="145" width="12" height="9" rx="1.5" fill="#ef4444" />
                  <text x="12" y="153" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">3V3</text>

                  {/* GND */}
                  <rect x="-6" y="175" width="12" height="9" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <text x="12" y="183" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">GND</text>

                  {/* GPIO 4 (DHT22 Data) */}
                  <rect x="-6" y="260" width="12" height="9" rx="1.5" fill="#3b82f6" />
                  <text x="12" y="268" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    D4 (DHT22)
                  </text>

                  {/* GPIO 21 (BH1750 SDA) */}
                  <rect x="-6" y="295" width="12" height="9" rx="1.5" fill="#eab308" />
                  <text x="12" y="303" fill="#fde047" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    D21 (SDA)
                  </text>

                  {/* GPIO 22 (BH1750 SCL) */}
                  <rect x="-6" y="325" width="12" height="9" rx="1.5" fill="#22c55e" />
                  <text x="12" y="333" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    D22 (SCL)
                  </text>

                  {/* Dynamic Relay Pins from Database */}
                  {effectiveLights.map((light, idx) => {
                    const pinY = 365 + idx * 30;
                    const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                    return (
                      <g key={light.id}>
                        <rect x="-6" y={pinY - 5} width="12" height="9" rx="1.5" fill={pal.stroke} />
                        <text x="12" y={pinY + 3} fill={pal.stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">
                          D{light.pin} ({light.name.substring(0, 10)})
                        </text>
                      </g>
                    );
                  })}

                  {/* RIGHT HEADER PINS */}
                  {/* VIN (5V) */}
                  <rect x="184" y="145" width="12" height="9" rx="1.5" fill="#ef4444" />
                  <text x="178" y="153" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                    VIN (5V)
                  </text>

                  {/* GND Right */}
                  <rect x="184" y="175" width="12" height="9" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <text x="178" y="183" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                    GND
                  </text>
                </g>

                {/* ============================================================== */}
                {/* 2. Sensor DHT22 (Top-Right) — PIN PADA SISI KIRI MODUL         */}
                {/* ============================================================== */}
                <g
                  transform="translate(670, 35)"
                  className="transition-opacity duration-200"
                  opacity={isDhtActive ? 1 : 0.15}
                >
                  <rect x="0" y="0" width="250" height="110" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                  
                  {/* Judul Modul di Atas */}
                  <text x="16" y="22" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    DHT22 / AM2302
                  </text>
                  <text x="16" y="34" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif">
                    Sensor Suhu &amp; Kelembapan
                  </text>

                  {/* TERMINAL PIN PADA SISI KIRI (Menghadap kabel, tidak menabrak gambar/teks) */}
                  {/* Pin 1: VCC */}
                  <rect x="-6" y="44" width="12" height="8" rx="1.5" fill="#ef4444" />
                  <circle cx="0" cy="48" r="3.5" fill="#ef4444" />
                  <text x="12" y="52" fill="#fca5a5" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    1. VCC (3.3V)
                  </text>

                  {/* Pin 2: DATA */}
                  <rect x="-6" y="66" width="12" height="8" rx="1.5" fill="#3b82f6" />
                  <circle cx="0" cy="70" r="3.5" fill="#3b82f6" />
                  <text x="12" y="74" fill="#93c5fd" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    2. DATA (GPIO 4)
                  </text>

                  {/* Pin 4: GND */}
                  <rect x="-6" y="88" width="12" height="8" rx="1.5" fill="#94a3b8" />
                  <circle cx="0" cy="92" r="3.5" fill="#94a3b8" />
                  <text x="12" y="96" fill="#cbd5e1" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    4. GND (Ground)
                  </text>

                  {/* Gambar Sensor Putih Grille diletakkan di SISI KANAN (Aman, tidak dilalui kabel) */}
                  <g transform="translate(165, 38)">
                    <rect x="0" y="0" width="68" height="60" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="8" y1="12" x2="60" y2="12" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="22" x2="60" y2="22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="32" x2="60" y2="32" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="42" x2="60" y2="42" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="50" x2="60" y2="50" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 3. Sensor BH1750 (Middle-Right) — PIN PADA SISI KIRI MODUL     */}
                {/* ============================================================== */}
                <g
                  transform="translate(670, 160)"
                  className="transition-opacity duration-200"
                  opacity={isBhActive ? 1 : 0.15}
                >
                  <rect x="0" y="0" width="250" height="110" rx="10" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />
                  
                  {/* Judul Modul di Atas */}
                  <text x="16" y="22" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    BH1750FVI
                  </text>
                  <text x="16" y="34" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif">
                    Sensor Cahaya Lux (I2C)
                  </text>

                  {/* TERMINAL PIN PADA SISI KIRI (Menghadap kabel) */}
                  {/* Pin 1: VCC */}
                  <rect x="-6" y="42" width="12" height="8" rx="1.5" fill="#ef4444" />
                  <circle cx="0" cy="46" r="3.5" fill="#ef4444" />
                  <text x="12" y="50" fill="#fca5a5" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    VCC (3.3V)
                  </text>

                  {/* Pin 2: GND */}
                  <rect x="-6" y="60" width="12" height="8" rx="1.5" fill="#94a3b8" />
                  <circle cx="0" cy="64" r="3.5" fill="#94a3b8" />
                  <text x="12" y="68" fill="#cbd5e1" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    GND (Ground)
                  </text>

                  {/* Pin 3: SCL */}
                  <rect x="-6" y="78" width="12" height="8" rx="1.5" fill="#22c55e" />
                  <circle cx="0" cy="82" r="3.5" fill="#22c55e" />
                  <text x="12" y="86" fill="#4ade80" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    SCL ➔ GPIO 22
                  </text>

                  {/* Pin 4: SDA */}
                  <rect x="-6" y="96" width="12" height="8" rx="1.5" fill="#eab308" />
                  <circle cx="0" cy="100" r="3.5" fill="#eab308" />
                  <text x="12" y="104" fill="#fde047" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    SDA ➔ GPIO 21
                  </text>

                  {/* Kubah Optik Kaca diletakkan di SISI KANAN (Aman, tidak terpotong kabel) */}
                  <g transform="translate(195, 68)">
                    <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                    <circle cx="0" cy="0" r="14" fill="#38bdf8" fillOpacity="0.4" />
                    <circle cx="4" cy="-4" r="5" fill="#ffffff" fillOpacity="0.8" />
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 4. Modul Relay Multi-Channel dari Database (Bottom-Right)       */}
                {/* ============================================================== */}
                <g
                  transform="translate(620, 285)"
                  className="transition-opacity duration-200"
                  opacity={isRelayActive ? 1 : 0.15}
                >
                  <rect
                    x="0"
                    y="0"
                    width="300"
                    height={relayModuleHeight}
                    rx="12"
                    fill="#1e293b"
                    stroke="#22c55e"
                    strokeWidth="1.5"
                  />
                  <text x="16" y="22" fill="#4ade80" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    MODUL RELAY MULTI-CHANNEL (DATABASE)
                  </text>
                  <text x="16" y="35" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
                    Tersinkronisasi otomatis dengan {effectiveLights.length} lampu di MySQL
                  </text>

                  {/* TERMINAL PIN INPUT PADA SISI KIRI ATAS */}
                  {/* VCC 5V */}
                  <g transform="translate(0, 48)">
                    <rect x="-6" y="-4" width="12" height="8" rx="1.5" fill="#ef4444" />
                    <circle cx="0" cy="0" r="3.5" fill="#ef4444" />
                    <text x="12" y="3" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      VCC (5V VIN)
                    </text>
                  </g>

                  {/* GND */}
                  <g transform="translate(0, 66)">
                    <rect x="-6" y="-4" width="12" height="8" rx="1.5" fill="#94a3b8" />
                    <circle cx="0" cy="0" r="3.5" fill="#94a3b8" />
                    <text x="12" y="3" fill="#cbd5e1" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      GND
                    </text>
                  </g>

                  {/* Channel Relay Sesuai Lampu Database */}
                  {effectiveLights.map((light, idx) => {
                    const blockY = 82 + idx * 56;
                    const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                    return (
                      <g key={light.id} transform={`translate(0, ${blockY})`}>
                        {/* Terminal Pin Input Sinyal pada Sisi Kiri Luar (x=0) */}
                        <rect x="-6" y="16" width="12" height="8" rx="1.5" fill={pal.stroke} />
                        <circle cx="0" cy="20" r="3.5" fill={pal.stroke} />
                        <text x="12" y="24" fill={pal.stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">
                          IN{idx + 1}
                        </text>

                        {/* Blue Relay Cube di Tengah */}
                        <rect x="45" y="0" width="85" height="42" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                        <text x="87" y="18" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                          CH {idx + 1}: D{light.pin}
                        </text>
                        <text x="87" y="30" fill="#bae6fd" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
                          {light.name.substring(0, 11)}
                        </text>

                        {/* Terminal Blok Baut Hijau */}
                        <rect x="140" y="2" width="24" height="38" rx="3" fill="#0f766e" />
                        <circle cx="152" cy="12" r="3" fill="#cbd5e1" />
                        <circle cx="152" cy="28" r="3" fill="#cbd5e1" />

                        {/* Ikon Lampu Menyala Kuning di Sisi Kanan */}
                        <g transform="translate(178, 6)">
                          <circle cx="14" cy="14" r="11" fill="#fbbf24" filter="url(#wireGlow)" fillOpacity="0.85" />
                          <text x="32" y="14" fill="#fef08a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                            {light.name}
                          </text>
                          <text x="32" y="25" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                            Pin D{light.pin} · {light.isDefault ? "Utama" : "Eksternal"}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>

                {/* ============================================================== */}
                {/* 5. JUMPER WIRES (LENGKUNGAN BERSIH TANPA MENABRAK KOMPONEN)    */}
                {/* ============================================================== */}

                {/* WIRE 1: DHT22 DATA (Biru) ➔ GPIO 4 */}
                {/* Berakhir TEPAT di x=670 y=105 (Pin 2 DATA sisi kiri box DHT22) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 300 C 15 300, 15 105, 380 105 C 500 105, 590 105, 670 105"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="300" r="4.5" fill="#3b82f6" />
                  <circle cx="670" cy="105" r="4.5" fill="#3b82f6" />
                  {/* Badge Label Mengambang */}
                  <rect x="360" y="95" width="95" height="18" rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                  <text x="407" y="108" fill="#bfdbfe" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 4 (DATA)
                  </text>
                </g>

                {/* WIRE 2: DHT22 VCC (Merah Putus-putus) ➔ 3.3V */}
                {/* Berakhir TEPAT di x=670 y=83 (Pin 1 VCC sisi kiri box DHT22) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 185 C 20 185, 20 83, 360 83 C 480 83, 580 83, 670 83"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="54" cy="185" r="4" fill="#ef4444" />
                  <circle cx="670" cy="83" r="4" fill="#ef4444" />
                </g>

                {/* WIRE 3: DHT22 GND (Abu-abu) ➔ GND */}
                {/* Berakhir TEPAT di x=670 y=127 (Pin 4 GND sisi kiri box DHT22) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 215 C 25 215, 25 127, 390 127 C 500 127, 590 127, 670 127"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="215" r="3.5" fill="#94a3b8" />
                  <circle cx="670" cy="127" r="3.5" fill="#94a3b8" />
                </g>

                {/* WIRE 4: BH1750 SDA (Kuning) ➔ GPIO 21 */}
                {/* Berakhir TEPAT di x=670 y=260 (Pin SDA sisi kiri box BH1750) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 335 C 10 335, 260 260, 480 260 C 560 260, 610 260, 670 260"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="335" r="4.5" fill="#eab308" />
                  <circle cx="670" cy="260" r="4.5" fill="#eab308" />
                  <rect x="360" y="251" width="85" height="18" rx="4" fill="#713f12" stroke="#eab308" strokeWidth="1" />
                  <text x="402" y="264" fill="#fef08a" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 21 (SDA)
                  </text>
                </g>

                {/* WIRE 5: BH1750 SCL (Hijau) ➔ GPIO 22 */}
                {/* Berakhir TEPAT di x=670 y=242 (Pin SCL sisi kiri box BH1750) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 365 C 15 365, 270 242, 490 242 C 560 242, 610 242, 670 242"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="365" r="4.5" fill="#22c55e" />
                  <circle cx="670" cy="242" r="4.5" fill="#22c55e" />
                  <rect x="460" y="233" width="85" height="18" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="1" />
                  <text x="502" y="246" fill="#bbf7d0" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 22 (SCL)
                  </text>
                </g>

                {/* WIRE 6: BH1750 VCC (Merah Putus-putus) ➔ 3.3V */}
                {/* Berakhir TEPAT di x=670 y=206 (Pin VCC sisi kiri box BH1750) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 185 C 20 185, 20 206, 380 206 C 480 206, 580 206, 670 206"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="54" cy="185" r="4" fill="#ef4444" />
                  <circle cx="670" cy="206" r="4" fill="#ef4444" />
                </g>

                {/* WIRE 7: BH1750 GND (Abu-abu) ➔ GND */}
                {/* Berakhir TEPAT di x=670 y=224 (Pin GND sisi kiri box BH1750) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 215 C 25 215, 25 224, 390 224 C 500 224, 590 224, 670 224"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="215" r="3.5" fill="#94a3b8" />
                  <circle cx="670" cy="224" r="3.5" fill="#94a3b8" />
                </g>

                {/* WIRE 8: Relay VCC Koil (Merah) ➔ VIN 5V */}
                {/* Berakhir TEPAT di x=620 y=333 (Terminal VCC sisi kiri box Relay) */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 256 185 C 330 185, 460 333, 620 333"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="256" cy="185" r="3.5" fill="#ef4444" />
                  <circle cx="620" cy="333" r="3.5" fill="#ef4444" />
                </g>

                {/* WIRE 9: Relay GND Koil (Abu-abu) ➔ GND */}
                {/* Berakhir TEPAT di x=620 y=351 (Terminal GND sisi kiri box Relay) */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 256 215 C 330 215, 470 351, 620 351"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="256" cy="215" r="3.5" fill="#94a3b8" />
                  <circle cx="620" cy="351" r="3.5" fill="#94a3b8" />
                </g>

                {/* DYNAMIC JUMPER WIRES FOR EVERY LIGHT FROM DATABASE */}
                {/* Setiap kabel berakhir TEPAT di pin IN masing-masing channel pada sisi kiri box Relay (x=620) */}
                {effectiveLights.map((light, idx) => {
                  const startY = 405 + idx * 30;
                  const endY = 285 + 82 + idx * 56 + 20;
                  const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                  const midCurveY = 370 + idx * 32;

                  return (
                    <g key={light.id} opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                      <path
                        d={`M 54 ${startY} C 10 ${startY}, 220 ${midCurveY}, 420 ${midCurveY} C 490 ${midCurveY}, 560 ${endY}, 620 ${endY}`}
                        fill="none"
                        stroke={pal.stroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      <circle cx="54" cy={startY} r="4.5" fill={pal.stroke} />
                      <circle cx={620} cy={endY} r="4.5" fill={pal.stroke} />

                      {/* Floating Badge on wire */}
                      <rect
                        x={250 + idx * 28}
                        y={midCurveY - 10}
                        width="130"
                        height="20"
                        rx="4"
                        fill={pal.fill}
                        stroke={pal.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={315 + idx * 28}
                        y={midCurveY + 4}
                        fill={pal.text}
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        GPIO {light.pin} ➔ {light.name.substring(0, 11)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TABEL LENGKAP SAMBUNGAN PINOUT (TERSINKRON DATABASE)          */}
          {/* ============================================================== */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tabel Rujukan Sambungan Pinout Hardware</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Tersinkron Database ({effectiveLights.length} Relay Aktif)</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold">
                    <th className="py-2.5 px-3.5 whitespace-nowrap w-[180px]">Komponen</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap w-[170px]">Pin Komponen</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap w-[160px]">Pin Fisik ESP32</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap w-[130px]">Warna Kabel</th>
                    <th className="py-2.5 px-3.5">Fungsi / Status Database</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {/* DHT22 Data */}
                  <tr className="hover:bg-blue-50/30 transition">
                    <td className="py-2.5 px-3.5 font-bold text-blue-900 whitespace-nowrap">DHT22 (Sensor)</td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">DATA / OUT</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold whitespace-nowrap">
                        GPIO 4 (D4)
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="font-medium text-slate-700">Biru</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">Membaca suhu &amp; kelembapan udara</td>
                  </tr>

                  {/* DHT22 Power */}
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700 whitespace-nowrap">DHT22 (Power)</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-700 whitespace-nowrap">VCC &amp; GND</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-semibold whitespace-nowrap">
                        3V3 &amp; GND
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700">Merah &amp; Abu-abu</td>
                    <td className="py-2.5 px-3.5 text-slate-500">Tegangan kerja 3.3V &amp; Ground</td>
                  </tr>

                  {/* BH1750 SDA */}
                  <tr className="hover:bg-amber-50/30 transition">
                    <td className="py-2.5 px-3.5 font-bold text-amber-900 whitespace-nowrap">BH1750 (Sensor)</td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">SDA (Data)</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono font-bold whitespace-nowrap">
                        GPIO 21 (D21)
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="font-medium text-slate-700">Kuning</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">I2C Data Bus intensitas cahaya (Lux)</td>
                  </tr>

                  {/* BH1750 SCL */}
                  <tr className="hover:bg-amber-50/30 transition">
                    <td className="py-2.5 px-3.5 font-bold text-amber-900 whitespace-nowrap">BH1750 (Sensor)</td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">SCL (Clock)</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold whitespace-nowrap">
                        GPIO 22 (D22)
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                        <span className="font-medium text-slate-700">Hijau</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">I2C Clock Bus komunikasi sensor</td>
                  </tr>

                  {/* BH1750 Power */}
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700 whitespace-nowrap">BH1750 (Power)</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-700 whitespace-nowrap">VCC &amp; GND</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-semibold whitespace-nowrap">
                        3V3 &amp; GND
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700">Merah &amp; Abu-abu</td>
                    <td className="py-2.5 px-3.5 text-slate-500">Tegangan kerja 3.3V (VCC) &amp; Ground</td>
                  </tr>

                  {/* Dynamic Relay Rows from Database */}
                  {effectiveLights.map((light, idx) => {
                    const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                    return (
                      <tr key={light.id} className="hover:bg-emerald-50/40 transition bg-emerald-50/15">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${pal.dot} shrink-0`}></span>
                            <span>{light.name}</span>
                            {light.isDefault && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 whitespace-nowrap">
                                Utama
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                          IN{idx + 1} (Relay CH {idx + 1})
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md font-mono font-bold border ${pal.bg} ${pal.textCls} whitespace-nowrap`}>
                            GPIO {light.pin} (D{light.pin})
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${pal.dot} shrink-0`}></span>
                            <span className="font-medium text-slate-700">{pal.name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-emerald-800 font-medium whitespace-nowrap">
                          ID: <code className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{light.id}</code>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Relay VCC & GND */}
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700 whitespace-nowrap">Relay (Power)</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-700 whitespace-nowrap">VCC &amp; GND</td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-bold text-rose-700">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold whitespace-nowrap">
                        VIN (5V) &amp; GND
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700">Merah &amp; Abu-abu</td>
                    <td className="py-2.5 px-3.5 text-slate-500">Koil relay membutuhkan daya 5V dari pin VIN ESP32</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tips Keamanan Listrik 220V */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs flex items-center gap-2 text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              <strong>Peringatan Keselamatan:</strong> Pastikan kabel listrik AC PLN 220V dalam keadaan <strong>mati / tercabut</strong> saat memasang kabel lampu ke terminal relay (*COM* dan *NO*).
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-end shrink-0 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
          >
            Tutup Skema
          </button>
        </div>
      </div>
    </div>
  );
}
