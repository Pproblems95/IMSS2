import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_EXP = process.env.JWT_ACCESS_EXP || '24h';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret';
const REFRESH_EXP = process.env.JWT_REFRESH_EXP || '7d';

export interface AccessTokenPayload {
  sub: string; // user id or CURP
  email?: string;
  curp?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  email?: string;
  jti: string; // token id for rotation
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Partial<AccessTokenPayload>): string {
  // Use HS256 for now; in prod prefer RS256 with key management
  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_EXP,
  } as any);
  return token;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
    return decoded;
  } catch (err) {
    throw err;
  }
}

export function signRefreshToken(payload: Partial<RefreshTokenPayload>): { token: string; jti: string } {
  const jti = payload.jti || randomUUID();
  const token = jwt.sign({ ...payload, jti }, REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: REFRESH_EXP,
  } as any);
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] }) as RefreshTokenPayload;
    if (!decoded.jti) throw new Error('Missing jti');
    return decoded;
  } catch (err) {
    throw err;
  }
}
