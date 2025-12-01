import { Router } from 'express';
import {
  listAppointments,
  createAppointment,
  getAppointment,
  emergencyEscalate,
} from '../controllers/appointments.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listAppointments);
router.post('/', authMiddleware, createAppointment);
router.get('/:id', authMiddleware, getAppointment);
router.post('/emergency-escalate', authMiddleware, emergencyEscalate);

export default router;
