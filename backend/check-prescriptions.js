// Script to check prescriptions table structure
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'medivault',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'medivault',
});

async function checkPrescriptions() {
  try {
    console.log('🔍 Checking prescription_medicines table structure...\n');
    
    // Get column info
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'prescription_medicines'
      ORDER BY ordinal_position;
    `;
    const columns = await pool.query(columnsQuery);
    console.log('📋 Columns in prescription_medicines:');
    console.table(columns.rows);
    
    // Get sample data
    console.log('\n📊 Sample prescription data:');
    const dataQuery = `
      SELECT *
      FROM prescription_medicines
      LIMIT 5;
    `;
    const data = await pool.query(dataQuery);
    console.table(data.rows);
    
    // Check if prescriptions table exists
    console.log('\n🔍 Checking if prescriptions table exists...');
    const prescriptionsTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%prescription%';
    `;
    const tables = await pool.query(prescriptionsTableQuery);
    console.log('📋 Tables with "prescription" in name:');
    console.table(tables.rows);
    
    // Check for related tables
    console.log('\n🔍 Checking for patients and doctors tables...');
    const relatedTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'patients' OR table_name = 'doctors' OR table_name = 'prescriptions');
    `;
    const relatedTables = await pool.query(relatedTablesQuery);
    console.log('📋 Related tables:');
    console.table(relatedTables.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPrescriptions();
