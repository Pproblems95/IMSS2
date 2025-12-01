import { Request, Response, NextFunction } from 'express';
import { createAppointment as createAppt, listByUser, findById, cancelAppointment, createUrgencyAssessment } from '../../models/appointment';
import { assessTriage } from '../../services/triage.service';
import { findAvailableSlot } from '../../services/scheduling.service';

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'No autorizado' });
    const userId = user.sub || user.id; // JWT uses 'sub' field for user ID
    const list = await listByUser(userId);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'No autorizado' });
    const userId = user.sub || user.id; // JWT uses 'sub' field for user ID

    const { doctorId, scheduledAt, reason, urgencyLevel, triageAnswers, specialty } = req.body;

    // If triage answers provided, run triage and auto-assign slot using specialty
    if (Array.isArray(triageAnswers) && specialty) {
      const triage = assessTriage(triageAnswers);

      // determine search window based on urgency
      let withinHours = 24; // HIGH
      if (triage.urgency === 'MID') withinHours = 72;
      else if (triage.urgency === 'LOW') withinHours = 24 * 14; // 2 weeks

      const slot = await findAvailableSlot(specialty, withinHours);
      if (!slot) {
        return res.status(404).json({ message: 'No hay espacios disponibles en la ventana solicitada' });
      }

      // derive scheduledAt from slot
      let scheduled = slot.slot.start;
      if (!scheduled.includes('T')) {
        // assume time only like '09:00'
        scheduled = `${slot.date}T${scheduled}:00Z`;
      }

      const appt = await createAppt(userId, slot.doctorId, scheduled, triage.urgency, reason);
      // persist triage assessment
      await createUrgencyAssessment(appt.id, triageAnswers, triage.score, triage.urgency, triage.emergencyFlag);
      
      // Format response to match frontend expectations
      return res.status(201).json({
        id: appt.id,
        urgencyLevel: triage.urgency,
        doctorName: slot.doctorName || 'Doctor',
        doctorSpecialty: specialty,
        appointmentTime: scheduled,
        status: appt.status,
        triageAnswers
      });
    }

    // fallback: require explicit doctorId and scheduledAt
    if (!doctorId || !scheduledAt) {
      return res.status(400).json({ message: 'doctorId y scheduledAt son requeridos si no se envía triage/specialty' });
    }

    const appt = await createAppt(userId, doctorId, scheduledAt, urgencyLevel || 'LOW', reason);
    res.status(201).json(appt);
  } catch (err: any) {
    if (err.message && err.message.includes('Slot already booked')) {
      return res.status(409).json({ message: 'El espacio ya está reservado' });
    }
    next(err);
  }
};

export const getAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'No autorizado' });
    const userId = user.sub || user.id; // JWT uses 'sub' field for user ID
    const { id } = req.params;
    const appt = await findById(id);
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' });
    if (appt.userId !== userId) return res.status(403).json({ message: 'Acceso denegado' });
    res.json(appt);
  } catch (err) {
    next(err);
  }
};

export const emergencyEscalate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now: accept escalation request and log it; real integration is T050-series
    // Payload: { appointmentId, notes }
    const { appointmentId } = req.body;
    // TODO: create audit record, notify on-call team, integrate with DispatchService
    console.log('Emergency escalate requested for', appointmentId || '(no id)');
    res.status(202).json({ message: 'Escalación registrada' });
  } catch (err) {
    next(err);
  }
};
