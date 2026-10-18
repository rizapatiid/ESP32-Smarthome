"use client";

import { useState, useEffect, useCallback } from "react";
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
import { SensorData } from "@/types/iot";

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

  // Filter States
  const [deviceId, setDeviceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [simFilter, setSimFilter] = useState<"all" | "real" | "sim">("all");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      if (deviceId) params.set("deviceId", deviceId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (simFilter === "real") params.set("isSimulated", "false");
      if (simFilter === "sim") params.set("isSimulated", "true");

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
  }, [page, deviceId, startDate, endDate, simFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Data terformat untuk grafik (dibalik agar urutan waktu dari kiri ke kanan)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Riwayat Pembacaan Sensor
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Data historis telemetri yang tersimpan secara terpusat di Hostinger MySQL
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filter Data Sensor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">ID Perangkat</label>
            <input
              type="text"
              placeholder="Contoh: esp32-smarthome-01"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Jenis Data</label>
            <select
              value={simFilter}
              onChange={(e) => {
                setSimFilter(e.target.value as "all" | "real" | "sim");
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Data (Riil & Simulasi)</option>
              <option value="real">Hanya Data Riil ESP32</option>
              <option value="sim">Hanya Data Simulasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Historis */}
      {chartData.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Tren Historis Pembacaan Halaman Ini</span>
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan {chartData.length} sampel dari total {total} baris
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={["auto", "auto"]} width={35} />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    typeof val === "number" ? val.toFixed(1) : "-",
                    name === "temp" ? "Suhu (°C)" : name === "humidity" ? "Kelembapan (%)" : "Cahaya (Lux)",
                  ]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="temp" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="light" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabel Data Historis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Tabel sensor_readings ({total} entri)</span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Tidak ada data sensor yang sesuai dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Waktu Rekam</th>
                  <th className="py-3 px-4">ID Perangkat</th>
                  <th className="py-3 px-4">Suhu (°C)</th>
                  <th className="py-3 px-4">Kelembapan (%)</th>
                  <th className="py-3 px-4">Cahaya (Lux)</th>
                  <th className="py-3 px-4">Mode Rekam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      {new Date(r.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {r.deviceId}
                    </td>
                    <td className="py-3 px-4">
                      {r.temperature !== null ? (
                        <span className="font-semibold text-rose-600">
                          {r.temperature.toFixed(1)} °C
                        </span>
                      ) : (
                        <span className="text-slate-400">null</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.humidity !== null ? (
                        <span className="font-semibold text-blue-600">
                          {r.humidity.toFixed(1)} %
                        </span>
                      ) : (
                        <span className="text-slate-400">null</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.lightLux !== null ? (
                        <span className="font-semibold text-amber-600">
                          {Math.round(r.lightLux).toLocaleString("id-ID")} Lux
                        </span>
                      ) : (
                        <span className="text-slate-400">null</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          r.isSimulated
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {r.isSimulated ? "SIMULASI" : "DATA RIIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Halaman {page} dari {totalPages} (Total: {total} entri)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
