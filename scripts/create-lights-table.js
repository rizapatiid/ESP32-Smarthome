const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env.local atau .env
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');
const targetEnv = fs.existsSync(envLocalPath) ? envLocalPath : (fs.existsSync(envPath) ? envPath : null);

if (targetEnv) {
  const envContent = fs.readFileSync(targetEnv, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smarthome',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to database...');

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS configured_lights (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      pin INT NOT NULL,
      state BOOLEAN DEFAULT FALSE,
      is_default BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(createTableSql);
  console.log('Tabel configured_lights berhasil dibuat!');

  // Masukkan data lampu default: Lampu Utama (GPIO 2), Lampu Teras (GPIO 4), Lampu 1 (GPIO 16)
  await pool.query(`
    INSERT INTO configured_lights (id, name, pin, state, is_default)
    VALUES 
      ('lamp-main', 'Lampu Utama', 2, 0, 1),
      ('lamp-teras', 'Lampu Teras', 4, 0, 0),
      ('lamp-1', 'Lampu 1', 16, 0, 0)
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name),
      pin = VALUES(pin)
  `);

  const [rows] = await pool.query('SELECT id, name, pin, state, is_default, updated_at FROM configured_lights');
  console.log('DATA DALAM TABEL configured_lights:');
  console.table(rows);

  await pool.end();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
