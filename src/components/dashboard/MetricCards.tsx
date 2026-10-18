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
  let tempStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (temp !== null && temp !== undefined) {
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
  let humStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (humidity !== null && humidity !== undefined) {
    if (humidity > 70) {
      humStatus = "Lembap";
      humStatusColor = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (humidity < 40) {
      humStatus = "Kering";
      humStatusColor = "text-amber-700 bg-amber-50 border-amber-200";
    }
  }

  // Analisis intensitas cahaya
  let lightStatus = "Cukup";
  let lightStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (light !== null && light !== undefined) {
    if (light > 500) {
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
            <Thermometer className="w-4 h-4 text-rose-500" />
            <span>Suhu Ruangan</span>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isSimulated
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isSimulated ? "SIMULASI" : "DHT22 RIIL"}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            {temp !== null && temp !== undefined ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {temp.toFixed(1)}
                </span>
                <span className="text-xl font-medium text-slate-500">°C</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 py-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">Sensor tidak terbaca</span>
              </div>
            )}
          </div>

          {temp !== null && temp !== undefined && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tempStatusColor}`}>
              {tempStatus}
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Sensor: DHT22 (GPIO 4)</span>
          <span>Batas: 20°C - 35°C</span>
        </div>
      </div>

      {/* 2. Kelembapan (DHT22) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span>Kelembapan Udara</span>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isSimulated
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isSimulated ? "SIMULASI" : "DHT22 RIIL"}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            {humidity !== null && humidity !== undefined ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {humidity.toFixed(1)}
                </span>
                <span className="text-xl font-medium text-slate-500">%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 py-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">Sensor tidak terbaca</span>
              </div>
            )}
          </div>

          {humidity !== null && humidity !== undefined && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${humStatusColor}`}>
              {humStatus}
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Sensor: DHT22 (GPIO 4)</span>
          <span>Ideal: 40% - 60%</span>
        </div>
      </div>

      {/* 3. Intensitas Cahaya (BH1750) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Intensitas Cahaya</span>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isSimulated
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isSimulated ? "SIMULASI" : "BH1750 RIIL"}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            {light !== null && light !== undefined ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {Math.round(light).toLocaleString("id-ID")}
                </span>
                <span className="text-xl font-medium text-slate-500">Lux</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 py-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">Sensor tidak terbaca</span>
              </div>
            )}
          </div>

          {light !== null && light !== undefined && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${lightStatusColor}`}>
              {lightStatus}
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Sensor: BH1750 (I2C 0x23)</span>
          <span>Batas: 1 - 65535 lx</span>
        </div>
      </div>
    </div>
  );
}
