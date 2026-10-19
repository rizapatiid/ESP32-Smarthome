// ==============================================================================
// SMART HOME IoT — STANDALONE ESP32 HARDWARE SIMULATOR (MOCK) DENGAN KONTROL SLIDER
// ==============================================================================
// Script ini mensimulasikan protokol UDP Discovery (port 8266) dan REST API HTTP (port 80)
// persis seperti ESP32 fisik.
// Dilengkapi Panel Slider Interaktif di browser: http://localhost:80/ atau http://127.0.0.1/
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
let autoDrift = false; // default false agar nilai slider user tidak ter-overwrite

// Device Metadata
const DEVICE_INFO = {
  deviceId: 'esp32-mock-dev-01',
  deviceName: 'ESP32 Hardware Mock (Laptop)',
  deviceType: 'ESP32_DEV_KIT_V1',
  firmwareVersion: 'v1.0.0-mock',
  capabilities: ['dht22', 'bh1750', 'led', 'relay'],
};

// ==============================================================================
// HTML UI UNTUK PANEL KONTROL SLIDER MOCK
// ==============================================================================
function getControlHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ESP32 Mock Hardware Controller</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; max-width: 480px; width: 100%; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 16px; }
    .badge { background: #059669; color: #ecfdf5; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; }
    h1 { font-size: 20px; font-weight: 800; color: #38bdf8; }
    p.sub { font-size: 13px; color: #94a3b8; margin-top: 2px; }
    .group { margin-bottom: 22px; }
    .label-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .val { color: #38bdf8; font-weight: 800; font-size: 16px; }
    input[type=range] { width: 100%; height: 8px; border-radius: 5px; background: #334155; outline: none; cursor: pointer; accent-color: #38bdf8; }
    .presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px; }
    .preset-btn { background: #334155; border: 1px solid #475569; color: #cbd5e1; border-radius: 8px; padding: 6px 4px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .preset-btn:hover { background: #475569; color: #fff; }
    .relay-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .relay-info { font-size: 13px; font-weight: 600; }
    .toggle-btn { background: #ef4444; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; }
    .toggle-btn.active { background: #10b981; }
    .tip { margin-top: 20px; background: #0f172a; border-left: 4px solid #38bdf8; padding: 12px 14px; font-size: 12px; color: #94a3b8; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>🎛️ ESP32 Mock Controller</h1>
        <p class="sub">Simulator Hardware ESP32 di Laptop</p>
      </div>
      <span class="badge" id="connBadge">ONLINE (PORT 80)</span>
    </div>

    <!-- Slider Suhu -->
    <div class="group">
      <div class="label-row">
        <span>🌡️ Suhu Ruangan (DHT22)</span>
        <span class="val" id="tempText">${currentTemp.toFixed(1)} °C</span>
      </div>
      <input type="range" id="tempSlider" min="-40" max="60" step="0.5" value="${currentTemp}">
      <div class="presets">
        <button class="preset-btn" onclick="setTemp(-40)">❄️ -40°C</button>
        <button class="preset-btn" onclick="setTemp(18)">🌿 18°C</button>
        <button class="preset-btn" onclick="setTemp(28)">🌤️ 28°C</button>
        <button class="preset-btn" onclick="setTemp(42)">🔥 42°C</button>
      </div>
    </div>

    <!-- Slider Kelembapan -->
    <div class="group">
      <div class="label-row">
        <span>💧 Kelembapan Udara (DHT22)</span>
        <span class="val" id="humText">${currentHumidity.toFixed(1)} %</span>
      </div>
      <input type="range" id="humSlider" min="0" max="100" step="1" value="${currentHumidity}">
      <div class="presets">
        <button class="preset-btn" onclick="setHum(20)">🌵 Kering 20%</button>
        <button class="preset-btn" onclick="setHum(55)">🍃 Normal 55%</button>
        <button class="preset-btn" onclick="setHum(75)">🌧️ Lembap 75%</button>
        <button class="preset-btn" onclick="setHum(100)">💦 Hujan 100%</button>
      </div>
    </div>

    <!-- Slider Cahaya -->
    <div class="group">
      <div class="label-row">
        <span>💡 Intensitas Cahaya (BH1750)</span>
        <span class="val" id="luxText">${currentLux} Lux</span>
      </div>
      <input type="range" id="luxSlider" min="0" max="2000" step="10" value="${currentLux}">
    </div>

    <!-- Relay Switch -->
    <div class="relay-box">
      <div class="relay-info">
        <div>Relay Lampu (GPIO 2)</div>
        <div style="font-size: 11px; color: #64748b; font-weight: normal;" id="lampStatusText">Status: OFF</div>
      </div>
      <button class="toggle-btn" id="relayBtn" onclick="toggleRelay()">MATI (OFF)</button>
    </div>

    <div class="tip">
      💡 <strong>Langsung Terhubung:</strong> Setiap kali Anda menggeser slider di atas, data di dashboard <strong>http://localhost:3000</strong> akan otomatis berubah dalam hitungan detik!
    </div>
  </div>

  <script>
    const tempSlider = document.getElementById('tempSlider');
    const humSlider = document.getElementById('humSlider');
    const luxSlider = document.getElementById('luxSlider');
    const tempText = document.getElementById('tempText');
    const humText = document.getElementById('humText');
    const luxText = document.getElementById('luxText');
    const relayBtn = document.getElementById('relayBtn');
    const lampStatusText = document.getElementById('lampStatusText');

    let currentLampState = ${Boolean(lampStates[2])};
    updateRelayUI(currentLampState);

    function updateRelayUI(state) {
      currentLampState = state;
      if (state) {
        relayBtn.textContent = 'NYALA (ON)';
        relayBtn.className = 'toggle-btn active';
        lampStatusText.textContent = 'Status: AKTIF (ON)';
      } else {
        relayBtn.textContent = 'MATI (OFF)';
        relayBtn.className = 'toggle-btn';
        lampStatusText.textContent = 'Status: MATI (OFF)';
      }
    }

    async function sendUpdate() {
      const temp = parseFloat(tempSlider.value);
      const hum = parseFloat(humSlider.value);
      const lux = parseFloat(luxSlider.value);
      tempText.textContent = temp.toFixed(1) + ' °C';
      humText.textContent = hum.toFixed(1) + ' %';
      luxText.textContent = Math.round(lux) + ' Lux';

      await fetch('/api/mock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature: temp, humidity: hum, lightLux: lux })
      });
    }

    tempSlider.oninput = sendUpdate;
    humSlider.oninput = sendUpdate;
    luxSlider.oninput = sendUpdate;

    function setTemp(v) { tempSlider.value = v; sendUpdate(); }
    function setHum(v) { humSlider.value = v; sendUpdate(); }

    async function toggleRelay() {
      const nextState = !currentLampState;
      updateRelayUI(nextState);
      await fetch('/api/light', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 2, state: nextState })
      });
    }

    // Polling berkala jika ada perubahan dari dashboard
    setInterval(async () => {
      try {
        const res = await fetch('/api/light?pin=2');
        if (res.ok) {
          const data = await res.json();
          if (data.state !== currentLampState) {
            updateRelayUI(data.state);
          }
        }
      } catch (e) {}
    }, 2000);
  </script>
</body>
</html>`;
}

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

  // GET / atau /control -> Sajikan Halaman Kontrol Slider Interaktif
  if ((url.pathname === '/' || url.pathname === '/control') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getControlHtml());
    return;
  }

  // POST /api/mock/adjust -> Update nilai suhu/kelembapan/cahaya dari slider
  if (url.pathname === '/api/mock/adjust' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        if (typeof body.temperature === 'number') currentTemp = body.temperature;
        if (typeof body.humidity === 'number') currentHumidity = body.humidity;
        if (typeof body.lightLux === 'number') currentLux = body.lightLux;

        console.log(
          `[MOCK] 🎛️ Nilai Sensor Diatur Manual -> Suhu: ${currentTemp}°C, Lembap: ${currentHumidity}%, Cahaya: ${currentLux} Lux`
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, currentTemp, currentHumidity, currentLux }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /api/status - Health Check
  if (url.pathname === '/api/status' && req.method === 'GET') {
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
    if (autoDrift) {
      currentTemp += (Math.random() - 0.5) * 0.1;
      currentHumidity += (Math.random() - 0.5) * 0.2;
    }
    const baseLux = lampStates[2] ? (currentLux > 500 ? currentLux : currentLux + 200) : currentLux;

    const sensorPayload = {
      temperature: parseFloat(currentTemp.toFixed(1)),
      humidity: parseFloat(currentHumidity.toFixed(1)),
      lightLux: parseFloat(baseLux.toFixed(0)),
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
  console.log(`[HTTP] Panel Kontrol Slider: http://127.0.0.1:${HTTP_PORT}/control`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.warn(`[HTTP] Port 80 butuh hak Administrator. Beralih ke port 8080...`);
    server.listen(8080, '0.0.0.0', () => {
      console.log(`[HTTP] ESP32 Mock Server siap di http://127.0.0.1:8080`);
      console.log(`[HTTP] Panel Kontrol Slider: http://127.0.0.1:8080/control`);
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
          console.log(`[UDP] 📤 Mengirim respons DISCOVER_RESP ke ${rinfo.address}:${rinfo.port}`);
        }
      });
    }
  } catch (e) {
    // Abaikan jika bukan format yang cocok
  }
});

udpSocket.bind(UDP_PORT, '0.0.0.0', () => {
  console.log(`[UDP] 📡 ESP32 UDP Discovery Listener aktif di port ${UDP_PORT}`);
  console.log('------------------------------------------------------------------');
  console.log(' Buka Panel Slider di browser: http://127.0.0.1/control');
  console.log(' Setiap slider digeser, data di localhost:3000 langsung berubah!');
  console.log('------------------------------------------------------------------');
});
