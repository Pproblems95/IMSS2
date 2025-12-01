import { Request, Response, NextFunction } from 'express';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import * as tokenStore from '../../utils/tokenStore';
import { createUser, findByEmail, verifyPassword } from '../../models/user';

const REFRESH_TTL_SECONDS = (() => {
  const v = process.env.JWT_REFRESH_EXP || '7d';
  // crude parse: days -> seconds if ends with 'd'
  if (v.endsWith('d')) return parseInt(v.slice(0, -1), 10) * 24 * 3600;
  if (v.endsWith('h')) return parseInt(v.slice(0, -1), 10) * 3600;
  return 7 * 24 * 3600;
})();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, curp } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    try {
      const user = await createUser(email, password, curp);
      res.status(201).json({ id: user.id, email: user.email, createdAt: user.createdAt });
    } catch (err: any) {
      if (err.message && err.message.includes('exists')) return res.status(409).json({ message: 'Email already registered' });
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(payload);

    const { token: refreshToken, jti } = signRefreshToken({ sub: user.id, email: user.email });
    await tokenStore.storeRefreshToken(jti, user.id, REFRESH_TTL_SECONDS);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Support two logout flows:
    // 1) client posts { refreshToken } to revoke that token
    // 2) authenticated user (req.user) can revoke all tokens for their account
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        await tokenStore.revokeRefreshToken(decoded.jti);
        return res.status(204).send();
      } catch (e) {
        // fall through to 400
        return res.status(400).json({ message: 'Invalid refresh token' });
      }
    }

    // If user is authenticated, revoke all tokens for user
    // `auth.middleware` sets `req.user`.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const user = req.user;
    if (user && user.sub) {
      await tokenStore.revokeAllForUser(user.sub);
      return res.status(204).send();
    }

    return res.status(400).json({ message: 'No token provided' });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify and consume the presented refresh token (rotation)
    const owner = await tokenStore.verifyAndConsumeRefreshToken(decoded.jti);
    if (!owner) return res.status(401).json({ message: 'Refresh token revoked or unknown' });

    // Issue new access + refresh token
    const accessToken = signAccessToken({ sub: decoded.sub, email: decoded.email });
    const { token: newRefreshToken, jti: newJti } = signRefreshToken({ sub: decoded.sub, email: decoded.email });
    await tokenStore.storeRefreshToken(newJti, decoded.sub, REFRESH_TTL_SECONDS);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

export const passwordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: send password reset email
    res.json({ message: 'Password reset email queued (skeleton)' });
  } catch (err) {
    next(err);
  }
};
