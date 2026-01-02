const { query } = require('../config/database');

async function main() {
  const before = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE LOWER(role)='doctor')::int AS users_doctors,
      (SELECT COUNT(*) FROM doctors)::int AS doctors_rows,
      (SELECT COUNT(*)
         FROM users u
         WHERE LOWER(u.role)='doctor'
           AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id::text = u.id::text)
      )::int AS missing_doctor_rows
  `);

  console.log('Before:', before.rows[0]);

  // doctors.specialization and doctors.license_number are NOT NULL in this DB.
  // Legacy users may not have these details, so we insert safe placeholders.
  const insert = await query(`
    INSERT INTO doctors (user_id, specialization, license_number, created_at, updated_at)
    SELECT
      u.id,
      'General Medicine' AS specialization,
      CONCAT('LEGACY-DOC-', u.id::text) AS license_number,
      COALESCE(u.created_at, now()) AS created_at,
      COALESCE(u.updated_at, now()) AS updated_at
    FROM users u
    WHERE LOWER(u.role)='doctor'
      AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id::text = u.id::text)
  `);

  console.log(`Inserted doctors rows: ${insert.rowCount}`);

  const after = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE LOWER(role)='doctor')::int AS users_doctors,
      (SELECT COUNT(*) FROM doctors)::int AS doctors_rows,
      (SELECT COUNT(*)
         FROM users u
         WHERE LOWER(u.role)='doctor'
           AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id::text = u.id::text)
      )::int AS missing_doctor_rows
  `);

  console.log('After:', after.rows[0]);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
