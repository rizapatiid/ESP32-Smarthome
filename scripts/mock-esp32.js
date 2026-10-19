// ==============================================================================
// SMART HOME IoT — STANDALONE ESP32 HARDWARE SIMULATOR (MOCK)
// ==============================================================================
// Jalankan script ini jika Anda belum memiliki hardware ESP32 fisik.
// Script ini mensimulasikan protokol UDP Discovery (port 8266) dan REST API HTTP (port 80)
// persis seperti firmware esp32-smarthome.ino yang berjalan di board fisik.
//
// Cara menjalankan:
//   node scripts/mock-esp32.js
// ==============================================================================

const dgram = require('dgram');
const http = require('http');

const UDP_PORT = 8266;
const HTTP_PORT = 80;

// State simulasi hardware
let lampStates = {
  2: false, // Default Lampu Utama (GPIO 2)
  4: false,
  16: false,
  17: false,
};

let currentTemp = 28.2;
let currentHumidity = 64.5;
let currentLux = 380;

// Device Metadata
const DEVICE_INFO = {
  deviceId: 'esp32-mock-dev-01',
  deviceName: 'ESP32 Hardware Mock (Laptop)',
  deviceType: 'ESP32_DEV_KIT_V1',
  firmwareVersion: 'v1.0.0-mock',
  capabilities: ['dht22', 'bh1750', 'led', 'relay'],
};

// ==============================================================================
// 1. HTTP REST API SERVER (Port 80)
// ==============================================================================
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/status - Health Check
  if (url.pathname === '/api/status' && req.method === 'GET') {
    console.log('[HTTP] GET /api/status -> Status OK');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ...DEVICE_INFO,
        uptime: Math.floor(process.uptime()),
        freeHeap: 245120,
        wifiRssi: -55,
      })
    );
    return;
  }

  // GET /api/sensors - Baca Sensor DHT22 & BH1750
  if (url.pathname === '/api/sensors' && req.method === 'GET') {
    // Fluktuasi sensor halus
    currentTemp += (Math.random() - 0.5) * 0.2;
    currentHumidity += (Math.random() - 0.5) * 0.4;
    const baseLux = lampStates[2] ? 580 : 320;
    currentLux = baseLux + (Math.random() - 0.5) * 30;

    const sensorPayload = {
      temperature: parseFloat(currentTemp.toFixed(1)),
      humidity: parseFloat(currentHumidity.toFixed(1)),
      lightLux: parseFloat(currentLux.toFixed(0)),
      timestamp: new Date().toISOString(),
      sensorStatus: { dht22: true, bh1750: true },
    };

    console.log(
      `[HTTP] GET /api/sensors -> Suhu: ${sensorPayload.temperature}°C, Lembap: ${sensorPayload.humidity}%, Cahaya: ${sensorPayload.lightLux} Lux`
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sensorPayload));
    return;
  }

  // GET /api/light - Status Lampu
  if (url.pathname === '/api/light' && req.method === 'GET') {
    const pin = parseInt(url.searchParams.get('pin') || '2', 10);
    const state = Boolean(lampStates[pin]);
    console.log(`[HTTP] GET /api/light (PIN ${pin}) -> ${state ? 'ON' : 'OFF'}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ state, pin }));
    return;
  }

  // POST /api/light - Kontrol Saklar Relay
  if (url.pathname === '/api/light' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => {
      bodyStr += chunk;
    });

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetState = Boolean(body.state);
        const pin = parseInt(body.pin || '2', 10);

        lampStates[pin] = targetState;

        console.log(
          `[HTTP] ⚡ RELAY GPIO ${pin} DIUBAH MENJADI: [ ${targetState ? 'NYALA (ON)' : 'MATI (OFF)'} ]`
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            confirmedState: targetState,
            pin,
            message: `Relay GPIO ${pin} berhasil ${targetState ? 'dinyalakan' : 'dimatikan'}`,
          })
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`[HTTP] ESP32 Mock Server siap di http://127.0.0.1:${HTTP_PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.warn(`[HTTP] Port 80 butuh hak Administrator. Beralih ke port 8080...`);
    server.listen(8080, '0.0.0.0', () => {
      console.log(`[HTTP] ESP32 Mock Server siap di http://127.0.0.1:8080`);
    });
  } else {
    console.error('[HTTP] Server error:', err.message);
  }
});

// ==============================================================================
// 2. UDP BROADCAST DISCOVERY LISTENER (Port 8266)
// ==============================================================================
const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

udpSocket.on('error', (err) => {
  console.error('[UDP] Socket error:', err.message);
});

udpSocket.on('message', (msg, rinfo) => {
  try {
    const raw = JSON.parse(msg.toString('utf-8'));
    if (raw.cmd === 'DISCOVER_SMARTHOME') {
      console.log(`[UDP] 📡 Menerima Broadcast Scan dari Dashboard (${rinfo.address}:${rinfo.port})`);

      const port = server.address()?.port || 80;
      const response = {
        cmd: 'DISCOVER_RESP',
        protocol: 'NEXHOME_UDP_V1',
        deviceId: DEVICE_INFO.deviceId,
        deviceName: DEVICE_INFO.deviceName,
        deviceType: DEVICE_INFO.deviceType,
        ipAddress: '127.0.0.1',
        port: port,
        firmwareVersion: DEVICE_INFO.firmwareVersion,
        capabilities: DEVICE_INFO.capabilities,
        uptime: Math.floor(process.uptime()),
        discoveredAt: new Date().toISOString(),
      };

      const buf = Buffer.from(JSON.stringify(response));
      udpSocket.send(buf, 0, buf.length, rinfo.port, rinfo.address, (err) => {
        if (!err) {
          console.log(`[UDP]  Mengirim respons DISCOVER_RESP ke ${rinfo.address}:${rinfo.port}`);
        }
      });
    }
  } catch (e) {
    // Abaikan jika bukan format yang cocok
  }
});

udpSocket.bind(UDP_PORT, '0.0.0.0', () => {
  console.log(`[UDP]  ESP32 UDP Discovery Listener aktif di port ${UDP_PORT}`);
  console.log('------------------------------------------------------------------');
  console.log(' Siap menerima pemindaian "Scan ESP32" dari Web Dashboard!');
  console.log(' Tekan Ctrl+C di terminal ini untuk berhenti.');
  console.log('------------------------------------------------------------------');
});
