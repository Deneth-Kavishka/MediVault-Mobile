// Quick script to check doctors in the database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'medivault',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'medivault',
});

async function checkDoctors() {
  try {
    // First check the table structure
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'doctors'
      ORDER BY ordinal_position
    `);
    console.log('Doctors table structure:');
    console.table(structure.rows);
    
    // Then get the data
    const result = await pool.query('SELECT * FROM doctors LIMIT 10');
    console.log('\nDoctors in database:');
    console.table(result.rows);
    
    if (result.rows.length === 0) {
      console.log('\n⚠️  No doctors found in database!');
      console.log('The appointments table has a foreign key to doctors table.');
      console.log('You need to either:');
      console.log('1. Remove the foreign key constraint, OR');
      console.log('2. Add doctors to the doctors table first');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDoctors();
