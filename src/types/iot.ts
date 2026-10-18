// ==============================================================================
// SMART HOME IoT — DATA TYPES & INTERFACES
// ==============================================================================

export type OperatingMode = "simulation" | "real";

export interface DeviceInfo {
  id?: number;
  deviceId: string;
  name: string;
  deviceType: string;
  lastIp: string | null;
  firmwareVersion: string | null;
  lastStatus: "ONLINE" | "OFFLINE";
  capabilities: string[];
  lastSeenAt: string | null;
  isOnline?: boolean;
}

export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  lightLux: number | null;
  isSimulated: boolean;
  timestamp: string;
  sensorStatus?: {
    dht22: boolean;
    bh1750: boolean;
  };
}

export interface LightState {
  state: boolean;
  gpio?: number;
  updatedAt?: string;
  isSimulated?: boolean;
}

export interface ControlLogItem {
  id: number;
  deviceId: string;
  command: string;
  requestedState: boolean;
  confirmedState: boolean | null;
  status: "SUCCESS" | "FAILED" | "PENDING";
  errorMessage: string | null;
  isSimulated: boolean;
  executedAt: string;
  confirmedAt: string | null;
}

export interface DiscoveryResponse {
  cmd: string;
  protocol: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  port: number;
  firmwareVersion: string;
  capabilities: string[];
  uptime?: number;
  discoveredAt?: string;
}

export interface SystemStatus {
  mode: OperatingMode;
  uptimeSeconds: number;
  database: {
    status: "CONNECTED" | "DISCONNECTED" | "ERROR";
    host: string;
    port: number;
    latencyMs?: number;
    error?: string;
  };
  activeDevice: {
    deviceId: string | null;
    deviceName: string | null;
    ipAddress: string | null;
    isOnline: boolean;
    lastPingAt: string | null;
  };
}
