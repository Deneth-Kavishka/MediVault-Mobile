const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '12345',
      database: process.env.PGDATABASE || 'medivault',
    };

const pool = new Pool(poolConfig);

async function run() {
  try {
    console.log('Connecting to DB...');
    const client = await pool.connect();
    try {
      console.log('Creating table `prescriptions` if not exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS prescriptions (
          id SERIAL PRIMARY KEY,
          doctor TEXT,
          doctor_contact TEXT,
          patient_name TEXT,
          issued_date DATE,
          pharmacy TEXT,
          refill_date DATE,
          medicines JSONB,
          notes TEXT,
          status TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      console.log('Inserting sample row...');
      await client.query(
        `INSERT INTO prescriptions (doctor, doctor_contact, patient_name, issued_date, pharmacy, medicines, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING;`,
        [
          'Dr. Rohan Perera',
          'tel:+94123456789',
          'Nethra Sandamini',
          '2025-07-10',
          'City Pharmacy',
          JSON.stringify([
            { name: 'Amoxicillin 500mg', dose: '1 capsule', frequency: '3x/day' },
            { name: 'Vitamin C 500mg', dose: '1 tablet', frequency: '1x/day' },
          ]),
          'Take after food. Finish full course.',
          'Active',
        ]
      );

      console.log('Migration complete.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Migration error:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
