const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * @route   GET /api/doctors/registry
 * @desc    List doctors with joined user data (Admin view)
 * @access  Public (no auth middleware in this project yet)
 */
router.get('/registry', async (req, res) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim().toLowerCase(); // active|inactive|''
    const specialization = String(req.query.specialization ?? '').trim();

    const where = ["LOWER(u.role) = 'doctor'"];
    const params = [];

    if (specialization && specialization.toLowerCase() !== 'all') {
      params.push(specialization);
      where.push(`d.specialization = $${params.length}`);
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
          OR COALESCE(d.license_number, '') ILIKE ${p}
          OR COALESCE(d.specialization, '') ILIKE ${p}
          OR COALESCE(d.qualifications, '') ILIKE ${p}
        )`
      );
    }

    const sql = `
      SELECT
        d.id              AS doctor_id,
        d.user_id         AS user_id,
        d.specialization  AS specialization,
        d.license_number  AS license_number,
        d.qualifications  AS qualifications,
        d.experience      AS experience,
        d.created_at      AS doctor_created_at,
        u.first_name      AS first_name,
        u.last_name       AS last_name,
        u.email           AS email,
        u.username        AS username,
        u.is_active       AS is_active,
        u.created_at      AS user_created_at
      FROM doctors d
      JOIN users u ON u.id::text = d.user_id::text
      WHERE ${where.join(' AND ')}
      ORDER BY d.created_at DESC
    `;

    const result = await query(sql, params);

    const data = result.rows.map((row) => {
      const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
      return {
        doctorId: row.doctor_id,
        userId: row.user_id,
        fullName,
        email: row.email,
        username: row.username,
        specialization: row.specialization,
        licenseNumber: row.license_number,
        qualifications: row.qualifications,
        experience: row.experience,
        isActive: Boolean(row.is_active),
        doctorCreatedAt: row.doctor_created_at,
        userCreatedAt: row.user_created_at,
      };
    });

    res.json({
      success: true,
      message: 'Doctors registry loaded',
      data,
    });
  } catch (error) {
    console.error('Error loading doctor registry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load doctor registry',
      error: error.message,
    });
  }
});

module.exports = router;
