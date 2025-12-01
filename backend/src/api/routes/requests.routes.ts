import { Router } from 'express';
import {
  createMedicineRequest,
  listMedicineRequests,
  updateMedicineRequest,
  createSickLeaveRequest,
  listSickLeaveRequests,
} from '../controllers/requests.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.post('/medicine-requests', authMiddleware, createMedicineRequest);
router.get('/medicine-requests', authMiddleware, listMedicineRequests);
router.put('/medicine-requests/:id', authMiddleware, updateMedicineRequest);

router.post('/sick-leave-requests', authMiddleware, createSickLeaveRequest);
router.get('/sick-leave-requests', authMiddleware, listSickLeaveRequests);

export default router;
