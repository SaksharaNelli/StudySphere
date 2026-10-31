require('./env');
const mysql = require('mysql2/promise');
const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 30; i++) {
    try { return await mysql.createConnection(cfg); }
    catch (e) { console.log(`[db] waiting for MySQL (${e.code || e.message})...`); await sleep(3000); }
  }
  throw new Error('Could not connect to MySQL. Check DB_HOST / DB_USER / DB_PASSWORD in .env');
}

// Creates the service's own database + tables (idempotent) and returns a pool.
async function init(dbName, tables) {
  const boot = await connect();
  await boot.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`);
  await boot.end();
  const pool = mysql.createPool({ ...cfg, database: dbName, waitForConnections: true, connectionLimit: 10, dateStrings: true });
  for (const t of tables) await pool.query(t);
  return pool;
}
module.exports = { init };
