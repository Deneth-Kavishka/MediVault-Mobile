const { query } = require('../config/database');

(async () => {
  const usersCols = await query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users'
    ORDER BY ordinal_position
  `);

  const patientsCols = await query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='patients'
    ORDER BY ordinal_position
  `);

  console.log('users columns:', usersCols.rows.map((r) => r.column_name).join(', '));
  console.log('patients columns:', patientsCols.rows.map((r) => r.column_name).join(', '));
  console.log(
    'patients nullability:',
    patientsCols.rows.map((r) => ({
      column: r.column_name,
      nullable: r.is_nullable,
      default: r.column_default,
    }))
  );

  const counts = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role='patient')::int AS users_patients,
      (SELECT COUNT(*) FROM patients)::int AS patients_rows,
      (SELECT COUNT(*)
         FROM users u
         WHERE u.role='patient'
           AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id::text = u.id::text)
      )::int AS missing_patient_rows
  `);

  console.log('counts:', counts.rows[0]);

  const missingSample = await query(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.is_active, u.created_at
    FROM users u
    WHERE u.role='patient'
      AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id::text = u.id::text)
    ORDER BY u.created_at ASC
    LIMIT 10
  `);

  console.log('missing sample:', missingSample.rows);

  const roleTables = ['doctors', 'pharmacists', 'lab_technicians'];
  for (const tableName of roleTables) {
    const cols = await query(
      `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1
        ORDER BY ordinal_position
      `,
      [tableName]
    );

    console.log(`${tableName} columns:`, cols.rows.map((r) => r.column_name).join(', '));
    console.log(
      `${tableName} nullability:`,
      cols.rows.map((r) => ({
        column: r.column_name,
        nullable: r.is_nullable,
        default: r.column_default,
      }))
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
