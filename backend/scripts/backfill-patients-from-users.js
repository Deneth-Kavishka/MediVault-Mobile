const { query } = require('../config/database');

async function main() {
  const before = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE LOWER(role)='patient')::int AS users_patients,
      (SELECT COUNT(*) FROM patients)::int AS patients_rows,
      (SELECT COUNT(*)
         FROM users u
         WHERE LOWER(u.role)='patient'
           AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id::text = u.id::text)
      )::int AS missing_patient_rows
  `);

  console.log('Before:', before.rows[0]);

  const insert = await query(`
    INSERT INTO patients (user_id, nic, created_at, updated_at)
    SELECT
      u.id,
      CONCAT('LEGACY-', u.id::text) AS nic,
      COALESCE(u.created_at, now()) AS created_at,
      COALESCE(u.updated_at, now()) AS updated_at
    FROM users u
    WHERE LOWER(u.role)='patient'
      AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id::text = u.id::text)
  `);

  console.log(`Inserted patients rows: ${insert.rowCount}`);

  const after = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE LOWER(role)='patient')::int AS users_patients,
      (SELECT COUNT(*) FROM patients)::int AS patients_rows,
      (SELECT COUNT(*)
         FROM users u
         WHERE LOWER(u.role)='patient'
           AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id::text = u.id::text)
      )::int AS missing_patient_rows
  `);

  console.log('After:', after.rows[0]);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
