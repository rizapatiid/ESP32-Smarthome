// ==============================================================================
// SMART HOME IoT — ESP32 HTTP CLIENT SERVICE
// ==============================================================================

import { SensorData, LightState } from "@/types/iot";

/**
 * Validasi alamat IP lokal untuk mencegah kerentanan Server-Side Request Forgery (SSRF)
 */
export function isValidLocalIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();

  // Localhost
  if (trimmed === "127.0.0.1" || trimmed === "localhost") return true;

  // IPv4 Private Networks: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const parts = trimmed.split(".");
  if (parts.length !== 4) return false;

  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return false;

  // 10.x.x.x
  if (nums[0] === 10) return true;

  // 172.16.x.x - 172.31.x.x
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true;

  // 192.168.x.x
  if (nums[0] === 192 && nums[1] === 168) return true;

  return false;
}

export interface Esp32StatusResponse {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  firmwareVersion: string;
  uptime: number;
  freeHeap?: number;
  wifiRssi?: number;
  capabilities: string[];
}

/**
 * Periksa kesehatan ESP32 via GET /api/status
 */
export async function fetchEsp32Status(
  ip: string,
  port = 80,
  timeoutMs = 3500
): Promise<{ ok: boolean; data?: Esp32StatusResponse; error?: string }> {
  if (!isValidLocalIp(ip)) {
    return { ok: false, error: "Alamat IP bukan merupakan subnet jaringan lokal yang valid (SSRF Guard)." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `http://${ip}:${port}/api/status`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, error: `ESP32 merespons dengan status HTTP ${res.status}` };
    }

    const json = await res.json();
    return { ok: true, data: json };
  } catch (err: unknown) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message.includes("abort") ? "Timeout koneksi ke ESP32" : message };
  }
}

/**
 * Ambil pembacaan sensor langsung dari ESP32 via GET /api/sensors
 */
export async function fetchEsp32Sensors(
  ip: string,
  port = 80,
  timeoutMs = 3500
): Promise<{ ok: boolean; data?: SensorData; error?: string }> {
  if (!isValidLocalIp(ip)) {
    return { ok: false, error: "IP lokal tidak valid." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `http://${ip}:${port}/api/sensors`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const json = await res.json();

    const data: SensorData = {
      temperature: typeof json.temperature === "number" ? json.temperature : null,
      humidity: typeof json.humidity === "number" ? json.humidity : null,
      lightLux: typeof json.lightLux === "number" ? json.lightLux : null,
      isSimulated: false,
      timestamp: json.timestamp || new Date().toISOString(),
      sensorStatus: json.sensorStatus || { dht22: true, bh1750: true },
    };

    return { ok: true, data };
  } catch (err: unknown) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message.includes("abort") ? "Timeout sensor" : message };
  }
}

/**
 * Ambil status lampu saat ini dari ESP32 via GET /api/light
 */
export async function fetchEsp32LightState(
  ip: string,
  port = 80,
  timeoutMs = 3500
): Promise<{ ok: boolean; state?: boolean; error?: string }> {
  if (!isValidLocalIp(ip)) {
    return { ok: false, error: "IP lokal tidak valid." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `http://${ip}:${port}/api/light`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = await res.json();
    return { ok: true, state: Boolean(json.state) };
  } catch (err: unknown) {
    clearTimeout(timer);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Kirim perintah kontrol lampu ke ESP32 via POST /api/light (Mendukung parameter pin GPIO)
 */
export async function sendEsp32LightCommand(
  ip: string,
  port = 80,
  targetState: boolean,
  pin = 2,
  timeoutMs = 4000
): Promise<{
  ok: boolean;
  confirmedState?: boolean;
  message?: string;
  error?: string;
}> {
  if (!isValidLocalIp(ip)) {
    return { ok: false, error: "IP lokal tidak valid." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `http://${ip}:${port}/api/light`;
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ state: targetState, pin }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, error: `ESP32 gagal merespons: HTTP ${res.status}` };
    }

    const json = await res.json();
    const confirmed = typeof json.confirmedState === "boolean" ? json.confirmedState : json.state;

    return {
      ok: true,
      confirmedState: Boolean(confirmed),
      message: json.message || "Perintah berhasil dikonfirmasi ESP32",
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message.includes("abort") ? "Timeout konfirmasi perintah" : message };
  }
}
