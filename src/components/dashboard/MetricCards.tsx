"use client";

import { Thermometer, Droplets, Sun, AlertCircle } from "lucide-react";
import { SensorData } from "@/types/iot";

interface Props {
  sensorData: SensorData | null;
  error?: string | null;
}

export default function MetricCards({ sensorData, error }: Props) {
  const temp = sensorData?.temperature;
  const humidity = sensorData?.humidity;
  const light = sensorData?.lightLux;
  const isSimulated = sensorData?.isSimulated ?? true;

  // Analisis status suhu
  let tempStatus = "Normal";
  let tempPercent = 50;
  let tempStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (temp !== null && temp !== undefined) {
    // skala 15°C - 35°C
    tempPercent = Math.max(0, Math.min(100, ((temp - 15) / 20) * 100));
    if (temp > 30) {
      tempStatus = "Panas";
      tempStatusColor = "text-rose-700 bg-rose-50 border-rose-200";
    } else if (temp > 28) {
      tempStatus = "Hangat";
      tempStatusColor = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (temp < 22) {
      tempStatus = "Sejuk";
      tempStatusColor = "text-blue-700 bg-blue-50 border-blue-200";
    }
  }

  // Analisis status kelembapan
  let humStatus = "Ideal";
  let humPercent = 60;
  let humStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (humidity !== null && humidity !== undefined) {
    // skala 20% - 90%
    humPercent = Math.max(0, Math.min(100, ((humidity - 20) / 70) * 100));
    if (humidity > 70) {
      humStatus = "Lembap";
      humStatusColor = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (humidity < 40) {
      humStatus = "Kering";
      humStatusColor = "text-amber-700 bg-amber-50 border-amber-200";
    }
  }

  // Analisis intensitas cahaya
  let lightStatus = "Ideal";
  let lightPercent = 45;
  let lightStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (light !== null && light !== undefined) {
    // skala 0 - 1000 lux
    lightPercent = Math.max(0, Math.min(100, (light / 1000) * 100));
    if (light > 550) {
      lightStatus = "Terang";
      lightStatusColor = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (light < 150) {
      lightStatus = "Redup";
      lightStatusColor = "text-slate-700 bg-slate-100 border-slate-200";
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Suhu (DHT22) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover-card-elevation flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Suhu Ruangan
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSimulated
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isSimulated ? "SIMULASI" : "DHT22 RIIL"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            {temp !== null && temp !== undefined ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                  {temp.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-slate-400">°C</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 py-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold">Sensor offline</span>
              </div>
            )}

            {temp !== null && temp !== undefined && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tempStatusColor}`}>
                {tempStatus}
              </span>
            )}
          </div>

          {/* Mini Range Indicator Bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 via-emerald-400 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${tempPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Sejuk (15°C)</span>
              <span>Panas (35°C)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sensor: DHT22 • GPIO 4</span>
          <span>Target: 24 - 28 °C</span>
        </div>
      </div>

      {/* 2. Kelembapan (DHT22) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover-card-elevation flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kelembapan Udara
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSimulated
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isSimulated ? "SIMULASI" : "DHT22 RIIL"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            {humidity !== null && humidity !== undefined ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                  {humidity.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-slate-400">%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 py-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold">Sensor offline</span>
              </div>
            )}

            {humidity !== null && humidity !== undefined && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${humStatusColor}`}>
                {humStatus}
              </span>
            )}
          </div>

          {/* Mini Range Indicator Bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${humPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Kering (20%)</span>
              <span>Lembap (90%)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sensor: DHT22 • GPIO 4</span>
          <span>Ideal: 40 - 65 %</span>
        </div>
      </div>

      {/* 3. Intensitas Cahaya (BH1750) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover-card-elevation flex flex-col justify-between sm:col-span-2 lg:col-span-1">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Intensitas Cahaya
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSimulated
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isSimulated ? "SIMULASI" : "BH1750 RIIL"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            {light !== null && light !== undefined ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                  {Math.round(light).toLocaleString("id-ID")}
                </span>
                <span className="text-lg font-bold text-slate-400">Lux</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 py-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold">Sensor offline</span>
              </div>
            )}

            {light !== null && light !== undefined && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lightStatusColor}`}>
                {lightStatus}
              </span>
            )}
          </div>

          {/* Mini Range Indicator Bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-slate-400 via-amber-400 to-yellow-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${lightPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Redup (0 lx)</span>
              <span>Terang (1000+ lx)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sensor: BH1750 • I2C 0x23</span>
          <span>Batas: 1 - 65535 Lux</span>
        </div>
      </div>
    </div>
  );
}
