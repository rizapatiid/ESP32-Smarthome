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
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
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

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Riwayat Pembacaan Sensor
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                systemMode === "real"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  systemMode === "real" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {systemMode === "real" ? "Data Riil ESP32" : "Data Simulasi"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data telemetri otomatis disesuaikan dengan mode sistem yang aktif dan tersimpan permanen di Database
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Rangkuman Metrik Statistik Ringkas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Suhu
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-slate-900">
            <span className="text-2xl font-black font-mono">{stats.avgTemp.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-400">°C</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Kelembapan
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-slate-900">
            <span className="text-2xl font-black font-mono">{stats.avgHum.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-400">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Cahaya
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-slate-900">
            <span className="text-2xl font-black font-mono">{Math.round(stats.avgLight).toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400">Lux</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Entri Database
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-slate-900">
            <span className="text-2xl font-black font-mono text-blue-600">{total}</span>
            <span className="text-xs font-bold text-slate-400">baris</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (3 Kolom Bersih Tanpa Dropdown Jenis Data Manual) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Kueri Riwayat</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Menampilkan data sesuai mode: <strong className="text-slate-800">{systemMode === "real" ? "Real Hardware (ESP32)" : "Simulasi"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-bold mb-1">ID Perangkat</label>
            <input
              type="text"
              placeholder="Semua Perangkat"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Historis */}
      {chartData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Visualisasi Tren Historis ({chartData.length} sampel)</span>
            </h3>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Suhu
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Kelembapan
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Cahaya
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2 outline-none select-none [&_*]:outline-none [&_*]:focus:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" minTickGap={28} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" domain={["auto", "auto"]} width={38} tickLine={false} axisLine={false} tickFormatter={(val) => typeof val === "number" ? val.toFixed(1) : val} />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    typeof val === "number" ? val.toFixed(1) : "-",
                    name === "temp" ? "Suhu (°C)" : name === "humidity" ? "Kelembapan (%)" : "Cahaya (Lux)",
                  ]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="temp" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="light" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabel Data Historis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Tabel sensor_readings ({total} catatan)</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Sumber Data: {systemMode === "real" ? "ESP32 Fisik" : "Simulator"}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {systemMode === "real"
              ? "Belum ada rekaman data riil dari ESP32 di database. Pastikan ESP32 telah terhubung dan mengirim telemetri."
              : "Belum ada data simulasi yang tersimpan di database."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Waktu Rekam</th>
                  <th className="py-3 px-4">ID Perangkat</th>
                  <th className="py-3 px-4">Suhu (°C)</th>
                  <th className="py-3 px-4">Kelembapan (%)</th>
                  <th className="py-3 px-4">Cahaya (Lux)</th>
                  <th className="py-3 px-4">Status</th>
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
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.isSimulated
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {r.isSimulated ? "SIMULASI" : "DATA RIIL ESP32"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Halaman {page} dari {totalPages} ({total} baris)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
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
