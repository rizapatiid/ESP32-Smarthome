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
  ZoomIn,
  ShieldAlert,
  Sparkles,
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

  // Fallback lampu jika DB belum terisi
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

  // Dimensi dinamis modul relay
  const relayCount = effectiveLights.length;
  const relayModuleHeight = Math.max(220, 80 + relayCount * 55);
  const svgCanvasHeight = Math.max(540, 300 + relayModuleHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                  Skema Visual Elektronika ESP32 DevKit V1
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Database className="w-2.5 h-2.5" />
                  <span>{effectiveLights.length} Relay Aktif di DB</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Diagram pengkabelan pin hardware yang presisi dan tersinkronisasi langsung dengan database.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Filter & Zoom */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 hidden sm:inline">
              Sorot Jalur:
            </span>
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Komponen
            </button>
            <button
              onClick={() => setActiveFilter("dht22")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition text-[11px] whitespace-nowrap ${
                activeFilter === "dht22"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <Thermometer className="w-3 h-3" />
              <span>DHT22 (Suhu)</span>
            </button>
            <button
              onClick={() => setActiveFilter("bh1750")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition text-[11px] whitespace-nowrap ${
                activeFilter === "bh1750"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>BH1750 (Cahaya)</span>
            </button>
            <button
              onClick={() => setActiveFilter("relay")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition text-[11px] whitespace-nowrap ${
                activeFilter === "relay"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>Relay ({effectiveLights.length} Lampu)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{isZoomed ? "Reset Ukuran" : "Perbesar Diagram"}</span>
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
                style={{ maxHeight: isZoomed ? "none" : "480px" }}
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
                    height="470"
                    rx="12"
                    fill="url(#boardGrad)"
                    stroke="#3b82f6"
                    strokeWidth="1.8"
                  />
                  {/* Copper Mounting Holes */}
                  <circle cx="16" cy="16" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="174" cy="16" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="16" cy="454" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="174" cy="454" r="4.5" fill="#090d16" stroke="#ca8a04" strokeWidth="1.5" />

                  {/* Micro-USB Port at Bottom */}
                  <rect x="70" y="452" width="50" height="20" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                  <rect x="80" y="460" width="30" height="9" rx="1.5" fill="#0f172a" />

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
                {/* 2. Sensor DHT22 (Top-Right)                                    */}
                {/* ============================================================== */}
                <g
                  transform="translate(670, 35)"
                  className="transition-opacity duration-200"
                  opacity={isDhtActive ? 1 : 0.15}
                >
                  <rect x="0" y="0" width="240" height="95" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                  {/* Grille ventilation pattern */}
                  <rect x="12" y="12" width="70" height="70" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="22" y1="25" x2="72" y2="25" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="37" x2="72" y2="37" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="49" x2="72" y2="49" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="61" x2="72" y2="61" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

                  <text x="95" y="30" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    DHT22 / AM2302
                  </text>
                  <text x="95" y="46" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                    Suhu &amp; Kelembapan
                  </text>

                  {/* Sensor Pin Indicators */}
                  <g transform="translate(95, 58)">
                    <circle cx="8" cy="8" r="4" fill="#ef4444" />
                    <text x="16" y="11" fill="#fca5a5" fontSize="8" fontFamily="monospace">1. VCC (3.3V)</text>
                    <circle cx="8" cy="22" r="4" fill="#3b82f6" />
                    <text x="16" y="25" fill="#93c5fd" fontSize="8" fontFamily="monospace">2. DATA (GPIO 4)</text>
                    <circle cx="120" cy="8" r="4" fill="#64748b" />
                    <text x="128" y="11" fill="#cbd5e1" fontSize="8" fontFamily="monospace">GND</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 3. Sensor BH1750 (Middle-Right)                                */}
                {/* ============================================================== */}
                <g
                  transform="translate(670, 150)"
                  className="transition-opacity duration-200"
                  opacity={isBhActive ? 1 : 0.15}
                >
                  <rect x="0" y="0" width="240" height="95" rx="10" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />
                  {/* Clear Glass Optical Dome */}
                  <circle cx="48" cy="48" r="24" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                  <circle cx="48" cy="48" r="15" fill="#38bdf8" fillOpacity="0.4" />
                  <circle cx="52" cy="44" r="5" fill="#ffffff" fillOpacity="0.8" />

                  <text x="88" y="30" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    BH1750FVI
                  </text>
                  <text x="88" y="46" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                    Sensor Intensitas Cahaya (I2C)
                  </text>

                  <g transform="translate(88, 56)">
                    <rect x="0" y="0" width="135" height="26" rx="5" fill="#0f172a" />
                    <text x="8" y="17" fill="#f87171" fontSize="8.5" fontFamily="monospace">VCC</text>
                    <text x="36" y="17" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">GND</text>
                    <text x="66" y="17" fill="#4ade80" fontSize="8.5" fontWeight="bold" fontFamily="monospace">SCL(22)</text>
                    <text x="104" y="17" fill="#fde047" fontSize="8.5" fontWeight="bold" fontFamily="monospace">SDA(21)</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 4. Modul Relay Multi-Channel dari Database (Bottom-Right)       */}
                {/* ============================================================== */}
                <g
                  transform="translate(620, 265)"
                  className="transition-opacity duration-200"
                  opacity={isRelayActive ? 1 : 0.15}
                >
                  <rect
                    x="0"
                    y="0"
                    width="290"
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

                  {/* Channel Relay Sesuai Lampu Database */}
                  {effectiveLights.map((light, idx) => {
                    const blockY = 48 + idx * 52;
                    const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                    return (
                      <g key={light.id} transform={`translate(15, ${blockY})`}>
                        {/* Blue Relay Cube */}
                        <rect x="0" y="0" width="95" height="44" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                        <text x="47" y="18" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                          CH {idx + 1}: GPIO {light.pin}
                        </text>
                        <text x="47" y="31" fill="#bae6fd" fontSize="7.5" fontFamily="sans-serif" textAnchor="middle">
                          {light.name.substring(0, 13)}
                        </text>

                        {/* Terminal Blocks */}
                        <rect x="105" y="2" width="26" height="40" rx="3" fill="#0f766e" />
                        <circle cx="118" cy="12" r="3" fill="#cbd5e1" />
                        <circle cx="118" cy="30" r="3" fill="#cbd5e1" />

                        {/* Glowing Lamp Bulb Output */}
                        <g transform="translate(145, 8)">
                          <circle cx="14" cy="14" r="11" fill="#fbbf24" filter="url(#wireGlow)" fillOpacity="0.85" />
                          <text x="32" y="14" fill="#fef08a" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                            {light.name}
                          </text>
                          <text x="32" y="25" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                            Pin D{light.pin} · {light.isDefault ? "Utama" : "Eksternal"}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Relay Low-Voltage Input Pins at Bottom */}
                  <g transform={`translate(15, ${relayModuleHeight - 32})`}>
                    <rect x="0" y="0" width="260" height="24" rx="4" fill="#0f172a" />
                    <text x="12" y="16" fill="#f87171" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      VCC(5V)
                    </text>
                    <text x="65" y="16" fill="#94a3b8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      GND
                    </text>
                    {effectiveLights.map((light, idx) => {
                      const posX = 105 + idx * 48;
                      const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                      return (
                        <text
                          key={light.id}
                          x={posX}
                          y="16"
                          fill={pal.stroke}
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          IN{idx + 1}(D{light.pin})
                        </text>
                      );
                    })}
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 5. JUMPER WIRES (Lengkungan Halus & Terstruktur)                 */}
                {/* ============================================================== */}

                {/* WIRE 1: DHT22 DATA (Biru) ➔ GPIO 4 */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 300 C 15 300, -10 110, 420 110 C 530 110, 620 92, 780 92"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="300" r="4.5" fill="#3b82f6" />
                  <circle cx="780" cy="92" r="4.5" fill="#3b82f6" />
                  {/* Badge Label */}
                  <rect x="360" y="100" width="95" height="18" rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                  <text x="407" y="113" fill="#bfdbfe" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 4 (DATA)
                  </text>
                </g>

                {/* WIRE 2: DHT22 VCC (Merah) ➔ 3.3V */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 185 C 20 185, -5 65, 380 65 C 520 65, 630 82, 765 82"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="54" cy="185" r="4" fill="#ef4444" />
                  <circle cx="765" cy="82" r="4" fill="#ef4444" />
                </g>

                {/* WIRE 3: DHT22 GND (Abu-abu) ➔ GND */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 215 C 30 215, 10 85, 410 85 C 560 85, 680 82, 885 82"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="215" r="3.5" fill="#94a3b8" />
                  <circle cx="885" cy="82" r="3.5" fill="#94a3b8" />
                </g>

                {/* WIRE 4: BH1750 SDA (Kuning) ➔ GPIO 21 */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 335 C -5 335, 260 215, 480 215 C 580 215, 680 220, 815 220"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="335" r="4.5" fill="#eab308" />
                  <circle cx="815" cy="220" r="4.5" fill="#eab308" />
                  <rect x="360" y="206" width="85" height="18" rx="4" fill="#713f12" stroke="#eab308" strokeWidth="1" />
                  <text x="402" y="219" fill="#fef08a" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 21 (SDA)
                  </text>
                </g>

                {/* WIRE 5: BH1750 SCL (Hijau) ➔ GPIO 22 */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 365 C 15 365, 280 235, 490 235 C 580 235, 660 220, 780 220"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="365" r="4.5" fill="#22c55e" />
                  <circle cx="780" cy="220" r="4.5" fill="#22c55e" />
                  <rect x="460" y="226" width="85" height="18" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="1" />
                  <text x="502" y="239" fill="#bbf7d0" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 22 (SCL)
                  </text>
                </g>

                {/* WIRE 6: Relay VCC Koil (Merah) ➔ VIN 5V */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d={`M 256 185 C 310 185, 480 ${relayModuleHeight + 110}, 580 ${265 + relayModuleHeight - 20} C 595 ${265 + relayModuleHeight - 20}, 610 ${265 + relayModuleHeight - 20}, 645 ${265 + relayModuleHeight - 20}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="256" cy="185" r="3.5" fill="#ef4444" />
                  <circle cx="645" cy={265 + relayModuleHeight - 20} r="3.5" fill="#ef4444" />
                </g>

                {/* DYNAMIC JUMPER WIRES FOR EVERY LIGHT FROM DATABASE */}
                {effectiveLights.map((light, idx) => {
                  const startY = 405 + idx * 30;
                  const endX = 620 + 15 + 105 + idx * 48 + 12;
                  const endY = 265 + relayModuleHeight - 20;
                  const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                  const midCurveY = 340 + idx * 32;

                  return (
                    <g key={light.id} opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                      <path
                        d={`M 54 ${startY} C 10 ${startY}, 220 ${midCurveY}, 420 ${midCurveY} C 520 ${midCurveY}, ${endX - 35} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke={pal.stroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      <circle cx="54" cy={startY} r="4.5" fill={pal.stroke} />
                      <circle cx={endX} cy={endY} r="4.5" fill={pal.stroke} />

                      {/* Floating Badge on wire */}
                      <rect
                        x={250 + idx * 30}
                        y={midCurveY - 10}
                        width="130"
                        height="20"
                        rx="4"
                        fill={pal.fill}
                        stroke={pal.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={315 + idx * 30}
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
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Tabel Rujukan Sambungan Pinout Hardware</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Tersinkron Database ({effectiveLights.length} Relay Aktif)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold">
                    <th className="py-2.5 px-3">Komponen</th>
                    <th className="py-2.5 px-3">Pin Komponen</th>
                    <th className="py-2.5 px-3">Pin Fisik ESP32</th>
                    <th className="py-2.5 px-3">Warna Kabel</th>
                    <th className="py-2.5 px-3">Fungsi / Status Database</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {/* DHT22 */}
                  <tr className="hover:bg-blue-50/30 transition">
                    <td className="py-2 px-3 font-bold text-blue-900">DHT22 (Sensor)</td>
                    <td className="py-2 px-3 font-mono font-semibold">DATA / OUT</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                        GPIO 4 (D4)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                      <span>Biru</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">Membaca suhu &amp; kelembapan udara</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">DHT22 (Power)</td>
                    <td className="py-2 px-3 font-mono">VCC &amp; GND</td>
                    <td className="py-2 px-3 font-mono text-slate-700">3V3 &amp; GND</td>
                    <td className="py-2 px-3">Merah &amp; Hitam</td>
                    <td className="py-2 px-3 text-slate-500">Tegangan kerja 3.3V</td>
                  </tr>

                  {/* BH1750 */}
                  <tr className="hover:bg-amber-50/30 transition">
                    <td className="py-2 px-3 font-bold text-amber-900">BH1750 (Sensor)</td>
                    <td className="py-2 px-3 font-mono font-semibold">SDA (Data)</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                        GPIO 21 (D21)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <span>Kuning</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">I2C Data Bus intensitas cahaya (Lux)</td>
                  </tr>
                  <tr className="hover:bg-amber-50/30 transition">
                    <td className="py-2 px-3 font-bold text-amber-900">BH1750 (Sensor)</td>
                    <td className="py-2 px-3 font-mono font-semibold">SCL (Clock)</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                        GPIO 22 (D22)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                      <span>Hijau</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">I2C Clock Bus komunikasi sensor</td>
                  </tr>

                  {/* Dynamic Relay Rows from Database */}
                  {effectiveLights.map((light, idx) => {
                    const pal = LIGHT_PALETTES[idx % LIGHT_PALETTES.length];
                    return (
                      <tr key={light.id} className="hover:bg-emerald-50/40 transition bg-emerald-50/15">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${pal.dot}`}></span>
                          <span>{light.name}</span>
                          {light.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                              Utama
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                          IN{idx + 1} (Relay CH {idx + 1})
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold border ${pal.bg} ${pal.textCls}`}>
                            GPIO {light.pin} (D{light.pin})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${pal.dot}`}></span>
                            <span>{pal.name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-800 font-medium">
                          ID: <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{light.id}</code>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Relay VCC */}
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">Relay Power</td>
                    <td className="py-2 px-3 font-mono">VCC &amp; GND</td>
                    <td className="py-2 px-3 font-mono font-bold text-rose-700">VIN (5V) &amp; GND</td>
                    <td className="py-2 px-3">Merah &amp; Hitam</td>
                    <td className="py-2 px-3 text-slate-500">Koil relay membutuhkan daya 5V dari pin VIN</td>
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
        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersinkronisasi otomatis dengan tabel database <code>configured_lights</code>.</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition active:scale-95 shadow-xs"
          >
            Tutup Skema
          </button>
        </div>
      </div>
    </div>
  );
}
