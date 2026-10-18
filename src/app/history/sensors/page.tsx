"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  Thermometer,
  Droplets,
  Sun,
  Download,
  CheckCircle2,
  Cpu,
  Clock,
  RotateCcw,
  Layers,
  ShieldCheck,
  FileText,
  Search,
  Radio,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { SensorData, OperatingMode } from "@/types/iot";

interface HistoryRecord extends SensorData {
  id: number;
  deviceId: string;
}

export default function SensorHistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [systemMode, setSystemMode] = useState<OperatingMode>("simulation");

  // Filter States
  const [deviceId, setDeviceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Cek mode sistem aktif (real atau simulation)
  useEffect(() => {
    async function checkMode() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const json = await res.json();
          if (json.mode) {
            setSystemMode(json.mode);
          }
        }
      } catch (err) {
        console.warn("Gagal mengecek mode sistem:", err);
      }
    }
    checkMode();
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");

      if (deviceId) params.set("deviceId", deviceId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      // Otomatis sesuaikan data dengan mode sistem yang sedang aktif
      if (systemMode === "real") {
        params.set("isSimulated", "false");
      } else {
        params.set("isSimulated", "true");
      }

      const res = await fetch(`/api/sensors/history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err: unknown) {
      console.error("Gagal memuat histori sensor:", err);
    } finally {
      setLoading(false);
    }
  }, [page, deviceId, startDate, endDate, systemMode]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Statistik agregasi sampel halaman saat ini
  const stats = useMemo(() => {
    if (records.length === 0) return { avgTemp: 0, avgHum: 0, avgLight: 0 };
    const validTemp = records.filter((r) => r.temperature !== null).map((r) => r.temperature!);
    const validHum = records.filter((r) => r.humidity !== null).map((r) => r.humidity!);
    const validLight = records.filter((r) => r.lightLux !== null).map((r) => r.lightLux!);

    const avgTemp = validTemp.length ? validTemp.reduce((a, b) => a + b, 0) / validTemp.length : 0;
    const avgHum = validHum.length ? validHum.reduce((a, b) => a + b, 0) / validHum.length : 0;
    const avgLight = validLight.length ? validLight.reduce((a, b) => a + b, 0) / validLight.length : 0;

    return { avgTemp, avgHum, avgLight };
  }, [records]);

  // Ekspor Data ke CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = ["ID", "Waktu", "ID Perangkat", "Suhu (°C)", "Kelembapan (%)", "Cahaya (Lux)", "Mode"];
    const rows = records.map((r) => [
      r.id,
      r.timestamp,
      `"${r.deviceId}"`,
      r.temperature ?? "",
      r.humidity ?? "",
      r.lightLux ?? "",
      r.isSimulated ? "SIMULASI" : "DATA RIIL",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sensor_${systemMode === "real" ? "real" : "sim"}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Data grafik urutan waktu kronologis
  const chartData = [...records].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temp: r.temperature,
    humidity: r.humidity,
    light: r.lightLux,
  }));

  const [activeChartTab, setActiveChartTab] = useState<"all" | "temp" | "hum" | "light">("all");

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Riwayat Sensor
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  systemMode === "real"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    systemMode === "real" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {systemMode === "real" ? "Real" : "Simulasi"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Arsip data telemetri yang tersimpan di Database
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center pt-1 sm:pt-0">
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold transition disabled:opacity-50 active:scale-[0.98] shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Rangkuman Metrik Statistik Ringkas dengan Ikon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Suhu Rata-rata
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 shrink-0">
              <Thermometer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-slate-900">
            <span className="text-xl sm:text-2xl font-black font-mono">{stats.avgTemp.toFixed(1)}</span>
            <span className="text-xs font-semibold text-slate-400">°C</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md w-fit border border-emerald-100/60">
            <CheckCircle2 className="w-3 h-3" />
            <span>Rentang Normal</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kelembapan
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shrink-0">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-slate-900">
            <span className="text-xl sm:text-2xl font-black font-mono">{stats.avgHum.toFixed(1)}</span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md w-fit border border-blue-100/60">
            <Droplets className="w-3 h-3" />
            <span>RH Terkendali</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cahaya
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 shrink-0">
              <Sun className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-slate-900">
            <span className="text-xl sm:text-2xl font-black font-mono">{Math.round(stats.avgLight).toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-400">Lux</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50/80 px-2 py-0.5 rounded-md w-fit border border-amber-100/60">
            <Sun className="w-3 h-3" />
            <span>Intensitas Ruang</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Entri
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shrink-0">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-slate-900">
            <span className="text-xl sm:text-2xl font-black font-mono text-blue-600">{total}</span>
            <span className="text-xs font-semibold text-slate-400">baris</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md w-fit border border-indigo-100/60">
            <ShieldCheck className="w-3 h-3" />
            <span>Database Sinkron</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Kompak & Rapi dengan Ikon SVG) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Filter Kueri Data</span>
          </div>

          {(deviceId || startDate || endDate) ? (
            <button
              onClick={() => {
                setDeviceId("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Semua data</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] mb-1">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span>ID Perangkat</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Semua Perangkat"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <div>
              <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] mb-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Tanggal Mulai</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] mb-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Tanggal Selesai</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Historis */}
      {chartData.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Visualisasi Tren Sensor</h3>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                  {chartData.length} sampel
                </span>
              </div>
            </div>

            {/* Tab Switcher Pills dengan Ikon SVG */}
            <div className="grid grid-cols-4 w-full sm:w-auto sm:flex sm:items-center bg-slate-100/90 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/60">
              <button
                onClick={() => setActiveChartTab("all")}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center ${
                  activeChartTab === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Semua</span>
              </button>
              <button
                onClick={() => setActiveChartTab("temp")}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center ${
                  activeChartTab === "temp" ? "bg-white text-rose-700 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Suhu</span>
              </button>
              <button
                onClick={() => setActiveChartTab("hum")}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center ${
                  activeChartTab === "hum" ? "bg-white text-blue-700 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Lembap</span>
              </button>
              <button
                onClick={() => setActiveChartTab("light")}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center ${
                  activeChartTab === "light" ? "bg-white text-amber-700 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Cahaya</span>
              </button>
            </div>
          </div>

          <div className="h-56 w-full pt-1 outline-none select-none [&_*]:outline-none [&_*]:focus:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="histHumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="histLightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  stroke="#cbd5e1"
                  minTickGap={28}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  stroke="#cbd5e1"
                  domain={["auto", "auto"]}
                  width={40}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (typeof val === "number" ? val.toFixed(1) : val)}
                />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    typeof val === "number"
                      ? `${val.toFixed(1)} ${
                          name === "temp" ? "°C" : name === "humidity" ? "%" : "Lux"
                        }`
                      : "-",
                    name === "temp" ? "Suhu" : name === "humidity" ? "Kelembapan" : "Cahaya",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                  }}
                />
                {(activeChartTab === "all" || activeChartTab === "temp") && (
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#f43f5e"
                    fill="url(#histTempGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                )}
                {(activeChartTab === "all" || activeChartTab === "hum") && (
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    fill="url(#histHumGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                )}
                {(activeChartTab === "all" || activeChartTab === "light") && (
                  <Area
                    type="monotone"
                    dataKey="light"
                    stroke="#f59e0b"
                    fill="url(#histLightGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabel & Daftar Data Historis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Rekaman Data Telemetri</span>
            <span className="text-xs font-normal text-slate-400 font-mono">({total} entri)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>Sumber: {systemMode === "real" ? "ESP32 Fisik" : "Simulator"}</span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs px-4">
            {systemMode === "real"
              ? "Belum ada rekaman data riil dari ESP32 di database. Pastikan ESP32 telah terhubung dan mengirim telemetri."
              : "Belum ada data simulasi yang tersimpan di database."}
          </div>
        ) : (
          <>
            {/* Tampilan Mobile: Kartu Vertikal Ringkas & Rapi dengan Ikon SVG */}
            <div className="sm:hidden divide-y divide-slate-100">
              {records.map((r) => (
                <div key={r.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 truncate">
                        <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                        {r.deviceId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        #{r.id}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        r.isSimulated
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {r.isSimulated ? (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>SIMULASI</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>DATA RIIL</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* 3 Metrik Micro-Grid dengan Ikon SVG */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                        <Thermometer className="w-2.5 h-2.5" />
                        Suhu
                      </span>
                      <span className="text-xs font-black font-mono text-slate-900 block">
                        {r.temperature !== null ? `${r.temperature.toFixed(1)} °C` : "-"}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-x border-slate-200/60 px-1">
                      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        <Droplets className="w-2.5 h-2.5" />
                        Lembap
                      </span>
                      <span className="text-xs font-black font-mono text-slate-900 block">
                        {r.humidity !== null ? `${r.humidity.toFixed(1)} %` : "-"}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        <Sun className="w-2.5 h-2.5" />
                        Cahaya
                      </span>
                      <span className="text-xs font-black font-mono text-slate-900 block">
                        {r.lightLux !== null ? `${Math.round(r.lightLux)} Lx` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Waktu Rekam */}
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Waktu Rekam
                    </span>
                    <span className="text-slate-600 font-medium">
                      {new Date(r.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tampilan Desktop: Tabel Lengkap dengan Ikon SVG */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Waktu Rekam
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        ID Perangkat
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-rose-600">
                        <Thermometer className="w-3 h-3" />
                        Suhu (°C)
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <Droplets className="w-3 h-3" />
                        Kelembapan (%)
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Sun className="w-3 h-3" />
                        Cahaya (Lux)
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-slate-400" />
                        Status
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {new Date(r.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {r.deviceId}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {r.temperature !== null ? `${r.temperature.toFixed(1)} °C` : "null"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {r.humidity !== null ? `${r.humidity.toFixed(1)} %` : "null"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">
                        {r.lightLux !== null ? `${Math.round(r.lightLux).toLocaleString()} Lux` : "null"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.isSimulated
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {r.isSimulated ? (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>SIMULASI</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>DATA RIIL ESP32</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-center sm:text-left justify-center sm:justify-start">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Halaman <strong className="text-slate-700 font-bold">{page}</strong> dari{" "}
              <strong className="text-slate-700 font-bold">{totalPages}</strong>{" "}
              <span className="text-slate-400">({total} total entri)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
