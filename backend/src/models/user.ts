import bcrypt from 'bcryptjs';
import { query } from '../db/pool';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  curp?: string;
  createdAt: string;
}

export async function createUser(email: string, password: string, curp?: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await query(
      `INSERT INTO users (email, password_hash, curp) VALUES ($1, $2, $3)
       RETURNING id, email, created_at`,
      [email.toLowerCase(), passwordHash, curp || null]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
    };
  } catch (err: any) {
    if (err.code === '23505') {
      // unique constraint violation
      throw new Error('Email already exists');
    }
    throw err;
  }
}

export function findByEmail(email: string): Promise<UserRecord | null> {
  return query('SELECT id, email, password_hash, curp, created_at FROM users WHERE LOWER(email) = LOWER($1)', [
    email,
  ]).then((result) => {
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      curp: row.curp,
      createdAt: row.created_at,
    };
  });
}

export function findById(id: string): Promise<UserRecord | null> {
  return query('SELECT id, email, password_hash, curp, created_at FROM users WHERE id = $1', [id]).then(
    (result) => {
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        curp: row.curp,
        createdAt: row.created_at,
      };
    }
  );
}

export async function verifyPassword(user: UserRecord, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function revokeAllUsers() {
  // helper for tests/dev: clear users
  await query('DELETE FROM users');
}
