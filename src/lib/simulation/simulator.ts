// ==============================================================================
// SMART HOME IoT — SIMULATION GENERATOR ENGINE
// ==============================================================================

import { SensorData, DiscoveryResponse } from "@/types/iot";

// State internal memory untuk generator simulasi
let currentTemp = 27.4;
let currentHumidity = 63.8;
let currentLight = 420;
let simulatedLampState = false;
let lastUpdate = Date.now();

export const SIMULATION_DEVICE: DiscoveryResponse = {
  cmd: "DISCOVER_RESP",
  protocol: "NEXHOME_UDP_V1",
  deviceId: "sim-esp32-01",
  deviceName: "ESP32 Virtual Simulator",
  deviceType: "ESP32_SIMULATOR",
  ipAddress: "127.0.0.1",
  port: 80,
  firmwareVersion: "v1.0.0-sim",
  capabilities: ["dht22", "bh1750", "led"],
  uptime: 12345,
  discoveredAt: new Date().toISOString(),
};

/**
 * Generate data sensor simulasi yang berfluktuasi secara halus dan realistis
 */
export function getSimulatedSensorData(): SensorData {
  const now = Date.now();
  const deltaSec = (now - lastUpdate) / 1000;
  lastUpdate = now;

  // Fluktuasi suhu: batas 24°C - 32°C
  const tempDrift = (Math.random() - 0.5) * 0.3;
  currentTemp = Math.max(24.0, Math.min(32.0, currentTemp + tempDrift));

  // Fluktuasi kelembapan: batas 50% - 85%
  const humDrift = (Math.random() - 0.5) * 0.5;
  currentHumidity = Math.max(50.0, Math.min(85.0, currentHumidity + humDrift));

  // Intensitas cahaya terpengaruh status lampu simulasi (+150 lux jika lampu ON)
  const baseLight = simulatedLampState ? 580 : 320;
  const lightDrift = (Math.random() - 0.5) * 35;
  currentLight = Math.max(50, Math.min(1000, baseLight + lightDrift));

  return {
    temperature: parseFloat(currentTemp.toFixed(1)),
    humidity: parseFloat(currentHumidity.toFixed(1)),
    lightLux: parseFloat(currentLight.toFixed(0)),
    isSimulated: true,
    timestamp: new Date().toISOString(),
    sensorStatus: {
      dht22: true,
      bh1750: true,
    },
  };
}

// Map pin simulasi (default pin 2)
const simulatedPins: Record<number, boolean> = { 2: false };

export function getSimulatedLampState(pin = 2): boolean {
  if (typeof simulatedPins[pin] === "boolean") {
    return simulatedPins[pin];
  }
  return pin === 2 ? simulatedLampState : false;
}

export function setSimulatedLampState(newState: boolean, pin = 2): {
  success: boolean;
  state: boolean;
  confirmedState: boolean;
  message: string;
} {
  simulatedPins[pin] = newState;
  if (pin === 2) {
    simulatedLampState = newState;
  }
  return {
    success: true,
    state: newState,
    confirmedState: newState,
    message: `Lampu simulator (GPIO ${pin}) berhasil ${newState ? "dinyalakan (ON)" : "dimatikan (OFF)"}`,
  };
}
