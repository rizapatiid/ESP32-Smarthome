const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'srv1412.hstgr.io',
    port: 3306,
    user: 'u500072377_smarthome',
    password: 'Smarthm1234',
    database: 'u500072377_smarthome',
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
