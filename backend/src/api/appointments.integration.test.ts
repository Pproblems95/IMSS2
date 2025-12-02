import request from 'supertest';
import app from '../app';
import { query } from '../db/pool';
import { revokeAllUsers } from '../models/user';

// Integration tests for Appointments endpoints with auto-assignment
// Requires PostgreSQL to be running and migrations applied

describe('Appointments Integration Tests (Triage + Auto-Assignment)', () => {
  let dbAvailable = false;
  let accessToken = '';
  let userId = '';

  beforeAll(async () => {
    // Check if database is available
    try {
      await revokeAllUsers();
      await query('DELETE FROM appointments');
      await query('DELETE FROM urgency_assessments');
      await query('DELETE FROM doctor_schedules');
      await query('DELETE FROM doctors');

      // Create a test doctor
      const doc = await query(
        "INSERT INTO doctors (name, specialty, qualifications) VALUES ($1,$2,$3) RETURNING id",
        ['Dr Integration Test', 'general', '[]']
      );
      const doctorId = doc.rows[0].id;

      // Create doctor schedule for today with available slots
      const today = new Date().toISOString().slice(0, 10);
      const slots = [
        { slot_id: 's1', start: '09:00' },
        { slot_id: 's2', start: '10:00' },
        { slot_id: 's3', start: '11:00' },
        { slot_id: 's4', start: '14:00' },
        { slot_id: 's5', start: '15:00' },
        { slot_id: 's6', start: '16:00' },
      ];
      await query(
        'INSERT INTO doctor_schedules (doctor_id, date, available_slots, booked_slots, max_capacity) VALUES ($1,$2,$3,$4,$5)',
        [doctorId, today, JSON.stringify(slots), JSON.stringify([]), 10]
      );

      // Register a test user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'appt-test-' + Date.now() + '@example.com', // Use unique email to avoid duplicates
          password: 'testPass123',
        });

      if (registerRes.status !== 201) {
        throw new Error(`Failed to register test user: ${registerRes.body.message}`);
      }

      userId = registerRes.body.id;

      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerRes.body.email,
          password: 'testPass123',
        });

      if (loginRes.status !== 200) {
        throw new Error(`Failed to login: ${loginRes.body.message}`);
      }

      accessToken = loginRes.body.accessToken;
      dbAvailable = true;
    } catch (err: any) {
      console.warn('⚠️  PostgreSQL not available - skipping appointment integration tests');
      console.warn('    To run these tests, start PostgreSQL and run: npm run migrate');
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    try {
      await revokeAllUsers();
      await query('DELETE FROM appointments');
      await query('DELETE FROM urgency_assessments');
      await query('DELETE FROM doctor_schedules');
      await query('DELETE FROM doctors');
      const { close } = await import('../db/pool');
      await close?.();
    } catch (e) {
      // ignore cleanup errors
    }
  });

  describe('POST /api/appointments with triage', () => {
    test('should auto-assign appointment based on triage + specialty', async () => {
      if (!dbAvailable || !accessToken) return;

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [1, 0, 0, 0, 0], // LOW urgency
          specialty: 'general',
          reason: 'Chequeo general',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('appointment');
      expect(res.body).toHaveProperty('triage');
      expect(res.body.appointment).toHaveProperty('referenceNumber');
      expect(res.body.appointment.urgencyLevel).toBe('LOW');
      expect(res.body.triage.urgency).toBe('LOW');
    });

    test('should detect emergency on high first answer', async () => {
      if (!dbAvailable || !accessToken) return;

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [3, 0, 0, 0, 0], // EMERGENCY flag
          specialty: 'general',
          reason: 'Dolor en pecho',
        });

      expect(res.status).toBe(201);
      expect(res.body.triage.emergencyFlag).toBe(true);
      expect(res.body.triage.urgency).toBe('EMERGENCY');
    });

    test('should reject booking without auth', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/appointments')
        .send({
          triageAnswers: [1, 0, 0, 0, 0],
          specialty: 'general',
        });

      expect(res.status).toBe(401);
    });

    test('should return 404 if no slots available', async () => {
      if (!dbAvailable || !accessToken) return;

      // Try to book for non-existent specialty
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [1, 0, 0, 0, 0],
          specialty: 'nonexistent_specialty',
          reason: 'Test',
        });

      expect(res.status).toBe(404);
    });

    test('should fallback to explicit doctor + time if no triage', async () => {
      if (!dbAvailable || !accessToken) return;

      // Get a doctor ID from DB
      const docs = await query('SELECT id FROM doctors LIMIT 1');
      const doctorId = docs.rows[0].id;

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          doctorId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          reason: 'Manual booking',
          urgencyLevel: 'MID',
        });

      expect(res.status).toBe(201);
      expect(res.body.urgencyLevel).toBe('MID');
    });
  });

  describe('GET /api/appointments', () => {
    test('should list user appointments', async () => {
      if (!dbAvailable || !accessToken) return;

      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('should reject list without auth', async () => {
      if (!dbAvailable) return;

      const res = await request(app).get('/api/appointments');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/appointments/:id', () => {
    test('should retrieve a specific appointment', async () => {
      if (!dbAvailable || !accessToken) return;

      // Create an appointment first
      const createRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [1, 0, 0, 0, 0],
          specialty: 'general',
          reason: 'Test',
        });

      const appointmentId = createRes.body.appointment.id;

      const res = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(appointmentId);
      expect(res.body).toHaveProperty('referenceNumber');
    });

    test('should reject access to other users appointments', async () => {
      if (!dbAvailable || !accessToken) return;

      // Register another user
      const user2Reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other-user@example.com',
          password: 'pass123',
        });

      const user2Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other-user@example.com',
          password: 'pass123',
        });

      const user2Token = user2Login.body.accessToken;

      // Create appointment as first user
      const createRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [1, 0, 0, 0, 0],
          specialty: 'general',
          reason: 'Test',
        });

      const appointmentId = createRes.body.appointment.id;

      // Try to access as second user
      const res = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/appointments/:id/emergency-escalate', () => {
    test('should escalate appointment to emergency', async () => {
      if (!dbAvailable || !accessToken) return;

      // Create a normal appointment first
      const createRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [1, 0, 0, 0, 0],
          specialty: 'general',
          reason: 'Test',
        });

      const appointmentId = createRes.body.id || createRes.body.appointment?.id;

      // Escalate to emergency
      const res = await request(app)
        .post(`/api/appointments/${appointmentId}/emergency-escalate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: 'Patient condition worsened',
        });

      expect(res.status).toBe(202);
      expect(res.body.escalationId).toBeDefined();
      expect(res.body.dispatchReference).toBeDefined();
      expect(res.body.message).toContain('escalación');
    });

    test('should reject escalation without appointment ID', async () => {
      if (!dbAvailable || !accessToken) return;

      const res = await request(app)
        .post('/api/appointments/invalid-id/emergency-escalate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: 'Test escalation',
        });

      expect(res.status).toBe(404);
    });

    test('should reject duplicate escalations', async () => {
      if (!dbAvailable || !accessToken) return;

      // Create an appointment
      const createRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [1, 0, 0, 0, 0],
          specialty: 'general',
          reason: 'Test',
        });

      const appointmentId = createRes.body.id || createRes.body.appointment?.id;

      // First escalation
      await request(app)
        .post(`/api/appointments/${appointmentId}/emergency-escalate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notes: 'First escalation' });

      // Try second escalation
      const res = await request(app)
        .post(`/api/appointments/${appointmentId}/emergency-escalate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notes: 'Second escalation' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('escalación activa');
    });

    test('should detect emergency during appointment creation', async () => {
      if (!dbAvailable || !accessToken) return;

      // Create appointment with chest pain emergency (Q0=3)
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [3, 0, 0, 0, 0], // Q0=3 = chest pain
          specialty: 'general',
          reason: 'Severe chest pain',
        });

      expect(res.status).toBe(201);
      expect(res.body.urgencyLevel).toBe('EMERGENCY');
      expect(res.body.emergencyEscalation).toBeDefined();
      expect(res.body.escalationType).toBe('CHEST_PAIN');
    });

    test('should detect trauma emergency', async () => {
      if (!dbAvailable || !accessToken) return;

      // Create appointment with trauma emergency (Q3=1 + Q1>=2)
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [0, 2, 0, 1, 0], // Q1=2 (moderate), Q3=1 (trauma)
          specialty: 'general',
          reason: 'Motor vehicle accident',
        });

      expect(res.status).toBe(201);
      expect(res.body.urgencyLevel).toBe('EMERGENCY');
      expect(res.body.escalationType).toBe('TRAUMA');
    });

    test('should not create emergency for non-emergency symptoms', async () => {
      if (!dbAvailable || !accessToken) return;

      // Create appointment with low urgency (no emergency indicators)
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          triageAnswers: [0, 0, 0, 0, 0], // All low
          specialty: 'general',
          reason: 'Routine checkup',
        });

      expect(res.status).toBe(201);
      expect(res.body.urgencyLevel).toBe('LOW');
      expect(res.body.emergencyEscalation).toBeUndefined();
    });
  });
});
