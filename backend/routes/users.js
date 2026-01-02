const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');

async function getAnyAdminRecipientId() {
  const res = await query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  return res.rows?.[0]?.id ?? null;
}

async function emitUserCreatedNotifications({ newUserId, fullName, username, role }) {
  const nowIso = new Date().toISOString();

  const adminRecipientId = await getAnyAdminRecipientId();

  // Admins: emit ONE role-based notification so it shows once for admins
  if (adminRecipientId) {
    await query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, type, title, message, metadata, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [
        crypto.randomUUID(),
        adminRecipientId,
        'admin',
        'user',
        'User Added',
        `${fullName} (@${username}) was added as ${role}.`,
        JSON.stringify({ event: 'user_created', username, role, at: nowIso }),
      ]
    );
  }

  // New user: direct notification
  await query(
    `INSERT INTO notifications (id, recipient_id, type, title, message, metadata, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
    [
      crypto.randomUUID(),
      newUserId,
      'system',
      'Account Created',
      `Your ${role} account has been created. You can now sign in.`,
      JSON.stringify({ event: 'account_created', role, at: nowIso }),
    ]
  );
}

async function emitUserUpdatedNotifications({ updatedUserId, fullName, username, role }) {
  const nowIso = new Date().toISOString();

  const adminRecipientId = await getAnyAdminRecipientId();

  // Admins: emit ONE role-based notification so it shows once for admins
  if (adminRecipientId) {
    await query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, type, title, message, metadata, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [
        crypto.randomUUID(),
        adminRecipientId,
        'admin',
        'user',
        'User Updated',
        `${fullName} (@${username}) was updated. Role: ${role}.`,
        JSON.stringify({ event: 'user_updated', username, role, at: nowIso }),
      ]
    );
  }

  // Updated user: direct notification
  await query(
    `INSERT INTO notifications (id, recipient_id, type, title, message, metadata, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
    [
      crypto.randomUUID(),
      updatedUserId,
      'system',
      'Account Updated',
      'Your account details were updated by an administrator.',
      JSON.stringify({ event: 'account_updated', role, at: nowIso }),
    ]
  );
}

async function emitUserDeletedNotifications({ deletedUserId, fullName, username, role }) {
  const nowIso = new Date().toISOString();

  const adminRecipientId = await getAnyAdminRecipientId();

  // Admins: emit ONE role-based notification so it shows once for admins
  if (adminRecipientId) {
    await query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, type, title, message, metadata, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [
        crypto.randomUUID(),
        adminRecipientId,
        'admin',
        'user',
        'User Deleted',
        `${fullName} (@${username}) was deleted. Role: ${role}.`,
        JSON.stringify({ event: 'user_deleted', username, role, at: nowIso }),
      ]
    );
  }
}

/**
 * @route   POST /api/users/create
 * @desc    Create a new user (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/create',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'doctor', 'patient', 'pharmacist', 'lab_technician']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const client = await getClient();
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        fullName,
        email,
        username,
        password,
        role,
        // Patient fields (optional unless role=patient)
        nic,
        rfid,
        dateOfBirth,
        gender,
        phoneNumber,
        address,
        bloodType,
        allergies,
        // Pharmacist fields (optional unless role=pharmacist)
        pharmacistLicenseNumber,
        // Doctor fields (optional unless role=doctor)
        specialization,
        licenseNumber,
        qualifications,
        yearsOfExperience,

        // Lab technician fields (optional unless role=lab_technician)
        labTechnicianSpecialization,
        labTechnicianLicenseNumber,
      } = req.body;

      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedUsername = String(username).trim().toLowerCase();

      // Split fullName into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [
        normalizedEmail,
        normalizedUsername,
      ]);

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'User with this email or username already exists',
        });
      }

      if (role === 'patient') {
        if (!String(nic || '').trim() || !String(rfid || '').trim()) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Patient role requires NIC and RFID',
            errors: [
              ...(!String(nic || '').trim() ? [{ msg: 'NIC is required', path: 'nic' }] : []),
              ...(!String(rfid || '').trim() ? [{ msg: 'RFID is required', path: 'rfid' }] : []),
            ],
          });
        }
      }

      if (role === 'doctor') {
        if (!String(specialization || '').trim() || !String(licenseNumber || '').trim()) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Doctor role requires specialization and license number',
            errors: [
              ...(!String(specialization || '').trim()
                ? [{ msg: 'Specialization is required', path: 'specialization' }]
                : []),
              ...(!String(licenseNumber || '').trim()
                ? [{ msg: 'License number is required', path: 'licenseNumber' }]
                : []),
            ],
          });
        }
      }

      if (role === 'pharmacist') {
        if (!String(pharmacistLicenseNumber || '').trim()) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Pharmacist role requires license number',
            errors: [{ msg: 'License number is required', path: 'pharmacistLicenseNumber' }],
          });
        }
      }

      if (role === 'lab_technician') {
        if (!String(labTechnicianSpecialization || '').trim() || !String(labTechnicianLicenseNumber || '').trim()) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Lab Technician role requires specialization and license number',
            errors: [
              ...(!String(labTechnicianSpecialization || '').trim()
                ? [{ msg: 'Specialization is required', path: 'labTechnicianSpecialization' }]
                : []),
              ...(!String(labTechnicianLicenseNumber || '').trim()
                ? [{ msg: 'License number is required', path: 'labTechnicianLicenseNumber' }]
                : []),
            ],
          });
        }
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user into database
      const result = await client.query(
        `INSERT INTO users 
        (first_name, last_name, email, username, password, role, is_active, deactivated_at, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING id, first_name, last_name, email, username, role, is_active, deactivated_at, created_at, updated_at`,
        [firstName, lastName, normalizedEmail, normalizedUsername, passwordHash, role]
      );

      const newUser = result.rows[0];

      let roleRecord = null;

      // If role is patient, insert into patients table linked to users.id
      if (role === 'patient') {
        const patientId = crypto.randomUUID();
        const dob = String(dateOfBirth || '').trim() || null;
        const patientGender = String(gender || '').trim() || null;
        const contactInfo = String(phoneNumber || '').trim() || null;
        const patientAddress = String(address || '').trim() || null;
        const patientBloodType = String(bloodType || '').trim() || null;
        const patientAllergies = String(allergies || '').trim() || null;

        await client.query(
          `INSERT INTO patients
            (id, user_id, nic, rfid, date_of_birth, gender, contact_info, address, blood_type, allergies, created_at, updated_at)
           VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            patientId,
            newUser.id,
            String(nic).trim(),
            String(rfid).trim(),
            dob,
            patientGender,
            contactInfo,
            patientAddress,
            patientBloodType,
            patientAllergies,
          ]
        );

        roleRecord = { type: 'patient', id: patientId };
      }

      // If role is doctor, insert into doctors table linked to users.id
      if (role === 'doctor') {
        const doctorId = crypto.randomUUID();
        const doctorSpecialization = String(specialization || '').trim();
        const doctorLicense = String(licenseNumber || '').trim();
        const doctorQualifications = String(qualifications || '').trim() || null;
        const experienceIntRaw = String(yearsOfExperience || '').trim();
        const experienceInt = experienceIntRaw ? Number.parseInt(experienceIntRaw, 10) : null;
        const doctorExperience = Number.isFinite(experienceInt) ? experienceInt : null;

        await client.query(
          `INSERT INTO doctors
            (id, user_id, specialization, license_number, qualifications, experience, created_at, updated_at)
           VALUES
            ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [doctorId, newUser.id, doctorSpecialization, doctorLicense, doctorQualifications, doctorExperience]
        );

        roleRecord = { type: 'doctor', id: doctorId };
      }

      // If role is pharmacist, insert into pharmacists table linked to users.id
      if (role === 'pharmacist') {
        const pharmacistId = crypto.randomUUID();
        const pharmLicense = String(pharmacistLicenseNumber || '').trim();

        await client.query(
          `INSERT INTO pharmacists
            (id, user_id, license_number, created_at, updated_at)
           VALUES
            ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [pharmacistId, newUser.id, pharmLicense]
        );

        roleRecord = { type: 'pharmacist', id: pharmacistId };
      }

      // If role is lab technician, insert into lab_technicians table linked to users.id
      if (role === 'lab_technician') {
        const labId = crypto.randomUUID();
        const labSpec = String(labTechnicianSpecialization || '').trim();
        const labLicense = String(labTechnicianLicenseNumber || '').trim();

        await client.query(
          `INSERT INTO lab_technicians
            (id, user_id, specialization, license_number, created_at, updated_at)
           VALUES
            ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [labId, newUser.id, labSpec, labLicense]
        );

        roleRecord = { type: 'lab_technician', id: labId };
      }

      await client.query('COMMIT');

      // Best-effort: emit notifications (requires notifications table)
      try {
        await emitUserCreatedNotifications({
          newUserId: newUser.id,
          fullName: `${newUser.first_name} ${newUser.last_name}`.trim(),
          username: newUser.username,
          role: newUser.role,
        });
      } catch (e) {
        console.error('Failed to emit user-created notifications:', e);
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser.id,
          fullName: `${newUser.first_name} ${newUser.last_name}`.trim(),
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          roleRecord,
          isActive: newUser.is_active,
          deactivatedAt: newUser.deactivated_at,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at,
        },
      });
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }

      if (error && error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'User with this email or username already exists',
          error: error.detail,
        });
      }

      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/', async (req, res) => {
  try {
    const { role, isActive } = req.query;
    
    let queryText = `
      SELECT id, first_name, last_name, email, username, role, is_active, deactivated_at, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    
    if (role) {
      params.push(role);
      queryText += ` AND role = $${params.length}`;
    }

    if (typeof isActive !== 'undefined') {
      const active = String(isActive).toLowerCase() === 'true';
      params.push(active);
      queryText += ` AND is_active = $${params.length}`;
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.is_active,
        deactivatedAt: user.deactivated_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, first_name, last_name, email, username, role, is_active, deactivated_at, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.is_active,
        deactivatedAt: user.deactivated_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, username, isActive } = req.body;

    // Prevent role updates via this endpoint (role changes require a dedicated flow)
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'role')) {
      return res.status(400).json({
        success: false,
        message: 'Role cannot be updated. You can only update full name, email, and username.',
      });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : undefined;

    let firstName;
    let lastName;
    if (typeof fullName === 'string' && fullName.trim()) {
      const nameParts = fullName.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           username = COALESCE($4, username),
           is_active = COALESCE($5, is_active),
           deactivated_at = CASE
             WHEN $5 IS NULL THEN deactivated_at
             WHEN $5 = true THEN NULL
             ELSE CURRENT_TIMESTAMP
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, first_name, last_name, email, username, role, is_active, deactivated_at, created_at, updated_at`,
      [firstName, lastName, normalizedEmail, normalizedUsername, isActive, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Best-effort: emit notifications
    try {
      const u = result.rows[0];
      await emitUserUpdatedNotifications({
        updatedUserId: u.id,
        fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        username: u.username,
        role: u.role,
      });
    } catch (e) {
      console.error('Failed to emit user-updated notifications:', e);
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: result.rows[0].id,
        fullName: `${result.rows[0].first_name} ${result.rows[0].last_name}`.trim(),
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        email: result.rows[0].email,
        username: result.rows[0].username,
        role: result.rows[0].role,
        isActive: result.rows[0].is_active,
        deactivatedAt: result.rows[0].deactivated_at,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
  const client = await getClient();
  try {
    const { id } = req.params;

    // Load user details first (for messages + 404)
    await client.query('BEGIN');
    const userRes = await client.query('SELECT id, first_name, last_name, username, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userRow = userRes.rows[0];
    const fullName = `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim();
    const username = userRow.username;
    const role = userRow.role;

    // IMPORTANT: delete dependent notifications first to avoid FK constraint errors
    // (Some schemas create a foreign key from notifications.recipient_id -> users.id)
    try {
      await client.query(
        'DELETE FROM notifications WHERE recipient_id::text = $1 OR recipient_user_id::text = $1',
        [String(id)]
      );
    } catch (e) {
      console.error('Failed to delete dependent notifications for user:', e);
      // Continue; the next delete may still fail, but this gives us logs.
    }

    // Role-specific cleanup: patient table
    if (role === 'patient') {
      try {
        await client.query('DELETE FROM patients WHERE user_id::text = $1', [String(id)]);
      } catch (e) {
        console.error('Failed to delete patient row for user:', e);
        throw e;
      }
    }

    // Role-specific cleanup: doctor table
    if (role === 'doctor') {
      try {
        await client.query('DELETE FROM doctors WHERE user_id::text = $1', [String(id)]);
      } catch (e) {
        console.error('Failed to delete doctor row for user:', e);
        throw e;
      }
    }

    // Role-specific cleanup: pharmacists table
    if (role === 'pharmacist') {
      try {
        await client.query('DELETE FROM pharmacists WHERE user_id::text = $1', [String(id)]);
      } catch (e) {
        console.error('Failed to delete pharmacist row for user:', e);
        throw e;
      }
    }

    // Role-specific cleanup: lab_technicians table
    if (role === 'lab_technician') {
      try {
        await client.query('DELETE FROM lab_technicians WHERE user_id::text = $1', [String(id)]);
      } catch (e) {
        console.error('Failed to delete lab technician row for user:', e);
        throw e;
      }
    }

    await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');

    // Best-effort: emit admin notifications about deletion
    try {
      await emitUserDeletedNotifications({ deletedUserId: id, fullName, username, role });
    } catch (e) {
      console.error('Failed to emit user-deleted notifications:', e);
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
