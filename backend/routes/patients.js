const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

function normalizeGender(value) {
  const g = String(value ?? '').trim().toLowerCase();
  if (g === 'male' || g === 'female' || g === 'other') return g;
  return null;
}

/**
 * @route   GET /api/patients/registry
 * @desc    List patients with joined user data (Admin view)
 * @access  Public (no auth middleware in this project yet)
 */
router.get('/registry', async (req, res) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim().toLowerCase(); // active|inactive|''
    const gender = normalizeGender(req.query.gender);

    const where = ["LOWER(u.role) = 'patient'"];
    const params = [];

    if (gender) {
      params.push(gender);
      where.push(`p.gender = $${params.length}`);
    }

    if (status === 'active' || status === 'inactive') {
      params.push(status === 'active');
      where.push(`u.is_active = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      where.push(
        `(
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) ILIKE ${p}
          OR COALESCE(u.email, '') ILIKE ${p}
          OR COALESCE(u.username, '') ILIKE ${p}
          OR COALESCE(p.nic, '') ILIKE ${p}
          OR COALESCE(p.contact_info, '') ILIKE ${p}
        )`
      );
    }

    const sql = `
      SELECT
        p.id              AS patient_id,
        p.user_id         AS user_id,
        p.nic             AS nic,
        p.rfid            AS rfid,
        p.date_of_birth   AS date_of_birth,
        p.gender          AS gender,
        p.contact_info    AS contact_info,
        p.address         AS address,
        p.blood_type      AS blood_type,
        p.allergies       AS allergies,
        p.created_at      AS patient_created_at,
        u.first_name      AS first_name,
        u.last_name       AS last_name,
        u.email           AS email,
        u.username        AS username,
        u.is_active       AS is_active,
        u.created_at      AS user_created_at
      FROM patients p
      JOIN users u ON u.id::text = p.user_id::text
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
    `;

    const result = await query(sql, params);

    const data = result.rows.map((row) => {
      const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
      return {
        patientId: row.patient_id,
        userId: row.user_id,
        fullName,
        email: row.email,
        username: row.username,
        nic: row.nic,
        rfid: row.rfid,
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        contactInfo: row.contact_info,
        address: row.address,
        bloodType: row.blood_type,
        allergies: row.allergies,
        isActive: Boolean(row.is_active),
        patientCreatedAt: row.patient_created_at,
        userCreatedAt: row.user_created_at,
      };
    });

    res.json({
      success: true,
      message: 'Patients registry loaded',
      data,
    });
  } catch (error) {
    console.error('Error loading patient registry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load patient registry',
      error: error.message,
    });
  }
});

module.exports = router;
