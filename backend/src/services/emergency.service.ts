import { query } from '../db/pool';
import { randomUUID } from 'crypto';

export interface EmergencyEscalation {
  id: string;
  appointmentId: string;
  userId: string;
  doctorId?: string;
  escalationType: 'TRAUMA' | 'CHEST_PAIN' | 'SEVERE_SYMPTOMS' | 'CRITICAL_CONDITION';
  reason: string;
  status: 'PENDING' | 'NOTIFIED' | 'DISPATCHED' | 'RESOLVED';
  onCallNotifiedAt?: Date;
  dispatchInitiatedAt?: Date;
  dispatchReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Emergency Dispatch Service
 * Handles emergency case detection, on-call physician notification, and 911 dispatch integration
 */
export class EmergencyDispatchService {
  /**
   * Detect emergency cases based on triage indicators
   * Emergency indicators: chest pain, trauma, severe respiratory distress, loss of consciousness
   */
  static detectEmergency(triageAnswers: number[]): {
    isEmergency: boolean;
    escalationType?: string;
    reason?: string;
  } {
    if (!Array.isArray(triageAnswers) || triageAnswers.length === 0) {
      return { isEmergency: false };
    }

    // Pad with zeros if incomplete
    const answers = [...triageAnswers];
    while (answers.length < 5) answers.push(0);

    // Question 0 = Primary emergency indicator (chest pain, trauma)
    // Question 1 = Severity of symptoms (0-3 scale)
    // Question 2 = Breathing difficulty (0-3 scale)
    // Question 3 = Recent accidents/trauma (yes/no as 0-1)
    // Question 4 = Loss of consciousness (yes/no as 0-1)

    const q0 = Number(answers[0]) || 0; // Primary symptom
    const q1 = Number(answers[1]) || 0; // Severity
    const q2 = Number(answers[2]) || 0; // Breathing
    const q3 = Number(answers[3]) || 0; // Trauma
    const q4 = Number(answers[4]) || 0; // Loss of consciousness

    // CHEST_PAIN: Q0=3 (severe chest pain)
    if (q0 === 3) {
      return {
        isEmergency: true,
        escalationType: 'CHEST_PAIN',
        reason: 'Dolor torácico severo - riesgo cardíaco potencial',
      };
    }

    // TRAUMA: Q3=1 (recent accident) + Q1>=2 (moderate+ symptoms)
    if (q3 === 1 && q1 >= 2) {
      return {
        isEmergency: true,
        escalationType: 'TRAUMA',
        reason: 'Traumatismo reciente con síntomas moderados o severos',
      };
    }

    // SEVERE_SYMPTOMS: Q1=3 (very severe) + Q2>=2 (breathing difficulty)
    if (q1 === 3 && q2 >= 2) {
      return {
        isEmergency: true,
        escalationType: 'SEVERE_SYMPTOMS',
        reason: 'Síntomas severos con dificultad respiratoria',
      };
    }

    // CRITICAL_CONDITION: Loss of consciousness or severe breathing distress
    if (q4 === 1 || q2 === 3) {
      return {
        isEmergency: true,
        escalationType: 'CRITICAL_CONDITION',
        reason: 'Condición crítica - pérdida de conciencia o distress respiratorio severo',
      };
    }

    return { isEmergency: false };
  }

  /**
   * Create emergency escalation record in database
   */
  static async createEscalation(
    appointmentId: string,
    userId: string,
    doctorId: string | null,
    escalationType: string,
    reason: string,
    notes?: string
  ): Promise<EmergencyEscalation> {
    const id = randomUUID();
    const now = new Date();

    const result = await query(
      `INSERT INTO emergency_escalations (
        id, appointment_id, user_id, doctor_id, escalation_type, reason, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        appointmentId,
        userId,
        doctorId || null,
        escalationType,
        reason,
        'PENDING',
        notes || null,
        now,
        now,
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Notify on-call physician (<1 minute SLA)
   */
  static async notifyOnCall(escalationId: string): Promise<EmergencyEscalation> {
    const notifiedAt = new Date();

    const result = await query(
      `UPDATE emergency_escalations 
       SET status = $1, on_call_notified_at = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      ['NOTIFIED', notifiedAt, notifiedAt, escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found');
    }

    // TODO: Integrate with actual on-call notification system (SMS/pager/app)
    console.log(`[ON-CALL NOTIFICATION] Escalation ${escalationId} sent to on-call physician at ${notifiedAt.toISOString()}`);

    return this.mapRow(result.rows[0]);
  }

  /**
   * Initiate 911 dispatch (integration stub)
   */
  static async initiate911Dispatch(
    escalationId: string,
    userLocation?: string
  ): Promise<EmergencyEscalation> {
    const dispatchedAt = new Date();
    const dispatchReference = `911-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await query(
      `UPDATE emergency_escalations 
       SET status = $1, dispatch_initiated_at = $2, dispatch_reference = $3, updated_at = $4
       WHERE id = $5
       RETURNING *`,
      ['DISPATCHED', dispatchedAt, dispatchReference, dispatchedAt, escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found');
    }

    // TODO: Integrate with actual 911 dispatch system (ECOMM, local emergency services)
    console.log(`[911 DISPATCH] Reference: ${dispatchReference}, Location: ${userLocation || 'Unknown'}, Time: ${dispatchedAt.toISOString()}`);

    return this.mapRow(result.rows[0]);
  }

  /**
   * Get escalation by ID
   */
  static async getEscalation(escalationId: string): Promise<EmergencyEscalation | null> {
    const result = await query(
      `SELECT * FROM emergency_escalations WHERE id = $1`,
      [escalationId]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Get escalation by appointment ID
   */
  static async getEscalationByAppointment(appointmentId: string): Promise<EmergencyEscalation | null> {
    const result = await query(
      `SELECT * FROM emergency_escalations WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [appointmentId]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Get pending escalations (for on-call dashboard)
   */
  static async getPendingEscalations(limit: number = 10): Promise<EmergencyEscalation[]> {
    const result = await query(
      `SELECT * FROM emergency_escalations 
       WHERE status IN ('PENDING', 'NOTIFIED')
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Resolve escalation
   */
  static async resolveEscalation(escalationId: string, notes?: string): Promise<EmergencyEscalation> {
    const resolvedAt = new Date();

    const result = await query(
      `UPDATE emergency_escalations 
       SET status = $1, notes = COALESCE($2, notes), updated_at = $3
       WHERE id = $4
       RETURNING *`,
      ['RESOLVED', notes || null, resolvedAt, escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found');
    }

    return this.mapRow(result.rows[0]);
  }

  /**
   * Map database row to EmergencyEscalation interface
   */
  private static mapRow(row: any): EmergencyEscalation {
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      userId: row.user_id,
      doctorId: row.doctor_id,
      escalationType: row.escalation_type,
      reason: row.reason,
      status: row.status,
      onCallNotifiedAt: row.on_call_notified_at ? new Date(row.on_call_notified_at) : undefined,
      dispatchInitiatedAt: row.dispatch_initiated_at ? new Date(row.dispatch_initiated_at) : undefined,
      dispatchReference: row.dispatch_reference,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
