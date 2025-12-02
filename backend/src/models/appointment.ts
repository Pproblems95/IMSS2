import { query, getClient } from '../db/pool';

export interface AppointmentRecord {
  id: string;
  userId: string;
  doctorId?: string | null;
  scheduledAt: string;
  urgencyLevel: string;
  reason?: string;
  status: string;
  referenceNumber: string;
  createdAt: string;
}

function generateReferenceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `APPT-${y}${m}${d}-${rand}`;
}

export async function createAppointment(userId: string, doctorId: string | null, scheduledAt: string, urgencyLevel = 'LOW', reason?: string) {
  const client = await getClient();
  const referenceNumber = generateReferenceNumber();

  try {
    await client.query('BEGIN');

    // prevent double-booking: check for exact slot on same doctor (skip if no doctor assigned)
    if (doctorId) {
      const conflict = await client.query(
        'SELECT id FROM appointments WHERE doctor_id = $1 AND scheduled_at = $2 AND status = $3 FOR UPDATE',
        [doctorId, scheduledAt, 'BOOKED']
      );

      if (conflict.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('Slot already booked');
      }
    }

    const insert = await client.query(
      `INSERT INTO appointments (user_id, doctor_id, scheduled_at, urgency_level, reason, reference_number)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, user_id, doctor_id, scheduled_at, urgency_level, reason, status, reference_number, created_at`,
      [userId, doctorId || null, scheduledAt, urgencyLevel, reason || null, referenceNumber]
    );

    const row = insert.rows[0];
    const appointmentId = row.id;

    // Mark slot as booked in doctor_schedules (only if doctor assigned)
    if (doctorId) {
      const date = new Date(scheduledAt).toISOString().slice(0, 10);
      const time = new Date(scheduledAt).toISOString().slice(11, 16); // HH:MM format
      // Add the booked slot to the doctor's schedule
      const bookedSlot = JSON.stringify({ start: time, appointment_id: appointmentId });
      await client.query(
        `UPDATE doctor_schedules 
         SET booked_slots = COALESCE(booked_slots, '[]'::jsonb) || ($1::jsonb)
         WHERE doctor_id = $2 AND date = $3`,
        [`[${bookedSlot}]`, doctorId, date]
      );
    }

    await client.query('COMMIT');
    return {
      id: row.id,
      userId: row.user_id,
      doctorId: row.doctor_id,
      scheduledAt: row.scheduled_at,
      urgencyLevel: row.urgency_level,
      reason: row.reason,
      status: row.status,
      referenceNumber: row.reference_number,
      createdAt: row.created_at,
    } as AppointmentRecord;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function findById(id: string): Promise<AppointmentRecord | null> {
  const result = await query(
    'SELECT id, user_id, doctor_id, scheduled_at, urgency_level, reason, status, reference_number, created_at FROM appointments WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    doctorId: r.doctor_id,
    scheduledAt: r.scheduled_at,
    urgencyLevel: r.urgency_level,
    reason: r.reason,
    status: r.status,
    referenceNumber: r.reference_number,
    createdAt: r.created_at,
  };
}

export async function listByUser(userId: string) {
  const result = await query(
    'SELECT id, user_id, doctor_id, scheduled_at, urgency_level, reason, status, reference_number, created_at FROM appointments WHERE user_id = $1 ORDER BY scheduled_at DESC',
    [userId]
  );
  return result.rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    doctorId: r.doctor_id,
    scheduledAt: r.scheduled_at,
    urgencyLevel: r.urgency_level,
    reason: r.reason,
    status: r.status,
    referenceNumber: r.reference_number,
    createdAt: r.created_at,
  }));
}

export async function cancelAppointment(id: string, userId: string) {
  const result = await query('UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING id', [
    'CANCELLED',
    id,
    userId,
  ]);
  const ok = result && (result.rowCount || 0) > 0;
  return ok;
}

export async function clearAllAppointmentsForTests() {
  await query('DELETE FROM appointments');
}

export async function createUrgencyAssessment(appointmentId: string, questionResponses: any, score: number, calculatedUrgency: string, emergencyFlag: boolean) {
  const res = await query(
    `INSERT INTO urgency_assessments (appointment_id, question_responses, score, calculated_urgency, emergency_flag)
     VALUES ($1, $2::jsonb, $3, $4, $5) RETURNING id, created_at`,
    [appointmentId, JSON.stringify(questionResponses), score, calculatedUrgency, emergencyFlag]
  );
  return res.rows[0];
}
