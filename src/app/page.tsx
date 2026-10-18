"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import StatusHeader from "@/components/dashboard/StatusHeader";
import MetricCards from "@/components/dashboard/MetricCards";
import LightControlCard from "@/components/dashboard/LightControlCard";
import LiveTelemetryCharts, { ChartDataPoint } from "@/components/dashboard/LiveTelemetryCharts";
import RecentControlTable from "@/components/dashboard/RecentControlTable";
import { SystemStatus, SensorData, ControlLogItem } from "@/types/iot";

export default function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [lampState, setLampState] = useState<boolean>(false);
  const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);
  const [recentLogs, setRecentLogs] = useState<ControlLogItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const prevModeRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  // Fungsi fetch data periodik
  const pollData = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      // 1. Ambil status sistem
      const statusRes = await fetch("/api/status");
      let currentMode = "simulation";
      if (statusRes.ok) {
        const sJson: SystemStatus = await statusRes.json();
        setStatus(sJson);
        currentMode = sJson.mode || "simulation";

        // Jika mode berubah dari simulasi ke real (atau sebaliknya), reset titik grafik
        if (prevModeRef.current !== null && prevModeRef.current !== currentMode) {
          setChartPoints([]);
          setSensorData(null);
        }
        prevModeRef.current = currentMode;
      }

      // 2. Ambil data sensor live
      const sensorRes = await fetch("/api/sensors");
      if (sensorRes.ok) {
        const senJson = await sensorRes.json();
        if (senJson.success && senJson.data) {
          setSensorData(senJson.data);
          setLastUpdated(senJson.data.timestamp || new Date().toISOString());
          setErrorNotice(null);

          // Masukkan ke array titik grafik
          setChartPoints((prev) => {
            const next = [
              ...prev,
              {
                time: senJson.data.timestamp || new Date().toISOString(),
                temperature: senJson.data.temperature,
                humidity: senJson.data.humidity,
                lightLux: senJson.data.lightLux,
              },
            ];
            return next.length > 25 ? next.slice(next.length - 25) : next;
          });
        } else {
          setSensorData(null);
          setErrorNotice(senJson.error || "Gagal membaca sensor ESP32");
        }
      } else {
        const errJson = await sensorRes.json().catch(() => ({}));
        setSensorData(null);
        setErrorNotice(errJson.error || "Sensor tidak dapat diakses");
      }

      // 3. Ambil status lampu terkini
      const lightRes = await fetch("/api/control/light");
      if (lightRes.ok) {
        const lJson = await lightRes.json();
        if (typeof lJson.state === "boolean") {
          setLampState(lJson.state);
        }
      }

      // 4. Ambil 5 riwayat kontrol terbaru sesuai mode
      const logRes = await fetch("/api/control/history?limit=5");
      if (logRes.ok) {
        const logJson = await logRes.json();
        if (logJson.success && Array.isArray(logJson.data)) {
          setRecentLogs(logJson.data);
        }
      }
    } catch (err: unknown) {
      console.warn("Polling error:", err);
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  // Set interval polling
  useEffect(() => {
    pollData();
    const interval = setInterval(pollData, 2000);
    return () => clearInterval(interval);
  }, [pollData]);

  // Handler toggle lampu
  const handleToggleLamp = async (targetState: boolean) => {
    try {
      const res = await fetch("/api/control/light", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLampState(Boolean(data.confirmedState ?? targetState));
        // Refresh riwayat log segera
        const logRes = await fetch("/api/control/history?limit=5");
        if (logRes.ok) {
          const logJson = await logRes.json();
          if (logJson.data) setRecentLogs(logJson.data);
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || "Gagal mengontrol lampu" };
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Kesalahan koneksi",
      };
    }
  };

  const currentMode = status?.mode || "simulation";

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <StatusHeader status={status} lastUpdated={lastUpdated} />

      {/* Kartu Metrik Sensor */}
      <MetricCards
        sensorData={sensorData}
        mode={currentMode}
        error={errorNotice}
      />

      {/* Panel Kontrol Lampu */}
      <LightControlCard
        lampState={lampState}
        isSimulated={currentMode === "simulation"}
        onToggle={handleToggleLamp}
      />

      {/* Grafik Telemetri Recharts */}
      <LiveTelemetryCharts data={chartPoints} />

      {/* Riwayat Kontrol Terkini */}
      <RecentControlTable logs={recentLogs} />
    </div>
  );
}
