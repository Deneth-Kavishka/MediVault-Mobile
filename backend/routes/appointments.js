const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

async function getColumns(tableName) {
  const res = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
    `,
    [tableName]
  );
  return new Set(res.rows.map((r) => r.column_name));
}

async function tableExists(tableName) {
  const res = await query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema='public' AND table_name=$1
      LIMIT 1
    `,
    [tableName]
  );
  return res.rowCount > 0;
}

function normalizeStatus(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return 'pending';
  if (['pending', 'confirmed', 'completed', 'cancelled', 'cancel_requested'].includes(s)) return s;
  if (['canceled', 'canceled_by_admin'].includes(s)) return 'cancelled';
  if (['cancel-requested', 'cancelrequested', 'cancellation_requested'].includes(s)) return 'cancel_requested';
  return s;
}

/**
 * @route   GET /api/appointments/registry
 * @desc    List appointments with joined doctor/patient metadata (Admin view)
 * @access  Public (no auth middleware in this project yet)
 */
router.get('/registry', async (req, res) => {
  try {
    // Basic filters (optional)
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim().toLowerCase(); // pending|confirmed|completed|cancelled|cancel_requested|''

    if (!(await tableExists('appointments'))) {
      return res.status(500).json({
        success: false,
        message: "Table 'appointments' not found in the database",
      });
    }

    const [aCols, usersCols, patientsCols, doctorsCols] = await Promise.all([
      getColumns('appointments'),
      tableExists('users') ? getColumns('users') : Promise.resolve(new Set()),
      tableExists('patients') ? getColumns('patients') : Promise.resolve(new Set()),
      tableExists('doctors') ? getColumns('doctors') : Promise.resolve(new Set()),
    ]);

    const apptIdExpr = aCols.has('id')
      ? 'a.id::text'
      : aCols.has('appointment_id')
        ? 'a.appointment_id::text'
        : 'a.ctid::text';

    const statusExpr = aCols.has('status')
      ? 'LOWER(a.status::text)'
      : aCols.has('appointment_status')
        ? 'LOWER(a.appointment_status::text)'
        : `'pending'`;

    const cancellationReasonExpr = aCols.has('cancellation_reason')
      ? 'a.cancellation_reason::text'
      : aCols.has('cancel_reason')
        ? 'a.cancel_reason::text'
        : aCols.has('reason')
          ? 'a.reason::text'
          : 'NULL';

    const requestedByExpr = aCols.has('requested_by')
      ? 'a.requested_by::text'
      : aCols.has('cancel_requested_by')
        ? 'a.cancel_requested_by::text'
        : 'NULL';

    const timeExpr = aCols.has('appointment_datetime')
      ? 'a.appointment_datetime::text'
      : aCols.has('scheduled_at')
        ? 'a.scheduled_at::text'
        : aCols.has('appointment_time')
          ? 'a.appointment_time::text'
          : aCols.has('time')
            ? 'a.time::text'
            : aCols.has('created_at')
              ? 'a.created_at::text'
              : 'NULL';

    // Join strategy: prefer *_id -> patients/doctors -> users
    const hasPatients = await tableExists('patients');
    const hasDoctors = await tableExists('doctors');
    const hasUsers = await tableExists('users');

    const canJoinPatientById = hasPatients && aCols.has('patient_id') && patientsCols.has('id');
    const canJoinDoctorById = hasDoctors && aCols.has('doctor_id') && doctorsCols.has('id');

    const canJoinPatientUserIdDirect = hasUsers && aCols.has('patient_user_id') && usersCols.size > 0;
    const canJoinDoctorUserIdDirect = hasUsers && aCols.has('doctor_user_id') && usersCols.size > 0;

    const canJoinPatientUserViaPatients =
      canJoinPatientById && hasUsers && patientsCols.has('user_id') && usersCols.size > 0;
    const canJoinDoctorUserViaDoctors =
      canJoinDoctorById && hasUsers && doctorsCols.has('user_id') && usersCols.size > 0;

    const userFullNameExpr = (alias) => {
      if (usersCols.has('full_name')) return `${alias}.full_name::text`;
      if (usersCols.has('first_name') || usersCols.has('last_name')) {
        const first = usersCols.has('first_name') ? `COALESCE(${alias}.first_name::text, '')` : `''`;
        const last = usersCols.has('last_name') ? `COALESCE(${alias}.last_name::text, '')` : `''`;
        return `TRIM(CONCAT(${first}, ' ', ${last}))`;
      }
      if (usersCols.has('username')) return `${alias}.username::text`;
      if (usersCols.has('email')) return `${alias}.email::text`;
      return `''`;
    };

    const doctorNameFallback = aCols.has('doctor_name') ? 'a.doctor_name::text' : `''`;
    const patientNameFallback = aCols.has('patient_name') ? 'a.patient_name::text' : `''`;

    const doctorNameExpr = canJoinDoctorUserIdDirect
      ? userFullNameExpr('du')
      : canJoinDoctorUserViaDoctors
        ? userFullNameExpr('du')
        : doctorNameFallback;

    const patientNameExpr = canJoinPatientUserIdDirect
      ? userFullNameExpr('pu')
      : canJoinPatientUserViaPatients
        ? userFullNameExpr('pu')
        : patientNameFallback;

    const patientNicExpr =
      canJoinPatientById && patientsCols.has('nic')
        ? 'p.nic::text'
        : aCols.has('patient_nic')
          ? 'a.patient_nic::text'
          : `''`;

    const specializationExpr =
      canJoinDoctorById && doctorsCols.has('specialization')
        ? 'd.specialization::text'
        : aCols.has('specialization')
          ? 'a.specialization::text'
          : aCols.has('type')
            ? 'a.type::text'
            : aCols.has('appointment_type')
              ? 'a.appointment_type::text'
              : `''`;

    const joins = [];
    if (canJoinPatientById) joins.push('LEFT JOIN patients p ON p.id::text = a.patient_id::text');
    if (canJoinDoctorById) joins.push('LEFT JOIN doctors d ON d.id::text = a.doctor_id::text');

    if (canJoinPatientUserIdDirect) joins.push('LEFT JOIN users pu ON pu.id::text = a.patient_user_id::text');
    else if (canJoinPatientUserViaPatients) joins.push('LEFT JOIN users pu ON pu.id::text = p.user_id::text');

    if (canJoinDoctorUserIdDirect) joins.push('LEFT JOIN users du ON du.id::text = a.doctor_user_id::text');
    else if (canJoinDoctorUserViaDoctors) joins.push('LEFT JOIN users du ON du.id::text = d.user_id::text');

    const where = ['1=1'];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      where.push(`${statusExpr} = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      where.push(
        `(
          ${doctorNameExpr} ILIKE ${p}
          OR ${patientNameExpr} ILIKE ${p}
          OR COALESCE(${patientNicExpr}, '') ILIKE ${p}
          OR ${apptIdExpr} ILIKE ${p}
        )`
      );
    }

    const sql = `
      SELECT
        ${apptIdExpr}                      AS id,
        ${doctorNameExpr}                  AS doctor_name,
        ${patientNameExpr}                 AS patient_name,
        ${patientNicExpr}                  AS patient_nic,
        ${timeExpr}                        AS time,
        ${specializationExpr}              AS specialization,
        ${statusExpr}                      AS status,
        ${cancellationReasonExpr}          AS cancellation_reason,
        ${requestedByExpr}                 AS requested_by
      FROM appointments a
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
      ORDER BY
        ${aCols.has('appointment_datetime') ? 'a.appointment_datetime' : aCols.has('scheduled_at') ? 'a.scheduled_at' : aCols.has('created_at') ? 'a.created_at' : 'a.id'} DESC
      LIMIT 500
    `;

    const result = await query(sql, params);

    const data = result.rows.map((row) => ({
      id: String(row.id ?? ''),
      doctorName: String(row.doctor_name ?? '').trim() || '—',
      patientName: String(row.patient_name ?? '').trim() || '—',
      patientNIC: String(row.patient_nic ?? '').trim() || '—',
      time: String(row.time ?? '').trim() || '—',
      type: String(row.specialization ?? '').trim() || '—',
      status: normalizeStatus(row.status),
      cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
      requestedBy: row.requested_by ? String(row.requested_by) : undefined,
    }));

    res.json({
      success: true,
      message: 'Appointments loaded',
      data,
    });
  } catch (error) {
    console.error('Error loading appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load appointments',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update an appointment status (Admin actions: complete/cancel)
 * @access  Public (no auth middleware in this project yet)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id ?? '').trim();
    const nextStatusRaw = req.body?.status;
    const nextStatus = normalizeStatus(nextStatusRaw);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing appointment id' });
    }

    if (!['pending', 'confirmed', 'completed', 'cancelled', 'cancel_requested'].includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (!(await tableExists('appointments'))) {
      return res.status(500).json({
        success: false,
        message: "Table 'appointments' not found in the database",
      });
    }

    const aCols = await getColumns('appointments');

    const idCol = aCols.has('id') ? 'id' : aCols.has('appointment_id') ? 'appointment_id' : null;
    if (!idCol) {
      return res.status(500).json({
        success: false,
        message: "No primary id column found on 'appointments' (expected id or appointment_id)",
      });
    }

    const statusCol = aCols.has('status') ? 'status' : aCols.has('appointment_status') ? 'appointment_status' : null;
    if (!statusCol) {
      return res.status(500).json({
        success: false,
        message: "No status column found on 'appointments' (expected status or appointment_status)",
      });
    }

    const updatedAtCol = aCols.has('updated_at') ? 'updated_at' : null;
    const setUpdatedAtSql = updatedAtCol ? `, ${updatedAtCol} = NOW()` : '';

    const updateSql = `
      UPDATE appointments
      SET ${statusCol} = $1${setUpdatedAtSql}
      WHERE ${idCol}::text = $2
      RETURNING ${idCol}::text AS id, LOWER(${statusCol}::text) AS status
    `;
    const result = await query(updateSql, [nextStatus, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.json({
      success: true,
      message: 'Appointment status updated',
      data: {
        id: String(result.rows[0].id),
        status: normalizeStatus(result.rows[0].status),
      },
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message,
    });
  }
});

module.exports = router;
