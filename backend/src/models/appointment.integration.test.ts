import { assessTriage } from '../services/triage.service';
import { findAvailableSlot } from '../services/scheduling.service';
import { createAppointment, createUrgencyAssessment } from './appointment';
import { query } from '../db/pool';

// Integration-style test that creates doctor/schedule/user rows and runs booking flow
// Skips if DB not available or migrations not applied

describe('Appointment booking integration', () => {
  let dbAvailable = false;
  let doctorId: string | null = null;
  let userId: string | null = null;

  beforeAll(async () => {
    try {
      // quick check that DB is available
      await query('SELECT 1');
      dbAvailable = true;
    } catch (e) {
      console.warn('Postgres not available - skipping appointment integration test');
      return;
    }

    // create a doctor
    const d = await query("INSERT INTO doctors (name, specialty, qualifications) VALUES ($1,$2,$3) RETURNING id", ['Dr Test', 'general', '[]']);
    doctorId = d.rows[0].id;

    // create doctor_schedule for today with one slot
    const today = new Date().toISOString().slice(0, 10);
    const slots = [{ slot_id: 's1', start: '09:00' }];
    await query('INSERT INTO doctor_schedules (doctor_id, date, available_slots, booked_slots, max_capacity) VALUES ($1,$2,$3,$4,$5)', [doctorId, today, JSON.stringify(slots), JSON.stringify([]), 10]);

    // create a dummy user row
    const u = await query("INSERT INTO users (email, password_hash, curp) VALUES ($1,$2,$3) RETURNING id", ['int-test@example.com','hash','CURP12345678901234']);
    userId = u.rows[0].id;
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    // cleanup
    await query('DELETE FROM urgency_assessments');
    await query('DELETE FROM appointments');
    await query('DELETE FROM doctor_schedules');
    await query('DELETE FROM doctors');
    await query("DELETE FROM users WHERE email = $1", ['int-test@example.com']);
  });

  test('book appointment via triage & scheduling', async () => {
    if (!dbAvailable || !doctorId || !userId) return;

    const triageAnswers = [2, 0, 0, 0, 0];
    const triage = assessTriage(triageAnswers);
    const slot = await findAvailableSlot('general', 24);
    expect(slot).toBeTruthy();

    // derive scheduledAt
    let scheduled = slot!.slot.start;
    if (!scheduled.includes('T')) scheduled = `${slot!.date}T${scheduled}:00Z`;

    const appt = await createAppointment(userId!, slot!.doctorId, scheduled, triage.urgency, 'Prueba');
    expect(appt).toBeTruthy();

    const ua = await createUrgencyAssessment(appt.id, triageAnswers, triage.score, triage.urgency, triage.emergencyFlag);
    expect(ua).toBeTruthy();
  });
});
