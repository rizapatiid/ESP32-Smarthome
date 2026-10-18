// ==============================================================================
// SMART HOME IoT — STANDALONE UDP DISCOVERY DAEMON
// ==============================================================================
// Script ini dapat dijalankan di terminal terpisah jika Anda ingin melakukan
// continuous background discovery perangkat ESP32 di jaringan Wi-Fi lokal.
// Jalankan dengan: node scripts/discovery-daemon.js
// ==============================================================================

const dgram = require('dgram');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

const UDP_PORT = parseInt(process.env.DISCOVERY_UDP_PORT || '8266', 10);
const BROADCAST_INTERVAL_MS = 15000; // Broadcast tiap 15 detik

const dbConfig = {
  host: process.env.DB_HOST || 'srv1412.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'u500072377_smarthome',
  password: process.env.DB_PASSWORD || 'Smarthm1234',
  database: process.env.DB_NAME || 'u500072377_smarthome',
  ssl: { rejectUnauthorized: false },
};

let dbPool;
try {
  dbPool = mysql.createPool(dbConfig);
  console.log('[Daemon] Database pool MySQL Hostinger aktif.');
} catch (err) {
  console.error('[Daemon] Gagal inisialisasi pool MySQL:', err.message);
}

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

socket.on('error', (err) => {
  console.error('[Daemon] Socket error:', err.message);
});

socket.on('message', async (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString('utf-8'));
    if (
      (data.cmd === 'DISCOVER_RESP' || data.cmd === 'ANNOUNCE') &&
      data.deviceId
    ) {
      const ip = data.ipAddress || rinfo.address;
      console.log(`[Daemon] Terdeteksi perangkat: ${data.deviceName || data.deviceId} (${ip})`);

      if (dbPool) {
        const capabilitiesStr = JSON.stringify(data.capabilities || ['dht22', 'bh1750', 'led']);
        const query = `
          INSERT INTO devices (device_id, name, device_type, last_ip, firmware_version, capabilities, last_status, last_seen_at)
          VALUES (?, ?, ?, ?, ?, ?, 'ONLINE', NOW())
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            device_type = VALUES(device_type),
            last_ip = VALUES(last_ip),
            firmware_version = VALUES(firmware_version),
            capabilities = VALUES(capabilities),
            last_status = 'ONLINE',
            last_seen_at = NOW(),
            updated_at = NOW()
        `;

        await dbPool.query(query, [
          data.deviceId,
          data.deviceName || `ESP32-${data.deviceId}`,
          data.deviceType || 'ESP32_DEV_KIT_V1',
          ip,
          data.firmwareVersion || '1.0.0',
          capabilitiesStr,
        ]);
      }
    }
  } catch {
    // Bukan packet JSON discovery
  }
});

socket.bind(UDP_PORT, () => {
  socket.setBroadcast(true);
  console.log(`[Daemon] UDP Discovery Daemon mendengarkan pada port ${UDP_PORT}...`);

  // Kirim broadcast perdana
  sendBroadcast();

  // Jadwalkan periodic broadcast
  setInterval(sendBroadcast, BROADCAST_INTERVAL_MS);
});

function sendBroadcast() {
  try {
    const payload = JSON.stringify({
      cmd: 'DISCOVER_SMARTHOME',
      protocol: 'NEXHOME_UDP_V1',
      timestamp: Date.now(),
    });
    const message = Buffer.from(payload);
    socket.send(message, 0, message.length, UDP_PORT, '255.255.255.255', (err) => {
      if (err) console.warn('[Daemon] Broadcast send error:', err.message);
      else console.log('[Daemon] Mengirim UDP broadcast pencarian...');
    });
  } catch (e) {
    console.warn('[Daemon] Send exception:', e.message);
  }
}
