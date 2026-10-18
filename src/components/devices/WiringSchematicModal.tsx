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
  Info,
  Maximize2,
  Download,
  AlertTriangle,
  ZoomIn,
} from "lucide-react";

interface WiringSchematicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ComponentFilter = "all" | "dht22" | "bh1750" | "relay";

export default function WiringSchematicModal({
  isOpen,
  onClose,
}: WiringSchematicModalProps) {
  const [activeFilter, setActiveFilter] = useState<ComponentFilter>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen) return null;

  const isDhtActive = activeFilter === "all" || activeFilter === "dht22";
  const isBhActive = activeFilter === "all" || activeFilter === "bh1750";
  const isRelayActive = activeFilter === "all" || activeFilter === "relay";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Skema Visual Perakitan ESP32 DevKit V1
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Wiring Diagram
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Diagram koneksi kabel jumper sensor DHT22, BH1750, dan Modul Relay.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 hidden sm:inline">
              Sorot Komponen:
            </span>
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Komponen
            </button>
            <button
              onClick={() => setActiveFilter("dht22")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
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
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
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
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                activeFilter === "relay"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>Relay Multi-Pin</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.25 : 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{zoomLevel === 1 ? "Perbesar 1.25x" : "Reset Zoom"}</span>
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable Diagram & Wiring Table) */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* SVG Diagram Canvas Box */}
          <div className="w-full overflow-x-auto bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-inner">
            <div
              className="min-w-[680px] sm:min-w-[760px] flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
            >
              <svg
                viewBox="0 0 880 500"
                className="w-full h-auto select-none"
                style={{ maxHeight: "420px" }}
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="0.8" fill="#334155" opacity="0.6" />
                  </pattern>
                  <linearGradient id="espGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <rect width="880" height="500" fill="#090d16" rx="16" />
                <rect width="880" height="500" fill="url(#grid)" rx="16" />

                {/* ============================================================== */}
                {/* 1. ESP32 DevKit V1 Board (Center Left)                         */}
                {/* ============================================================== */}
                <g transform="translate(60, 60)">
                  {/* Board PCB Outer */}
                  <rect
                    x="0"
                    y="0"
                    width="170"
                    height="380"
                    rx="12"
                    fill="url(#espGradient)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                  {/* Mounting Holes */}
                  <circle cx="16" cy="16" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="154" cy="16" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="16" cy="364" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="154" cy="364" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />

                  {/* Micro-USB Port (Bottom) */}
                  <rect x="65" y="365" width="40" height="18" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="73" y="372" width="24" height="8" rx="1.5" fill="#0f172a" />

                  {/* ESP-WROOM-32 Metal Shield (Top) */}
                  <rect x="25" y="45" width="120" height="120" rx="6" fill="url(#chipGradient)" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Wi-Fi Antenna Trace */}
                  <path d="M 45 45 L 45 28 L 65 28 L 65 45 M 85 45 L 85 28 L 105 28 L 105 45 M 125 45 L 125 28" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                  <text x="85" y="100" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    ESP-WROOM-32
                  </text>
                  <text x="85" y="118" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    Wi-Fi + BLE 2.4GHz
                  </text>

                  {/* Built-in Blue LED (GPIO 2) */}
                  <circle cx="132" cy="180" r="4" fill="#3b82f6" filter="url(#glow)" />
                  <text x="122" y="183" fill="#60a5fa" fontSize="8" fontFamily="monospace" textAnchor="end">
                    LED D2
                  </text>

                  {/* Board Title Label */}
                  <text x="85" y="235" fill="#38bdf8" fontSize="11" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">
                    ESP32 DevKit V1
                  </text>
                  <text x="85" y="250" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Auto-Discovery UDP :8266
                  </text>

                  {/* Left Side Header Pins */}
                  {/* Pin 3V3 (y=75) */}
                  <rect x="-6" y="70" width="12" height="8" rx="1.5" fill="#ef4444" />
                  <text x="12" y="77" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">3V3</text>

                  {/* Pin GND (y=95) */}
                  <rect x="-6" y="90" width="12" height="8" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <text x="12" y="97" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">GND</text>

                  {/* Pin D2 / GPIO 2 (y=135) */}
                  <rect x="-6" y="130" width="12" height="8" rx="1.5" fill="#a855f7" />
                  <text x="12" y="137" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">D2</text>

                  {/* Pin D4 / GPIO 4 (y=155) */}
                  <rect x="-6" y="150" width="12" height="8" rx="1.5" fill="#3b82f6" />
                  <text x="12" y="157" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">D4</text>

                  {/* Pin D16 / GPIO 16 (y=175) */}
                  <rect x="-6" y="170" width="12" height="8" rx="1.5" fill="#f97316" />
                  <text x="12" y="177" fill="#fb923c" fontSize="9" fontWeight="bold" fontFamily="monospace">D16</text>

                  {/* Pin D21 / GPIO 21 (y=255) */}
                  <rect x="-6" y="250" width="12" height="8" rx="1.5" fill="#eab308" />
                  <text x="12" y="257" fill="#fde047" fontSize="9" fontWeight="bold" fontFamily="monospace">D21</text>

                  {/* Pin D22 / GPIO 22 (y=295) */}
                  <rect x="-6" y="290" width="12" height="8" rx="1.5" fill="#22c55e" />
                  <text x="12" y="297" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">D22</text>

                  {/* Right Side Header Pins */}
                  {/* Pin VIN / 5V (y=75) */}
                  <rect x="164" y="70" width="12" height="8" rx="1.5" fill="#ef4444" />
                  <text x="158" y="77" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="end">VIN (5V)</text>

                  {/* Pin GND Right (y=95) */}
                  <rect x="164" y="90" width="12" height="8" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <text x="158" y="97" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="end">GND</text>
                </g>

                {/* ============================================================== */}
                {/* 2. Sensor Suhu & Kelembapan DHT22 (Top Right)                  */}
                {/* ============================================================== */}
                <g
                  transform="translate(620, 40)"
                  className="transition-opacity duration-200"
                  opacity={isDhtActive ? 1 : 0.2}
                >
                  {/* Module Base */}
                  <rect x="0" y="0" width="190" height="95" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                  {/* Sensor Grid (White Grid Body) */}
                  <rect x="12" y="12" width="70" height="70" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Ventilation Slots */}
                  <line x1="22" y1="25" x2="72" y2="25" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="22" y1="37" x2="72" y2="37" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="22" y1="49" x2="72" y2="49" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="22" y1="61" x2="72" y2="61" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Labels */}
                  <text x="95" y="28" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    DHT22 / AM2302
                  </text>
                  <text x="95" y="44" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                    Suhu &amp; Kelembapan
                  </text>

                  {/* Pins: VCC, DATA, GND */}
                  <g transform="translate(95, 58)">
                    {/* Pin 1: VCC */}
                    <circle cx="8" cy="8" r="4" fill="#ef4444" />
                    <text x="16" y="11" fill="#fca5a5" fontSize="8" fontFamily="monospace">1. VCC (3.3V)</text>
                    {/* Pin 2: DATA */}
                    <circle cx="8" cy="22" r="4" fill="#3b82f6" />
                    <text x="16" y="25" fill="#93c5fd" fontSize="8" fontFamily="monospace">2. DATA (GPIO 4)</text>
                    {/* Pin 4: GND */}
                    <circle cx="105" cy="8" r="4" fill="#64748b" />
                    <text x="113" y="11" fill="#cbd5e1" fontSize="8" fontFamily="monospace">GND</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 3. Sensor Cahaya BH1750 I2C (Middle Right)                     */}
                {/* ============================================================== */}
                <g
                  transform="translate(620, 160)"
                  className="transition-opacity duration-200"
                  opacity={isBhActive ? 1 : 0.2}
                >
                  {/* Module Board */}
                  <rect x="0" y="0" width="190" height="95" rx="10" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />
                  {/* Sensor Dome Lens */}
                  <circle cx="45" cy="48" r="22" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                  <circle cx="45" cy="48" r="14" fill="#38bdf8" fillOpacity="0.4" />
                  <circle cx="48" cy="45" r="5" fill="#ffffff" fillOpacity="0.8" />

                  {/* Labels */}
                  <text x="82" y="28" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    BH1750FVI
                  </text>
                  <text x="82" y="44" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                    Sensor Cahaya (Lux, I2C)
                  </text>

                  {/* Pins: VCC, GND, SCL, SDA, ADDR */}
                  <g transform="translate(82, 54)">
                    <rect x="0" y="0" width="98" height="30" rx="5" fill="#0f172a" />
                    <text x="8" y="18" fill="#f87171" fontSize="8" fontFamily="monospace">VCC</text>
                    <text x="28" y="18" fill="#94a3b8" fontSize="8" fontFamily="monospace">GND</text>
                    <text x="48" y="18" fill="#4ade80" fontSize="8" fontWeight="bold" fontFamily="monospace">SCL</text>
                    <text x="68" y="18" fill="#fde047" fontSize="8" fontWeight="bold" fontFamily="monospace">SDA</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 4. Modul Relay 2-Channel Multi-Lampu (Bottom Right)             */}
                {/* ============================================================== */}
                <g
                  transform="translate(620, 280)"
                  className="transition-opacity duration-200"
                  opacity={isRelayActive ? 1 : 0.2}
                >
                  {/* Module Board */}
                  <rect x="0" y="0" width="220" height="180" rx="10" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />

                  {/* Relay Cubes (Blue Songle Cubes) */}
                  <rect x="15" y="20" width="65" height="50" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                  <text x="47" y="42" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    RELAY 1
                  </text>
                  <text x="47" y="55" fill="#bae6fd" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    GPIO 2 (Utama)
                  </text>

                  <rect x="15" y="80" width="65" height="50" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                  <text x="47" y="102" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    RELAY 2
                  </text>
                  <text x="47" y="115" fill="#bae6fd" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    GPIO 16 (Bebas)
                  </text>

                  {/* Screw Terminals (Output to 220V Lamps) */}
                  <rect x="88" y="22" width="28" height="46" rx="4" fill="#0f766e" />
                  <circle cx="102" cy="33" r="3.5" fill="#cbd5e1" />
                  <circle cx="102" cy="55" r="3.5" fill="#cbd5e1" />

                  <rect x="88" y="82" width="28" height="46" rx="4" fill="#0f766e" />
                  <circle cx="102" cy="93" r="3.5" fill="#cbd5e1" />
                  <circle cx="102" cy="115" r="3.5" fill="#cbd5e1" />

                  {/* Lamps Icons on Output */}
                  <g transform="translate(126, 32)">
                    <circle cx="12" cy="12" r="10" fill="#fbbf24" filter="url(#glow)" fillOpacity="0.8" />
                    <text x="26" y="16" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Lampu 1</text>
                  </g>
                  <g transform="translate(126, 92)">
                    <circle cx="12" cy="12" r="10" fill="#fbbf24" filter="url(#glow)" fillOpacity="0.8" />
                    <text x="26" y="16" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Lampu 2</text>
                  </g>

                  {/* Low-Voltage Input Pins (VCC, GND, IN1, IN2) */}
                  <g transform="translate(15, 142)">
                    <rect x="0" y="0" width="190" height="26" rx="4" fill="#0f172a" />
                    {/* Pins */}
                    <text x="12" y="17" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">VCC(5V)</text>
                    <text x="65" y="17" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">GND</text>
                    <text x="105" y="17" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">IN1(D2)</text>
                    <text x="150" y="17" fill="#fb923c" fontSize="9" fontWeight="bold" fontFamily="monospace">IN2(D16)</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 5. JUMPER WIRES (Curved SVG Connection Paths)                   */}
                {/* ============================================================== */}

                {/* WIRE 1: DHT22 DATA ➔ ESP32 GPIO 4 (Blue Wire) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 214 C 10 214, -20 120, 380 120 C 500 120, 560 102, 725 102"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="214" r="4.5" fill="#3b82f6" />
                  <circle cx="725" cy="102" r="4.5" fill="#3b82f6" />
                  <rect x="360" y="108" width="80" height="18" rx="4" fill="#1e3a8a" />
                  <text x="400" y="121" fill="#bfdbfe" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 4 (DATA)
                  </text>
                </g>

                {/* WIRE 2: DHT22 VCC ➔ ESP32 3V3 (Red Wire) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 134 C 20 134, -10 60, 360 60 C 500 60, 580 88, 705 88"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="54" cy="134" r="4" fill="#ef4444" />
                  <circle cx="705" cy="88" r="4" fill="#ef4444" />
                </g>

                {/* WIRE 3: DHT22 GND ➔ ESP32 GND (Black/Slate Wire) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 154 C 30 154, 10 80, 380 80 C 540 80, 640 88, 830 88"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="154" r="4" fill="#94a3b8" />
                  <circle cx="830" cy="88" r="4" fill="#94a3b8" />
                </g>

                {/* WIRE 4: BH1750 SDA ➔ ESP32 GPIO 21 (Yellow Wire) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 314 C -10 314, 250 230, 480 230 C 580 230, 630 226, 775 226"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="314" r="4.5" fill="#eab308" />
                  <circle cx="775" cy="226" r="4.5" fill="#eab308" />
                  <rect x="360" y="220" width="70" height="18" rx="4" fill="#713f12" />
                  <text x="395" y="233" fill="#fef08a" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 21 (SDA)
                  </text>
                </g>

                {/* WIRE 5: BH1750 SCL ➔ ESP32 GPIO 22 (Green Wire) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 354 C 20 354, 280 255, 490 255 C 570 255, 620 226, 755 226"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="354" r="4.5" fill="#22c55e" />
                  <circle cx="755" cy="226" r="4.5" fill="#22c55e" />
                  <rect x="460" y="246" width="70" height="18" rx="4" fill="#14532d" />
                  <text x="495" y="259" fill="#bbf7d0" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 22 (SCL)
                  </text>
                </g>

                {/* WIRE 6: Relay IN1 ➔ ESP32 GPIO 2 (Purple Wire) */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 194 C 10 194, 260 380, 480 430 C 580 445, 670 435, 745 435"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="194" r="4.5" fill="#c084fc" />
                  <circle cx="745" cy="435" r="4.5" fill="#c084fc" />
                  <rect x="360" y="380" width="85" height="18" rx="4" fill="#581c87" />
                  <text x="402" y="393" fill="#e9d5ff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 2 (Relay 1)
                  </text>
                </g>

                {/* WIRE 7: Relay IN2 ➔ ESP32 GPIO 16 (Orange Wire) */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 234 C 20 234, 280 420, 500 455 C 600 465, 710 440, 790 440"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="234" r="4.5" fill="#f97316" />
                  <circle cx="790" cy="440" r="4.5" fill="#f97316" />
                  <rect x="460" y="446" width="90" height="18" rx="4" fill="#7c2d12" />
                  <text x="505" y="459" fill="#ffedd5" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 16 (Relay 2)
                  </text>
                </g>

                {/* WIRE 8: Relay VCC ➔ ESP32 VIN 5V (Red Wire from right header) */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 236 134 C 280 134, 450 350, 580 420 C 610 435, 630 435, 650 435"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="236" cy="134" r="4" fill="#ef4444" />
                  <circle cx="650" cy="435" r="4" fill="#ef4444" />
                </g>
              </svg>
            </div>
          </div>

          {/* Wire Connections Detailed Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Tabel Lengkap Jalur Kabel Jumper (Pinout Map)</span>
              </h4>
              <span className="text-[11px] text-slate-400">Total 8 Sambungan</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold">
                    <th className="py-2.5 px-3">Komponen</th>
                    <th className="py-2.5 px-3">Pin Komponen</th>
                    <th className="py-2.5 px-3">Pin ESP32</th>
                    <th className="py-2.5 px-3">Warna Kabel</th>
                    <th className="py-2.5 px-3">Fungsi / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {/* DHT22 */}
                  <tr className="hover:bg-blue-50/40 transition">
                    <td className="py-2 px-3 font-bold text-blue-900">DHT22</td>
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
                    <td className="py-2 px-3 text-slate-500">Membaca sinyal suhu &amp; kelembapan digital</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">DHT22</td>
                    <td className="py-2 px-3 font-mono">VCC</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold">
                        3V3 (3.3V)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                      <span>Merah</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">Daya sensor (Gunakan pin 3.3V)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">DHT22</td>
                    <td className="py-2 px-3 font-mono">GND</td>
                    <td className="py-2 px-3 font-mono text-slate-600">GND</td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                      <span>Hitam</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">Ground bersama (*Common Ground*)</td>
                  </tr>

                  {/* BH1750 */}
                  <tr className="hover:bg-amber-50/40 transition">
                    <td className="py-2 px-3 font-bold text-amber-900">BH1750</td>
                    <td className="py-2 px-3 font-mono font-semibold">SDA</td>
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
                  <tr className="hover:bg-amber-50/40 transition">
                    <td className="py-2 px-3 font-bold text-amber-900">BH1750</td>
                    <td className="py-2 px-3 font-mono font-semibold">SCL</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                        GPIO 22 (D22)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                      <span>Hijau</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">I2C Clock Bus frekuensi komunikasi</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">BH1750</td>
                    <td className="py-2 px-3 font-mono">VCC &amp; GND</td>
                    <td className="py-2 px-3 font-mono">3V3 &amp; GND</td>
                    <td className="py-2 px-3">Merah / Hitam</td>
                    <td className="py-2 px-3 text-slate-500">Tegangan kerja 3.3V</td>
                  </tr>

                  {/* Relay Multi-Pin */}
                  <tr className="hover:bg-emerald-50/40 transition">
                    <td className="py-2 px-3 font-bold text-emerald-900">Relay IN1</td>
                    <td className="py-2 px-3 font-mono font-semibold">IN1 (Lampu 1)</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                        GPIO 2 (D2)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                      <span>Ungu</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">Lampu Utama / Saklar relay primer</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/40 transition">
                    <td className="py-2 px-3 font-bold text-emerald-900">Relay IN2</td>
                    <td className="py-2 px-3 font-mono font-semibold">IN2 (Lampu 2)</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold">
                        GPIO 16 (D16)
                      </span>
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                      <span>Oranye</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">Lampu Tambahan (Dapat diganti via web)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">Relay VCC</td>
                    <td className="py-2 px-3 font-mono">VCC</td>
                    <td className="py-2 px-3 font-mono font-bold text-rose-700">VIN (5V)</td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                      <span>Merah</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">Koil relay membutuhkan daya 5V dari pin VIN</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tips Keamanan Listrik AC / 220V */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Peringatan Keamanan Saat Menghubungkan Lampu AC 220V</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed pl-6">
              Jika menggunakan relay untuk mengontrol lampu ruangan tegangan tinggi (PLN 220V), pastikan saklar listrik PLN dalam kondisi <strong>mati / tercabut</strong> saat merakit kabel ke terminal baut (*COM* dan *NO*). Selalu gunakan selotip isolasi atau wadah tertutup (*enclosure box*).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <span className="text-[11px] text-slate-400">
            Kompatibel dengan board: <strong>ESP32 DevKit V1 (30 / 36 Pin)</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition active:scale-95"
          >
            Selesai / Tutup Skema
          </button>
        </div>
      </div>
    </div>
  );
}
