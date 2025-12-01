import { Router } from 'express';
import { assessTriage } from '../controllers/triage.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.post('/assess', authMiddleware, assessTriage);

export default router;
