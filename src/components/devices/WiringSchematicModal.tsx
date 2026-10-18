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
  Database,
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

const LIGHT_COLORS = [
  { stroke: "#c084fc", fill: "#581c87", text: "#e9d5ff", bg: "bg-purple-100", textCls: "text-purple-800", dot: "bg-purple-600", name: "Ungu" },
  { stroke: "#f97316", fill: "#7c2d12", text: "#ffedd5", bg: "bg-orange-100", textCls: "text-orange-800", dot: "bg-orange-500", name: "Oranye" },
  { stroke: "#06b6d4", fill: "#164e63", text: "#cffafe", bg: "bg-cyan-100", textCls: "text-cyan-800", dot: "bg-cyan-500", name: "Sian" },
  { stroke: "#84cc16", fill: "#365314", text: "#ecfccb", bg: "bg-lime-100", textCls: "text-lime-800", dot: "bg-lime-500", name: "Lime" },
  { stroke: "#ec4899", fill: "#831843", text: "#fce7f3", bg: "bg-pink-100", textCls: "text-pink-800", dot: "bg-pink-500", name: "Pink" },
  { stroke: "#a855f7", fill: "#581c87", text: "#f3e8ff", bg: "bg-fuchsia-100", textCls: "text-fuchsia-800", dot: "bg-fuchsia-600", name: "Fuchsia" },
];

export default function WiringSchematicModal({
  isOpen,
  onClose,
  configuredLights = [],
}: WiringSchematicModalProps) {
  const [activeFilter, setActiveFilter] = useState<ComponentFilter>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen) return null;

  // Pastikan ada minimal 1 lampu jika DB kosong
  const effectiveLights: ConfiguredLight[] =
    configuredLights.length > 0
      ? configuredLights
      : [{ id: "lamp-main", name: "Lampu Utama", pin: 2, isDefault: true }];

  const isDhtActive = activeFilter === "all" || activeFilter === "dht22";
  const isBhActive = activeFilter === "all" || activeFilter === "bh1750";
  const isRelayActive = activeFilter === "all" || activeFilter === "relay";

  // Hitung tinggi modul relay dan viewBox SVG berdasarkan jumlah lampu di database
  const relayChannelCount = Math.max(effectiveLights.length, 2);
  const relayModuleHeight = 80 + relayChannelCount * 55;
  const svgHeight = Math.max(500, 290 + relayModuleHeight);

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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Skema Visual Perakitan ESP32 DevKit V1
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Database className="w-2.5 h-2.5" />
                  <span>Sinkron Database MySQL ({effectiveLights.length} Lampu)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Diagram koneksi pin sensor DHT22, BH1750, dan seluruh relay lampu yang tersimpan di database Anda.
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
              <span>Relay ({effectiveLights.length} Lampu DB)</span>
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
              className="min-w-[720px] sm:min-w-[800px] flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
            >
              <svg
                viewBox={`0 0 900 ${svgHeight}`}
                className="w-full h-auto select-none"
                style={{ maxHeight: `${Math.min(svgHeight, 520)}px` }}
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

                <rect width="900" height={svgHeight} fill="#090d16" rx="16" />
                <rect width="900" height={svgHeight} fill="url(#grid)" rx="16" />

                {/* ============================================================== */}
                {/* 1. ESP32 DevKit V1 Board (Center Left)                         */}
                {/* ============================================================== */}
                <g transform="translate(60, 50)">
                  {/* Board PCB Outer */}
                  <rect
                    x="0"
                    y="0"
                    width="170"
                    height="400"
                    rx="12"
                    fill="url(#espGradient)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                  {/* Mounting Holes */}
                  <circle cx="16" cy="16" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="154" cy="16" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="16" cy="384" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="154" cy="384" r="4.5" fill="#090d16" stroke="#475569" strokeWidth="1.5" />

                  {/* Micro-USB Port (Bottom) */}
                  <rect x="65" y="385" width="40" height="18" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="73" y="392" width="24" height="8" rx="1.5" fill="#0f172a" />

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
                    UDP Port: 8266
                  </text>

                  {/* Left Side Header Pins */}
                  {/* Pin 3V3 (y=75) */}
                  <rect x="-6" y="70" width="12" height="8" rx="1.5" fill="#ef4444" />
                  <text x="12" y="77" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">3V3</text>

                  {/* Pin GND (y=95) */}
                  <rect x="-6" y="90" width="12" height="8" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <text x="12" y="97" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">GND</text>

                  {/* Pin D4 / GPIO 4 (y=155) - DHT22 */}
                  <rect x="-6" y="150" width="12" height="8" rx="1.5" fill="#3b82f6" />
                  <text x="12" y="157" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">D4 (DHT)</text>

                  {/* Pin D21 / GPIO 21 (y=210) - BH1750 SDA */}
                  <rect x="-6" y="205" width="12" height="8" rx="1.5" fill="#eab308" />
                  <text x="12" y="212" fill="#fde047" fontSize="9" fontWeight="bold" fontFamily="monospace">D21 (SDA)</text>

                  {/* Pin D22 / GPIO 22 (y=230) - BH1750 SCL */}
                  <rect x="-6" y="225" width="12" height="8" rx="1.5" fill="#22c55e" />
                  <text x="12" y="232" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">D22 (SCL)</text>

                  {/* Dynamic Relay Pins on ESP32 Left Header */}
                  {effectiveLights.map((light, idx) => {
                    const pinY = 270 + idx * 26;
                    const color = LIGHT_COLORS[idx % LIGHT_COLORS.length];
                    return (
                      <g key={light.id}>
                        <rect x="-6" y={pinY - 5} width="12" height="8" rx="1.5" fill={color.stroke} />
                        <text
                          x="12"
                          y={pinY + 2}
                          fill={color.stroke}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          D{light.pin} ({light.isDefault ? "Utama" : light.name.substring(0, 7)})
                        </text>
                      </g>
                    );
                  })}

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
                  transform="translate(620, 35)"
                  className="transition-opacity duration-200"
                  opacity={isDhtActive ? 1 : 0.2}
                >
                  <rect x="0" y="0" width="200" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                  {/* Sensor Grid (White Grid Body) */}
                  <rect x="12" y="10" width="68" height="68" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="22" y1="23" x2="70" y2="23" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="35" x2="70" y2="35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="47" x2="70" y2="47" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="59" x2="70" y2="59" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

                  {/* Labels */}
                  <text x="92" y="26" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    DHT22 / AM2302
                  </text>
                  <text x="92" y="42" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                    Suhu &amp; Kelembapan
                  </text>

                  <g transform="translate(92, 54)">
                    <circle cx="8" cy="8" r="4" fill="#ef4444" />
                    <text x="16" y="11" fill="#fca5a5" fontSize="8" fontFamily="monospace">1. VCC (3.3V)</text>
                    <circle cx="8" cy="22" r="4" fill="#3b82f6" />
                    <text x="16" y="25" fill="#93c5fd" fontSize="8" fontFamily="monospace">2. DATA (GPIO 4)</text>
                    <circle cx="105" cy="8" r="4" fill="#64748b" />
                    <text x="113" y="11" fill="#cbd5e1" fontSize="8" fontFamily="monospace">GND</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 3. Sensor Cahaya BH1750 I2C (Middle Right)                     */}
                {/* ============================================================== */}
                <g
                  transform="translate(620, 145)"
                  className="transition-opacity duration-200"
                  opacity={isBhActive ? 1 : 0.2}
                >
                  <rect x="0" y="0" width="200" height="90" rx="10" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />
                  {/* Sensor Dome Lens */}
                  <circle cx="45" cy="45" r="22" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                  <circle cx="45" cy="45" r="14" fill="#38bdf8" fillOpacity="0.4" />
                  <circle cx="48" cy="42" r="5" fill="#ffffff" fillOpacity="0.8" />

                  {/* Labels */}
                  <text x="82" y="26" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    BH1750FVI
                  </text>
                  <text x="82" y="42" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                    Sensor Cahaya (I2C)
                  </text>

                  <g transform="translate(82, 52)">
                    <rect x="0" y="0" width="105" height="26" rx="5" fill="#0f172a" />
                    <text x="6" y="16" fill="#f87171" fontSize="8" fontFamily="monospace">VCC</text>
                    <text x="26" y="16" fill="#94a3b8" fontSize="8" fontFamily="monospace">GND</text>
                    <text x="50" y="16" fill="#4ade80" fontSize="8" fontWeight="bold" fontFamily="monospace">SCL(22)</text>
                    <text x="82" y="16" fill="#fde047" fontSize="8" fontWeight="bold" fontFamily="monospace">SDA(21)</text>
                  </g>
                </g>

                {/* ============================================================== */}
                {/* 4. Modul Relay DARI DATABASE (Bottom Right)                     */}
                {/* ============================================================== */}
                <g
                  transform="translate(590, 255)"
                  className="transition-opacity duration-200"
                  opacity={isRelayActive ? 1 : 0.2}
                >
                  {/* Outer Module Board */}
                  <rect
                    x="0"
                    y="0"
                    width="265"
                    height={relayModuleHeight}
                    rx="12"
                    fill="#1e293b"
                    stroke="#22c55e"
                    strokeWidth="1.5"
                  />

                  {/* Header Title */}
                  <text x="16" y="22" fill="#4ade80" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    MODUL RELAY MULTI-CHANNEL (DB MySQL)
                  </text>
                  <text x="16" y="34" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
                    Sinkron otomatis dari tabel configured_lights
                  </text>

                  {/* Relay Channels Generated Dynamically */}
                  {effectiveLights.map((light, idx) => {
                    const blockY = 46 + idx * 52;
                    const color = LIGHT_COLORS[idx % LIGHT_COLORS.length];
                    return (
                      <g key={light.id} transform={`translate(15, ${blockY})`}>
                        {/* Relay Blue Box */}
                        <rect x="0" y="0" width="85" height="44" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                        <text x="42" y="18" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                          CH {idx + 1}: D{light.pin}
                        </text>
                        <text x="42" y="31" fill="#bae6fd" fontSize="7.5" fontFamily="sans-serif" textAnchor="middle">
                          {light.name.substring(0, 12)}
                        </text>

                        {/* Screw Terminal Blocks */}
                        <rect x="95" y="2" width="24" height="40" rx="3" fill="#0f766e" />
                        <circle cx="107" cy="12" r="3" fill="#cbd5e1" />
                        <circle cx="107" cy="30" r="3" fill="#cbd5e1" />

                        {/* Lamp Visualizer Output */}
                        <g transform="translate(130, 8)">
                          <circle cx="14" cy="14" r="11" fill="#fbbf24" filter="url(#glow)" fillOpacity="0.85" />
                          <text x="32" y="13" fill="#fef08a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                            {light.name}
                          </text>
                          <text x="32" y="24" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                            GPIO {light.pin} · {light.isDefault ? "Default" : "Custom"}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Low-Voltage Relay Input Header Pins at Bottom */}
                  <g transform={`translate(15, ${relayModuleHeight - 32})`}>
                    <rect x="0" y="0" width="235" height="24" rx="4" fill="#0f172a" />
                    <text x="10" y="16" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      VCC(5V)
                    </text>
                    <text x="55" y="16" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      GND
                    </text>
                    {effectiveLights.map((light, idx) => {
                      const posX = 90 + idx * 45;
                      const color = LIGHT_COLORS[idx % LIGHT_COLORS.length];
                      return (
                        <text
                          key={light.id}
                          x={posX}
                          y="16"
                          fill={color.stroke}
                          fontSize="8"
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
                {/* 5. JUMPER WIRES (Curved SVG Connection Paths)                   */}
                {/* ============================================================== */}

                {/* WIRE 1: DHT22 DATA ➔ ESP32 GPIO 4 (Blue Wire) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 205 C 10 205, -20 100, 380 100 C 500 100, 560 92, 720 92"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="205" r="4" fill="#3b82f6" />
                  <circle cx="720" cy="92" r="4" fill="#3b82f6" />
                  <rect x="360" y="90" width="80" height="18" rx="4" fill="#1e3a8a" />
                  <text x="400" y="103" fill="#bfdbfe" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 4 (DHT)
                  </text>
                </g>

                {/* WIRE 2: DHT22 VCC ➔ ESP32 3V3 (Red Wire) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 125 C 20 125, -10 50, 360 50 C 500 50, 580 82, 700 82"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="54" cy="125" r="3.5" fill="#ef4444" />
                  <circle cx="700" cy="82" r="3.5" fill="#ef4444" />
                </g>

                {/* WIRE 3: DHT22 GND ➔ ESP32 GND (Black/Slate Wire) */}
                <g opacity={isDhtActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 145 C 30 145, 10 70, 380 70 C 540 70, 640 82, 825 82"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="145" r="3.5" fill="#94a3b8" />
                  <circle cx="825" cy="82" r="3.5" fill="#94a3b8" />
                </g>

                {/* WIRE 4: BH1750 SDA ➔ ESP32 GPIO 21 (Yellow Wire) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 260 C -10 260, 250 200, 480 200 C 580 200, 640 208, 785 208"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="260" r="4" fill="#eab308" />
                  <circle cx="785" cy="208" r="4" fill="#eab308" />
                  <rect x="360" y="190" width="70" height="18" rx="4" fill="#713f12" />
                  <text x="395" y="203" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 21 (SDA)
                  </text>
                </g>

                {/* WIRE 5: BH1750 SCL ➔ ESP32 GPIO 22 (Green Wire) */}
                <g opacity={isBhActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d="M 54 280 C 20 280, 280 220, 490 220 C 570 220, 630 208, 755 208"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="54" cy="280" r="4" fill="#22c55e" />
                  <circle cx="755" cy="208" r="4" fill="#22c55e" />
                  <rect x="460" y="210" width="70" height="18" rx="4" fill="#14532d" />
                  <text x="495" y="223" fill="#bbf7d0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    GPIO 22 (SCL)
                  </text>
                </g>

                {/* WIRE 6: Relay VCC ➔ ESP32 VIN 5V (Red Wire from right header) */}
                <g opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                  <path
                    d={`M 236 125 C 280 125, 450 ${relayModuleHeight + 100}, 560 ${255 + relayModuleHeight - 20} C 575 ${255 + relayModuleHeight - 20}, 590 ${255 + relayModuleHeight - 20}, 615 ${255 + relayModuleHeight - 20}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6,3"
                  />
                  <circle cx="236" cy="125" r="3.5" fill="#ef4444" />
                  <circle cx="615" cy={255 + relayModuleHeight - 20} r="3.5" fill="#ef4444" />
                </g>

                {/* DYNAMIC JUMPER WIRES FOR EVERY LIGHT FROM DATABASE */}
                {effectiveLights.map((light, idx) => {
                  const startY = 50 + 270 + idx * 26;
                  const endX = 590 + 15 + 90 + idx * 45 + 15;
                  const endY = 255 + relayModuleHeight - 20;
                  const color = LIGHT_COLORS[idx % LIGHT_COLORS.length];
                  const midCurveY = 320 + idx * 30;

                  return (
                    <g key={light.id} opacity={isRelayActive ? 1 : 0.08} className="transition-opacity duration-200">
                      <path
                        d={`M 54 ${startY} C 10 ${startY}, 220 ${midCurveY}, 420 ${midCurveY} C 520 ${midCurveY}, ${endX - 30} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke={color.stroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      <circle cx="54" cy={startY} r="4" fill={color.stroke} />
                      <circle cx={endX} cy={endY} r="4" fill={color.stroke} />

                      {/* Floating Badge on wire */}
                      <rect
                        x={280 + idx * 25}
                        y={midCurveY - 10}
                        width="110"
                        height="18"
                        rx="4"
                        fill={color.fill}
                        stroke={color.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={335 + idx * 25}
                        y={midCurveY + 3}
                        fill={color.text}
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        GPIO {light.pin} ➔ {light.name.substring(0, 8)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Wire Connections Detailed Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Tabel Lengkap Sambungan Pinout (Tersinkron Database MySQL)</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {effectiveLights.length} Relay Aktif dari Database
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold">
                    <th className="py-2.5 px-3">Komponen / Beban</th>
                    <th className="py-2.5 px-3">Pin Komponen</th>
                    <th className="py-2.5 px-3">Pin Fisik ESP32</th>
                    <th className="py-2.5 px-3">Warna Kabel</th>
                    <th className="py-2.5 px-3">Status Database / Fungsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {/* DHT22 */}
                  <tr className="hover:bg-blue-50/40 transition">
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
                    <td className="py-2 px-3">Merah / Hitam</td>
                    <td className="py-2 px-3 text-slate-500">Tegangan kerja 3.3V</td>
                  </tr>

                  {/* BH1750 */}
                  <tr className="hover:bg-amber-50/40 transition">
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
                  <tr className="hover:bg-amber-50/40 transition">
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

                  {/* DYNAMIC RELAY ROWS MAPPED DIRECTLY FROM DATABASE */}
                  {effectiveLights.map((light, idx) => {
                    const color = LIGHT_COLORS[idx % LIGHT_COLORS.length];
                    return (
                      <tr key={light.id} className="hover:bg-emerald-50/40 transition bg-emerald-50/10">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${color.dot}`}></span>
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
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold border ${color.bg} ${color.textCls}`}
                          >
                            GPIO {light.pin} (D{light.pin})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`}></span>
                            <span>{color.name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-800 font-medium">
                          Tersimpan di DB: <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{light.id}</code>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Relay VCC Power */}
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-700">Relay Power</td>
                    <td className="py-2 px-3 font-mono">VCC &amp; GND</td>
                    <td className="py-2 px-3 font-mono font-bold text-rose-700">VIN (5V) &amp; GND</td>
                    <td className="py-2 px-3">Merah &amp; Hitam</td>
                    <td className="py-2 px-3 text-slate-500">Relay membutuhkan daya 5V dari pin VIN</td>
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
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Tabel database <code>configured_lights</code> otomatis menentukan skema kabel di atas.</span>
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
