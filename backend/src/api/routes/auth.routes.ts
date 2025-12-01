import { Router } from 'express';
import { register, login, logout, passwordReset, refresh } from '../controllers/auth.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/password-reset', passwordReset);

export default router;
