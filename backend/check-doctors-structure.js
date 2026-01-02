// Script to check doctors table structure
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
    console.log('🔍 Checking doctors table structure...\n');
    
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'doctors'
      ORDER BY ordinal_position;
    `;
    const columns = await pool.query(columnsQuery);
    console.log('📋 Columns in doctors table:');
    console.table(columns.rows);
    
    console.log('\n📊 Sample doctors data:');
    const dataQuery = `SELECT * FROM doctors LIMIT 3`;
    const data = await pool.query(dataQuery);
    console.table(data.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDoctors();
