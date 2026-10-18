"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Activity, Thermometer, Droplets, Sun, Sparkles } from "lucide-react";

export interface ChartDataPoint {
  time: string;
  temperature: number | null;
  humidity: number | null;
  lightLux: number | null;
}

interface Props {
  data: ChartDataPoint[];
}

// Custom Glassmorphic Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-slate-700/60 shadow-xl text-xs space-y-1.5">
        <p className="text-[11px] font-mono text-slate-400 border-b border-slate-700/60 pb-1">
          Waktu: {label}
        </p>
        {payload.map((entry: any, index: number) => {
          let unit = "°C";
          let labelName = "Suhu";
          if (entry.dataKey === "humidity") {
            unit = "%";
            labelName = "Kelembapan";
          } else if (entry.dataKey === "lightLux") {
            unit = "Lux";
            labelName = "Cahaya";
          }
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                {labelName}:
              </span>
              <span className="font-bold" style={{ color: entry.stroke }}>
                {entry.value !== null ? `${Number(entry.value).toFixed(1)} ${unit}` : "-"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function LiveTelemetryCharts({ data }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "temp" | "hum" | "light">("all");

  const formattedData = data.map((d) => ({
    ...d,
    timeLabel: d.time ? new Date(d.time).toLocaleTimeString("id-ID", { minute: "2-digit", second: "2-digit" }) : "",
  }));

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight">
              Grafik Telemetri Real-Time
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Sliding window {formattedData.length} sampel pembacaan terakhir
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab("temp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "temp" ? "bg-white text-rose-700 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            Suhu
          </button>
          <button
            onClick={() => setActiveTab("hum")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "hum" ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
            Kelembapan
          </button>
          <button
            onClick={() => setActiveTab("light")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "light" ? "bg-white text-amber-700 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            Cahaya
          </button>
        </div>
      </div>

      {/* Chart Display */}
      {formattedData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Activity className="w-8 h-8 stroke-1 text-slate-300 mb-2 animate-pulse" />
          <p className="text-sm font-semibold text-slate-600">Menghubungkan ke data telemetri...</p>
          <p className="text-xs text-slate-400">Titik data akan segera ditampilkan seiring sensor berjalan</p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Suhu */}
          {(activeTab === "all" || activeTab === "temp") && (
            <div className="border border-slate-200/60 rounded-xl p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Suhu (°C) — DHT22
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Skala Dinamis °C
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="tempGradientNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" width={32} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f43f5e"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#tempGradientNew)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Kelembapan */}
          {(activeTab === "all" || activeTab === "hum") && (
            <div className="border border-slate-200/60 rounded-xl p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Kelembapan (%) — DHT22
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Skala Dinamis %
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="humGradientNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" width={32} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#humGradientNew)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cahaya */}
          {(activeTab === "all" || activeTab === "light") && (
            <div className="border border-slate-200/60 rounded-xl p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Intensitas Cahaya (Lux) — BH1750
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Skala Dinamis Lux
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="lightGradientNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" width={42} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="lightLux"
                      stroke="#f59e0b"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#lightGradientNew)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
