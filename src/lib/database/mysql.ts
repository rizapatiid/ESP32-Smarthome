// ==============================================================================
// SMART HOME IoT — DATABASE SERVICE (HOSTINGER MYSQL VIA MYSQL2 POOL)
// ==============================================================================

import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { DeviceInfo, SensorData, ControlLogItem } from "@/types/iot";

let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    const host = process.env.DB_HOST || "srv1412.hstgr.io";
    const port = parseInt(process.env.DB_PORT || "3306", 10);
    const user = process.env.DB_USER || "u500072377_smarthome";
    const password = process.env.DB_PASSWORD || "Smarthm1234";
    const database = process.env.DB_NAME || "u500072377_smarthome";

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return pool;
}

/**
 * Uji koneksi ke database dan ukur latency response
 */
export async function testDatabaseConnection(): Promise<{
  ok: boolean;
  host: string;
  port: number;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  const host = process.env.DB_HOST || "srv1412.hstgr.io";
  const port = parseInt(process.env.DB_PORT || "3306", 10);

  try {
    const db = getDatabasePool();
    await db.query("SELECT 1 AS healthcheck");
    const latencyMs = Date.now() - start;
    return { ok: true, host, port, latencyMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, host, port, latencyMs: Date.now() - start, error: message };
  }
}

/**
 * Ambil seluruh daftar perangkat yang tersimpan
 */
export async function getDevices(): Promise<DeviceInfo[]> {
  const db = getDatabasePool();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM devices ORDER BY last_seen_at DESC, id DESC"
  );

  return rows.map((r) => {
    let capabilities: string[] = ["dht22", "bh1750", "led"];
    try {
      if (r.capabilities) {
        capabilities = JSON.parse(r.capabilities);
      }
    } catch {
      // fallback
    }

    return {
      id: r.id,
      deviceId: r.device_id,
      name: r.name,
      deviceType: r.device_type,
      lastIp: r.last_ip,
      firmwareVersion: r.firmware_version,
      lastStatus: r.last_status,
      capabilities,
      lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null,
      isOnline: r.last_status === "ONLINE",
    };
  });
}

/**
 * Ambil single device berdasarkan deviceId
 */
export async function getDeviceById(deviceId: string): Promise<DeviceInfo | null> {
  const db = getDatabasePool();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM devices WHERE device_id = ? LIMIT 1",
    [deviceId]
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  let capabilities: string[] = ["dht22", "bh1750", "led"];
  try {
    if (r.capabilities) capabilities = JSON.parse(r.capabilities);
  } catch {
    // fallback
  }

  return {
    id: r.id,
    deviceId: r.device_id,
    name: r.name,
    deviceType: r.device_type,
    lastIp: r.last_ip,
    firmwareVersion: r.firmware_version,
    lastStatus: r.last_status,
    capabilities,
    lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null,
    isOnline: r.last_status === "ONLINE",
  };
}

/**
 * Simpan atau perbarui data perangkat hasil discovery
 */
export async function upsertDevice(data: {
  deviceId: string;
  name: string;
  deviceType?: string;
  lastIp: string;
  firmwareVersion?: string;
  capabilities?: string[];
  status?: "ONLINE" | "OFFLINE";
}): Promise<boolean> {
  const db = getDatabasePool();
  const capabilitiesStr = JSON.stringify(data.capabilities || ["dht22", "bh1750", "led"]);
  const status = data.status || "ONLINE";

  const query = `
    INSERT INTO devices (device_id, name, device_type, last_ip, firmware_version, capabilities, last_status, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      device_type = VALUES(device_type),
      last_ip = VALUES(last_ip),
      firmware_version = VALUES(firmware_version),
      capabilities = VALUES(capabilities),
      last_status = VALUES(last_status),
      last_seen_at = NOW(),
      updated_at = NOW()
  `;

  await db.query(query, [
    data.deviceId,
    data.name,
    data.deviceType || "ESP32_DEV_KIT_V1",
    data.lastIp,
    data.firmwareVersion || "1.0.0",
    capabilitiesStr,
    status,
  ]);

  // Pastikan device_states juga ada
  await db.query(
    `
    INSERT INTO device_states (device_id, is_online, last_ping_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      is_online = VALUES(is_online),
      last_ping_at = NOW(),
      updated_at = NOW()
  `,
    [data.deviceId, status === "ONLINE"]
  );

  return true;
}

/**
 * Perbarui status online/offline perangkat
 */
export async function updateDeviceStatus(
  deviceId: string,
  isOnline: boolean,
  lastIp?: string
): Promise<void> {
  const db = getDatabasePool();
  const status = isOnline ? "ONLINE" : "OFFLINE";

  if (lastIp) {
    await db.query(
      `UPDATE devices SET last_status = ?, last_ip = ?, last_seen_at = NOW() WHERE device_id = ?`,
      [status, lastIp, deviceId]
    );
  } else {
    await db.query(
      `UPDATE devices SET last_status = ?, last_seen_at = NOW() WHERE device_id = ?`,
      [status, deviceId]
    );
  }

  await db.query(
    `
    INSERT INTO device_states (device_id, is_online, last_ping_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      is_online = VALUES(is_online),
      last_ping_at = NOW(),
      updated_at = NOW()
  `,
    [deviceId, isOnline]
  );
}

/**
 * Simpan data pembacaan sensor ke tabel sensor_readings
 */
export async function saveSensorReading(data: {
  deviceId: string;
  temperature: number | null;
  humidity: number | null;
  lightLux: number | null;
  isSimulated?: boolean;
}): Promise<boolean> {
  try {
    const db = getDatabasePool();
    const query = `
      INSERT INTO sensor_readings (device_id, temperature, humidity, light_lux, is_simulated, recorded_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await db.query(query, [
      data.deviceId,
      data.temperature,
      data.humidity,
      data.lightLux,
      data.isSimulated ? 1 : 0,
    ]);

    return true;
  } catch (err) {
    console.error("Gagal menyimpan sensor reading:", err);
    return false;
  }
}

/**
 * Ambil histori pembacaan sensor dengan filter dan pagination
 */
export async function getSensorHistory(options: {
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  isSimulated?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  data: Array<SensorData & { id: number; deviceId: string }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const db = getDatabasePool();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  let params: unknown[] = [];

  if (options.deviceId) {
    whereClauses.push("device_id = ?");
    params.push(options.deviceId);
  }

  if (options.startDate) {
    whereClauses.push("recorded_at >= ?");
    params.push(new Date(options.startDate));
  }

  if (options.endDate) {
    whereClauses.push("recorded_at <= ?");
    params.push(new Date(options.endDate));
  }

  if (typeof options.isSimulated === "boolean") {
    whereClauses.push("is_simulated = ?");
    params.push(options.isSimulated ? 1 : 0);
  }

  const whereStr = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  // Hitung total
  const countSql = `SELECT COUNT(*) AS total FROM sensor_readings ${whereStr}`;
  const [countRows] = await db.query<RowDataPacket[]>(countSql, params);
  const total = countRows[0]?.total || 0;

  // Ambil data
  const dataSql = `
    SELECT id, device_id, temperature, humidity, light_lux, is_simulated, recorded_at
    FROM sensor_readings
    ${whereStr}
    ORDER BY recorded_at DESC
    LIMIT ? OFFSET ?
  `;

  const [dataRows] = await db.query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

  const items = dataRows.map((r) => ({
    id: Number(r.id),
    deviceId: r.device_id,
    temperature: r.temperature !== null ? Number(r.temperature) : null,
    humidity: r.humidity !== null ? Number(r.humidity) : null,
    lightLux: r.light_lux !== null ? Number(r.light_lux) : null,
    isSimulated: Boolean(r.is_simulated),
    timestamp: new Date(r.recorded_at).toISOString(),
  }));

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Ambil status lampu dan online perangkat
 */
export async function getDeviceState(deviceId: string): Promise<{
  isOnline: boolean;
  lampState: boolean;
  lastPingAt: string | null;
} | null> {
  const db = getDatabasePool();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT is_online, lamp_state, last_ping_at FROM device_states WHERE device_id = ? LIMIT 1",
    [deviceId]
  );

  if (rows.length === 0) return null;
  return {
    isOnline: Boolean(rows[0].is_online),
    lampState: Boolean(rows[0].lamp_state),
    lastPingAt: rows[0].last_ping_at ? new Date(rows[0].last_ping_at).toISOString() : null,
  };
}

/**
 * Simpan status lampu dan online perangkat
 */
export async function saveDeviceState(
  deviceId: string,
  isOnline: boolean,
  lampState: boolean
): Promise<void> {
  const db = getDatabasePool();
  await db.query(
    `
    INSERT INTO device_states (device_id, is_online, lamp_state, last_ping_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      is_online = VALUES(is_online),
      lamp_state = VALUES(lamp_state),
      last_ping_at = NOW(),
      updated_at = NOW()
  `,
    [deviceId, isOnline, lampState]
  );
}

/**
 * Catat perintah kontrol ke control_logs
 */
export async function logControlCommand(data: {
  deviceId: string;
  command: string;
  requestedState: boolean;
  confirmedState?: boolean | null;
  status: "SUCCESS" | "FAILED" | "PENDING";
  errorMessage?: string | null;
  isSimulated?: boolean;
}): Promise<number> {
  const db = getDatabasePool();
  const query = `
    INSERT INTO control_logs (device_id, command, requested_state, confirmed_state, status, error_message, is_simulated, executed_at, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ${data.status === "SUCCESS" ? "NOW()" : "NULL"})
  `;

  const [result] = await db.query<ResultSetHeader>(query, [
    data.deviceId,
    data.command,
    data.requestedState ? 1 : 0,
    data.confirmedState !== undefined && data.confirmedState !== null
      ? data.confirmedState
        ? 1
        : 0
      : null,
    data.status,
    data.errorMessage || null,
    data.isSimulated ? 1 : 0,
  ]);

  return result.insertId;
}

/**
 * Ambil riwayat log kontrol dengan pagination
 */
export async function getControlLogs(options: {
  deviceId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: ControlLogItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const db = getDatabasePool();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  let params: unknown[] = [];

  if (options.deviceId) {
    whereClauses.push("device_id = ?");
    params.push(options.deviceId);
  }

  const whereStr = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM control_logs ${whereStr}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT id, device_id, command, requested_state, confirmed_state, status, error_message, is_simulated, executed_at, confirmed_at
    FROM control_logs
    ${whereStr}
    ORDER BY executed_at DESC
    LIMIT ? OFFSET ?
  `,
    [...params, limit, offset]
  );

  const data: ControlLogItem[] = rows.map((r) => ({
    id: r.id,
    deviceId: r.device_id,
    command: r.command,
    requestedState: Boolean(r.requested_state),
    confirmedState: r.confirmed_state !== null ? Boolean(r.confirmed_state) : null,
    status: r.status,
    errorMessage: r.error_message,
    isSimulated: Boolean(r.is_simulated),
    executedAt: new Date(r.executed_at).toISOString(),
    confirmedAt: r.confirmed_at ? new Date(r.confirmed_at).toISOString() : null,
  }));

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Simpan / ambil preferensi konfigurasi
 */
export async function getSystemSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const db = getDatabasePool();
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1",
      [key]
    );
    if (rows.length === 0) return defaultValue;
    return rows[0].setting_value;
  } catch {
    return defaultValue;
  }
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
  const db = getDatabasePool();
  await db.query(
    `
    INSERT INTO system_settings (setting_key, setting_value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_at = NOW()
  `,
    [key, value]
  );
}
