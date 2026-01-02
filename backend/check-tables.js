// Script to find all tables in the database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'medivault',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'medivault',
});

async function checkAllTables() {
  try {
    console.log('🔍 Checking all tables in database...\n');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    const tables = await pool.query(tablesQuery);
    console.log('📋 All tables in database:');
    console.table(tables.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllTables();
