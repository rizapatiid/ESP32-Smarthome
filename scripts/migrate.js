// ==============================================================================
// SMART HOME IoT — DATABASE MIGRATION SCRIPT (HOSTINGER MYSQL)
// ==============================================================================

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca .env jika ada
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

const dbConfig = {
  host: process.env.DB_HOST || 'srv1412.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'u500072377_smarthome',
  password: process.env.DB_PASSWORD || 'Smarthm1234',
  database: process.env.DB_NAME || 'u500072377_smarthome',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 10000
};

async function migrate() {
  console.log(`Menghubungkan ke MySQL Hostinger di ${dbConfig.host}:${dbConfig.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Berhasil terhubung ke database Hostinger MySQL!');

    const tableQueries = [
      {
        name: 'devices',
        sql: `
          CREATE TABLE IF NOT EXISTS devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(64) NOT NULL UNIQUE,
            name VARCHAR(128) NOT NULL,
            device_type VARCHAR(64) DEFAULT 'ESP32_DEV_KIT_V1',
            last_ip VARCHAR(64) NULL,
            firmware_version VARCHAR(32) NULL,
            last_status VARCHAR(32) DEFAULT 'OFFLINE',
            capabilities VARCHAR(255) NULL,
            last_seen_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'sensor_readings',
        sql: `
          CREATE TABLE IF NOT EXISTS sensor_readings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(64) NOT NULL,
            temperature FLOAT NULL,
            humidity FLOAT NULL,
            light_lux FLOAT NULL,
            is_simulated BOOLEAN DEFAULT FALSE,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_device_recorded (device_id, recorded_at),
            CONSTRAINT fk_sensor_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'device_states',
        sql: `
          CREATE TABLE IF NOT EXISTS device_states (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(64) NOT NULL UNIQUE,
            is_online BOOLEAN DEFAULT FALSE,
            lamp_state BOOLEAN DEFAULT FALSE,
            last_ping_at DATETIME NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_state_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'control_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS control_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(64) NOT NULL,
            command VARCHAR(64) NOT NULL,
            requested_state BOOLEAN NOT NULL,
            confirmed_state BOOLEAN NULL,
            status VARCHAR(32) DEFAULT 'PENDING',
            error_message TEXT NULL,
            is_simulated BOOLEAN DEFAULT FALSE,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            confirmed_at DATETIME NULL,
            INDEX idx_control_executed (device_id, executed_at),
            CONSTRAINT fk_control_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'system_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS system_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(64) NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      }
    ];

    for (const t of tableQueries) {
      console.log(`Membuat tabel '${t.name}' jika belum ada...`);
      await connection.query(t.sql);
      console.log(`Tabel '${t.name}' OK.`);
    }

    // Masukkan data default simulator device agar mode simulasi langsung terdaftar
    const defaultDeviceId = 'sim-esp32-01';
    const [existing] = await connection.query('SELECT id FROM devices WHERE device_id = ?', [defaultDeviceId]);
    if (existing.length === 0) {
      console.log('Menambahkan perangkat default simulasi ke database...');
      await connection.query(`
        INSERT INTO devices (device_id, name, device_type, last_ip, firmware_version, last_status, capabilities, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        defaultDeviceId,
        'ESP32 Virtual Simulator',
        'ESP32_SIMULATOR',
        '127.0.0.1',
        'v1.0.0-sim',
        'ONLINE',
        JSON.stringify(['dht22', 'bh1750', 'led'])
      ]);

      await connection.query(`
        INSERT INTO device_states (device_id, is_online, lamp_state, last_ping_at)
        VALUES (?, true, false, NOW())
      `, [defaultDeviceId]);
    }

    // Verifikasi tabel
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nMigrasi berhasil! Tabel yang ada sekarang:');
    console.log(tables.map(r => Object.values(r)[0]));

  } catch (err) {
    console.error('Error saat migrasi database:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
