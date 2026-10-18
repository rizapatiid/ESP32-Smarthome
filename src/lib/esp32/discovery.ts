// ==============================================================================
// SMART HOME IoT — UDP BROADCAST DISCOVERY SERVICE
// ==============================================================================

import dgram from "dgram";
import { DiscoveryResponse } from "@/types/iot";
import { SIMULATION_DEVICE } from "@/lib/simulation/simulator";
import { upsertDevice } from "@/lib/database/mysql";

const UDP_PORT = parseInt(process.env.DISCOVERY_UDP_PORT || "8266", 10);
const BROADCAST_ADDR = "255.255.255.255";

export interface ScanResult {
  success: boolean;
  devices: DiscoveryResponse[];
  durationMs: number;
  error?: string;
}

/**
 * Jalankan UDP broadcast scan untuk mencari perangkat ESP32 di jaringan Wi-Fi lokal
 */
export async function performUdpDiscovery(
  timeoutMs = 3500,
  includeSimulation = true
): Promise<ScanResult> {
  const startTime = Date.now();
  const discoveredMap = new Map<string, DiscoveryResponse>();

  // Selalu tambahkan Simulator Device jika mode simulasi diizinkan
  if (includeSimulation) {
    discoveredMap.set(SIMULATION_DEVICE.deviceId, {
      ...SIMULATION_DEVICE,
      discoveredAt: new Date().toISOString(),
    });
  }

  return new Promise<ScanResult>((resolve) => {
    let client: dgram.Socket | null = null;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (client) {
        try {
          client.close();
        } catch {
          // Abaikan jika sudah tertutup
        }
        client = null;
      }
    };

    try {
      client = dgram.createSocket({ type: "udp4", reuseAddr: true });

      client.on("error", (err) => {
        console.warn("[UDP Discovery] Socket error:", err.message);
        cleanup();
        resolve({
          success: discoveredMap.size > 0,
          devices: Array.from(discoveredMap.values()),
          durationMs: Date.now() - startTime,
          error: err.message,
        });
      });

      client.on("message", async (msg, rinfo) => {
        try {
          const rawStr = msg.toString("utf-8");
          const data = JSON.parse(rawStr);

          // Validasi protokol dan struktur pesan respons
          if (
            (data.cmd === "DISCOVER_RESP" || data.cmd === "ANNOUNCE") &&
            data.deviceId &&
            data.deviceId.trim() !== ""
          ) {
            const device: DiscoveryResponse = {
              cmd: "DISCOVER_RESP",
              protocol: data.protocol || "NEXHOME_UDP_V1",
              deviceId: String(data.deviceId),
              deviceName: String(data.deviceName || `ESP32-${data.deviceId}`),
              deviceType: String(data.deviceType || "ESP32_DEV_KIT_V1"),
              ipAddress: data.ipAddress || rinfo.address,
              port: Number(data.port) || 80,
              firmwareVersion: String(data.firmwareVersion || "1.0.0"),
              capabilities: Array.isArray(data.capabilities)
                ? data.capabilities
                : ["dht22", "bh1750", "led"],
              uptime: Number(data.uptime) || 0,
              discoveredAt: new Date().toISOString(),
            };

            discoveredMap.set(device.deviceId, device);

            // Simpan otomatis ke database MySQL
            try {
              await upsertDevice({
                deviceId: device.deviceId,
                name: device.deviceName,
                deviceType: device.deviceType,
                lastIp: device.ipAddress,
                firmwareVersion: device.firmwareVersion,
                capabilities: device.capabilities,
                status: "ONLINE",
              });
            } catch (dbErr) {
              console.error("[UDP Discovery] Gagal menyimpan ke DB:", dbErr);
            }
          }
        } catch {
          // Bukan format JSON discovery yang valid, abaikan packet
        }
      });

      // Bind ke port 0 (OS otomatis alokasikan port ephemeral lokal)
      client.bind(0, () => {
        if (!client) return;
        try {
          client.setBroadcast(true);

          const payload = JSON.stringify({
            cmd: "DISCOVER_SMARTHOME",
            protocol: "NEXHOME_UDP_V1",
            timestamp: Date.now(),
          });

          const message = Buffer.from(payload);

          // Kirim broadcast request ke jaringan lokal
          client.send(message, 0, message.length, UDP_PORT, BROADCAST_ADDR, (err) => {
            if (err) {
              console.warn("[UDP Discovery] Gagal broadcast:", err.message);
            }
          });
        } catch (sendErr) {
          console.warn("[UDP Discovery] Send error:", sendErr);
        }
      });

      // Pasang timeout untuk menghentikan scan
      timer = setTimeout(() => {
        cleanup();
        resolve({
          success: true,
          devices: Array.from(discoveredMap.values()),
          durationMs: Date.now() - startTime,
        });
      }, timeoutMs);
    } catch (err: unknown) {
      cleanup();
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        success: discoveredMap.size > 0,
        devices: Array.from(discoveredMap.values()),
        durationMs: Date.now() - startTime,
        error: message,
      });
    }
  });
}
