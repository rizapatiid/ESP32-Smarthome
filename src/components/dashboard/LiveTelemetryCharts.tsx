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
import { Activity, Thermometer, Droplets, Sun } from "lucide-react";

export interface ChartDataPoint {
  time: string;
  temperature: number | null;
  humidity: number | null;
  lightLux: number | null;
}

interface Props {
  data: ChartDataPoint[];
}

export default function LiveTelemetryCharts({ data }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "temp" | "hum" | "light">("all");

  const formattedData = data.map((d) => ({
    ...d,
    timeLabel: d.time ? new Date(d.time).toLocaleTimeString("id-ID", { minute: "2-digit", second: "2-digit" }) : "",
  }));

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Grafik Telemetri Real-Time</h3>
            <p className="text-xs text-slate-500">
              Menampilkan {formattedData.length} pembacaan sensor terakhir secara berkelanjutan
            </p>
          </div>
        </div>

        {/* Filter Tab */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab("temp")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition ${
              activeTab === "temp" ? "bg-white text-rose-700 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Thermometer className="w-3 h-3 text-rose-500" />
            Suhu
          </button>
          <button
            onClick={() => setActiveTab("hum")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition ${
              activeTab === "hum" ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Droplets className="w-3 h-3 text-blue-500" />
            Kelembapan
          </button>
          <button
            onClick={() => setActiveTab("light")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition ${
              activeTab === "light" ? "bg-white text-amber-700 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Sun className="w-3 h-3 text-amber-500" />
            Cahaya
          </button>
        </div>
      </div>

      {/* Chart Containers */}
      {formattedData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
          <Activity className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
          <p className="text-sm font-medium">Belum ada titik data telemetri</p>
          <p className="text-xs">Data akan terisi secara otomatis seiring pembacaan sensor berjalan</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {/* Suhu */}
          {(activeTab === "all" || activeTab === "temp") && (
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Suhu Ruangan (°C)
                </span>
                <span className="text-slate-500">DHT22</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      width={35}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [typeof val === "number" ? `${val.toFixed(1)} °C` : "-", "Suhu"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#tempGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Kelembapan */}
          {(activeTab === "all" || activeTab === "hum") && (
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Kelembapan Relatif (%)
                </span>
                <span className="text-slate-500">DHT22</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      width={35}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [typeof val === "number" ? `${val.toFixed(1)} %` : "-", "Kelembapan"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#humGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Intensitas Cahaya */}
          {(activeTab === "all" || activeTab === "light") && (
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Intensitas Cahaya (Lux)
                </span>
                <span className="text-slate-500">BH1750</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      width={45}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [typeof val === "number" ? `${Math.round(val)} Lux` : "-", "Cahaya"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="lightLux"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#lightGradient)"
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
