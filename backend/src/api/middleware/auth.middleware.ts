import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AccessTokenPayload | null;
  }
}

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    // attach user context (minimized) to request
    req.user = payload;
    return next();
  } catch (err: any) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
