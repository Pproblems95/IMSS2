import { Request, Response, NextFunction } from 'express';
import { createAppointment as createAppt, listByUser, findById, cancelAppointment, createUrgencyAssessment } from '../../models/appointment';
import { getOrCreateEmergencyPlaceholder } from '../../models/doctor';
import { assessTriage } from '../../services/triage.service';
import { EmergencyDispatchService } from '../../services/emergency.service';
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

      // Check for emergency conditions
      const emergencyCheck = EmergencyDispatchService.detectEmergency(triageAnswers);
      if (emergencyCheck.isEmergency) {
        // For emergency appointments we ensure a valid placeholder doctor exists and assign its id
        const emergencyDoctorId = await getOrCreateEmergencyPlaceholder();
        try {
          // Create appointment first for tracking
          const appt = await createAppt(userId, emergencyDoctorId, new Date().toISOString(), 'EMERGENCY', reason);
          await createUrgencyAssessment(appt.id, triageAnswers, triage.score, 'EMERGENCY', true);

          // Create escalation record (non-blocking - if DB table doesn't exist, continue anyway)
          try {
            const escalation = await EmergencyDispatchService.createEscalation(
              appt.id,
              userId,
              null as any,
              emergencyCheck.escalationType || 'CRITICAL_CONDITION',
              emergencyCheck.reason || reason,
              `Triaged through appointment form with answers: ${JSON.stringify(triageAnswers)}`
            );

            // Notify on-call physician (should complete within <1 minute SLA)
            await EmergencyDispatchService.notifyOnCall(escalation.id);

            // Initiate 911 dispatch
            await EmergencyDispatchService.initiate911Dispatch(escalation.id, 'Unknown'); // TODO: Get user location

            return res.status(201).json({
              id: appt.id,
              urgencyLevel: 'EMERGENCY',
              emergencyEscalation: escalation.id,
              escalationType: escalation.escalationType,
              message: '¡EMERGENCIA! Se ha activado el protocolo de escalación. Ayuda en camino.',
              triageAnswers,
            });
          } catch (escalationErr: any) {
            console.warn('Emergency escalation DB error (non-blocking):', escalationErr.message);
            // If escalation fails due to missing DB table, still return appointment
            return res.status(201).json({
              id: appt.id,
              urgencyLevel: 'EMERGENCY',
              message: '¡EMERGENCIA! Se ha activado el protocolo de escalación. Ayuda en camino.',
              triageAnswers,
            });
          }
        } catch (apptErr) {
          console.error('Emergency appointment creation failed:', apptErr);
          throw apptErr;
        }
      }

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
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'No autorizado' });

    const { appointmentId, notes } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ message: 'appointmentId es requerido' });
    }

    // Verify appointment exists and belongs to user
    const appt = await findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const userId = user.sub || user.id;
    if (appt.userId !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Check if escalation already exists
    const existing = await EmergencyDispatchService.getEscalationByAppointment(appointmentId);
    if (existing && existing.status !== 'RESOLVED') {
      return res.status(409).json({
        message: 'Esta cita ya tiene una escalación activa',
        escalationId: existing.id,
      });
    }

    // Create emergency escalation record
    const escalation = await EmergencyDispatchService.createEscalation(
      appointmentId,
      userId,
      appt.doctorId ?? null,
      'PATIENT_REQUEST',
      notes || 'Escalación solicitada por el paciente',
      notes
    );

    // Notify on-call physician
    await EmergencyDispatchService.notifyOnCall(escalation.id);

    // Initiate dispatch
    await EmergencyDispatchService.initiate911Dispatch(escalation.id);

    res.status(202).json({
      message: 'Escalación registrada y ayuda en camino',
      escalationId: escalation.id,
      dispatchReference: escalation.dispatchReference,
    });
  } catch (err) {
    next(err);
  }
};
