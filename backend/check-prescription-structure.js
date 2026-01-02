// Script to check prescriptions and prescription_items structure
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'medivault',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'medivault',
});

async function checkPrescriptionStructure() {
  try {
    console.log('🔍 Checking prescriptions table structure...\n');
    
    const prescriptionsColumns = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      ORDER BY ordinal_position;
    `;
    const prescCols = await pool.query(prescriptionsColumns);
    console.log('📋 Columns in prescriptions:');
    console.table(prescCols.rows);
    
    console.log('\n🔍 Checking prescription_items table structure...\n');
    
    const itemsColumns = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'prescription_items'
      ORDER BY ordinal_position;
    `;
    const itemsCols = await pool.query(itemsColumns);
    console.log('📋 Columns in prescription_items:');
    console.table(itemsCols.rows);
    
    // Get sample data from prescriptions
    console.log('\n📊 Sample prescriptions data:');
    const prescData = await pool.query('SELECT * FROM prescriptions LIMIT 3');
    console.table(prescData.rows);
    
    // Get sample data from prescription_items
    console.log('\n📊 Sample prescription_items data:');
    const itemsData = await pool.query('SELECT * FROM prescription_items LIMIT 5');
    console.table(itemsData.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPrescriptionStructure();
