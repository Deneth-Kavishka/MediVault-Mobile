// Simple Express server with PostgreSQL (pg) connection
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Build connection config
// UPDATED: Checks DB_ variables (from your .env) first, then PG_ variables, then defaults.
const connectionString = process.env.DATABASE_URL || null;

const poolConfig = connectionString
  ? { connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: (process.env.DB_PORT || process.env.PGPORT) ? Number(process.env.DB_PORT || process.env.PGPORT) : 5432,
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '12345',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'medivault',
    };

const pool = new Pool(poolConfig);

// Log connection summary (masked password)
try {
  console.log('Postgres pool config:', {
    host: poolConfig.host,
    port: poolConfig.port,
    user: poolConfig.user,
    database: poolConfig.database
  });
} catch (e) {
  console.warn('Could not print pool config summary:', e);
}

// Helper to test DB
async function testDb() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT NOW() as now");
      return { ok: true, now: res.rows[0].now };
    } finally {
      client.release();
    }
  } catch (err) {
    return { ok: false, error: err.message || String(err), raw: err };
  }
}

// Health route
app.get('/health', async (req, res) => {
  const db = await testDb();
  res.json({ ok: true, db });
});

// Prescriptions endpoint
app.get('/prescriptions', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM prescriptions ORDER BY id DESC LIMIT 100');
    res.json({ ok: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ 
        ok: false, 
        error: err.message, 
        hint: 'Ensure table `prescriptions` exists.' 
    });
  }
});

// Ping DB
app.get('/ping-db', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1');
    res.json({ ok: true, result: r.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'MediVault backend running' });
});

// Start Server
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

(async () => {
  const dbTest = await testDb();
  if (!dbTest.ok) {
    console.warn('Warning: could not connect to PostgreSQL on startup:', dbTest.error);
    console.warn('Check if your DB_USER and DB_PASSWORD in .env are correct.');
  } else {
    console.log('Postgres connected successfully:', dbTest.now);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
})();

module.exports = { app, pool };