import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Skrip Diagnostik untuk mencetak nama DB aktif di terminal VS Code
console.log(`[Database Connection] Berhasil terhubung ke database: "${pool.options.database}"`);

export default pool;