// Simple Express server with PostgreSQL (pg) connection
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- DB CONFIG ----------------
// ---------------- DB CONFIG ----------------
// server.js
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'medivault', // Update this to medivault
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'medivault',
});

// ---------------- TEST DB ----------------
async function testDb() {
  try {
    const res = await pool.query('SELECT NOW()');
    return { ok: true, time: res.rows[0].now };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ---------------- HEALTH ----------------
app.get('/health', async (req, res) => {
  const db = await testDb();
  res.json({ ok: true, db });
});

// ---------------- GET APPOINTMENTS ----------------
app.get('/appointments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM appointments ORDER BY appointment_date DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------- CREATE APPOINTMENT (FIXED) ----------------
app.post('/appointments', async (req, res) => {
  try {
    console.log('📥 POST /appointments - Received body:', JSON.stringify(req.body, null, 2));
    
    const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!patient_id || !doctor_id || !appointment_date) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        ok: false,
        error: 'patient_id, doctor_id and appointment_date are required',
      });
    }

    // Generate a unique ID for the appointment
    const crypto = require('crypto');
    const id = crypto.randomUUID ? crypto.randomUUID() : `appt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const query = `
      INSERT INTO appointments
      (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time || null,
      'confirmed',
      reason || null,
    ];

    console.log('📝 Executing INSERT with values:', values);
    const { rows } = await pool.query(query, values);
    console.log('✅ Appointment created successfully:', rows[0].id);

    res.status(201).json({
      ok: true,
      data: rows[0],
    });
  } catch (err) {
    console.error('❌ POST /appointments ERROR:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------- GET PRESCRIPTIONS ----------------
app.get('/prescriptions', async (req, res) => {
  try {
    console.log('📥 GET /prescriptions');
    
    // Query to get all prescriptions with their medicines, doctor and patient info
    const query = `
      SELECT 
        p.id as prescription_id,
        p.date_issued,
        p.expiry_date,
        p.status,
        p.notes as prescription_notes,
        p.qr_code,
        p.validity_days,
        pi.medicine_name,
        pi.dosage,
        pi.frequency,
        pi.duration,
        pi.quantity,
        pi.instructions,
        d.specialization,
        du.first_name as doctor_first_name,
        du.last_name as doctor_last_name,
        pu.first_name as patient_first_name,
        pu.last_name as patient_last_name
      FROM prescriptions p
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN users pu ON pat.user_id = pu.id
      ORDER BY p.created_at DESC
    `;
    
    const { rows } = await pool.query(query);
    
    // Group medicines by prescription_id
    const prescriptionsMap = new Map();
    
    rows.forEach(row => {
      const prescriptionId = row.prescription_id;
      
      if (!prescriptionsMap.has(prescriptionId)) {
        // Determine status based on expiry date if not set
        let status = row.status || 'active';
        if (row.expiry_date && new Date(row.expiry_date) < new Date()) {
          status = 'Expired';
        } else if (status === 'active') {
          status = 'Active';
        } else if (status === 'pending') {
          status = 'Pending';
        } else if (status === 'completed') {
          status = 'Completed';
        }
        
        prescriptionsMap.set(prescriptionId, {
          id: prescriptionId,
          doctor: row.doctor_first_name && row.doctor_last_name 
            ? `Dr. ${row.doctor_first_name} ${row.doctor_last_name}` 
            : 'Dr. Unknown',
          doctorContact: undefined,
          patientName: row.patient_first_name && row.patient_last_name
            ? `${row.patient_first_name} ${row.patient_last_name}`
            : 'Patient',
          issuedDate: row.date_issued ? new Date(row.date_issued).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          pharmacy: 'Main Pharmacy',
          refillDate: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : null,
          medicines: [],
          notes: row.prescription_notes || row.instructions || '',
          status: status,
        });
      }
      
      // Add medicine to prescription if medicine_name exists
      if (row.medicine_name) {
        const prescription = prescriptionsMap.get(prescriptionId);
        prescription.medicines.push({
          name: row.medicine_name,
          dose: row.dosage,
          frequency: row.frequency,
        });
      }
    });
    
    const prescriptions = Array.from(prescriptionsMap.values());
    console.log(`✅ Found ${prescriptions.length} prescriptions`);
    
    res.json({ ok: true, data: prescriptions });
  } catch (err) {
    console.error('❌ GET /prescriptions ERROR:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------- GET LAB REPORTS ----------------
app.get('/lab-reports', async (req, res) => {
  try {
    console.log('📥 GET /lab-reports - Fetching lab reports...');
    
    const query = `
      SELECT 
        lr.id,
        lr.patient_id,
        lr.doctor_id,
        lr.lab_technician_id,
        lr.test_type,
        lr.test_name,
        lr.status,
        lr.request_date,
        lr.completion_date,
        lr.results,
        lr.result_file_url,
        lr.is_abnormal,
        lr.notes,
        lr.created_at,
        lr.updated_at,
        d.specialization as doctor_specialization,
        du.first_name as doctor_first_name,
        du.last_name as doctor_last_name,
        pu.first_name as patient_first_name,
        pu.last_name as patient_last_name
      FROM lab_tests lr
      LEFT JOIN doctors d ON lr.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN patients pat ON lr.patient_id = pat.id
      LEFT JOIN users pu ON pat.user_id = pu.id
      ORDER BY lr.request_date DESC
    `;
    
    const { rows } = await pool.query(query);
    
    const labReports = rows.map(row => ({
      id: row.id,
      title: row.test_name,
      testType: row.test_type,
      date: row.request_date,
      completionDate: row.completion_date,
      doctor: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}`
        : 'Unknown Doctor',
      labFacility: row.lab_technician_id || 'Not assigned',
      status: row.status,
      urgency: row.is_abnormal ? 'abnormal' : 'normal',
      summary: row.notes || 'No notes available',
      details: row.results || 'No results available',
      resultFileUrl: row.result_file_url,
    }));
    
    console.log(`✅ Found ${labReports.length} lab reports`);
    
    res.json({ ok: true, data: labReports });
  } catch (err) {
    console.error('❌ GET /lab-reports ERROR:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------- DELETE APPOINTMENT ----------------
app.delete('/appointments/:patient_id/:appointment_date', async (req, res) => {
  try {
    const { patient_id, appointment_date } = req.params;

    const result = await pool.query(
      'DELETE FROM appointments WHERE patient_id = $1 AND appointment_date = $2',
      [patient_id, appointment_date]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'Not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------- ROOT ----------------
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'MediVault backend running' });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 4000;

(async () => {
  const db = await testDb();
  if (!db.ok) {
    console.warn('⚠️ DB connection failed:', db.error);
  } else {
    console.log('✅ DB connected:', db.time);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
