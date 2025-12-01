import { Router } from 'express';
import { listDoctors, getDoctor, searchDoctors } from '../controllers/doctors.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listDoctors);
router.get('/search', authMiddleware, searchDoctors);
router.get('/:id', authMiddleware, getDoctor);

export default router;
