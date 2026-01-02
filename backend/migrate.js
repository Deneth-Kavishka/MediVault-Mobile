
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || null,
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: (process.env.DB_PORT || process.env.PGPORT) ? Number(process.env.DB_PORT || process.env.PGPORT) : 5432,
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '12345',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'medivault',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');

    // Create appointments table (minimal columns used by the app)
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id varchar PRIMARY KEY,
        patient_id varchar NOT NULL,
        doctor_id varchar NOT NULL,
        appointment_date timestamp without time zone NOT NULL,
        appointment_time varchar,
        status varchar DEFAULT 'confirmed',
        reason text,
        notes text,
        availability_id varchar,
        created_at timestamp without time zone DEFAULT now(),
        updated_at timestamp without time zone DEFAULT now()
      );
    `);

    // Seed a sample row if table is empty
    const { rows } = await client.query('SELECT count(*)::int as c FROM appointments');
    if (rows[0].c === 0) {
      await client.query(
        `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          'appt-sample-1',
          'f0bb7913-6e31-4187-97db-5edede61b1c9',
          'ce138882-45ee-40f4-bfc8-9794ed4ea00d',
          new Date('2025-12-16T12:30:00').toISOString(),
          '12:30 PM',
          'confirmed',
          'Regular Checkup',
        ]
      );
      console.log('Seeded sample appointment.');
    }

    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    client.release();

    await pool.end();
  }
}


migrate();

