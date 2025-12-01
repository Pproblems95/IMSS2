import { createUser, findByEmail, findById, verifyPassword, revokeAllUsers } from './user';

// These tests require PostgreSQL running locally
// Set env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
// Or use defaults: localhost:5432, imss_medical, postgres:postgres
// To run: npm run migrate && npm test

describe('User Model (Database-backed)', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      await revokeAllUsers();
      dbAvailable = true;
    } catch (err: any) {
      console.warn('⚠️  PostgreSQL not available - skipping User model tests');
      console.warn('    To run these tests, start PostgreSQL and run: npm run migrate');
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await revokeAllUsers();
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    // Clean up after tests
    const { close } = await import('../db/pool');
    await close?.();
  });

  test('should create a user with hashed password', async () => {
    if (!dbAvailable) return;
    const user = await createUser('alice@example.com', 'secret123', 'ABC123XYZ');
    expect(user.email).toBe('alice@example.com');
    expect(user.id).toBeTruthy();
    expect(user.createdAt).toBeTruthy();
  });

  test('should find user by email (case-insensitive)', async () => {
    if (!dbAvailable) return;
    await createUser('bob@example.com', 'password');
    const user = await findByEmail('BOB@EXAMPLE.COM');
    expect(user).toBeTruthy();
    expect(user?.email).toBe('bob@example.com');
  });

  test('should find user by id', async () => {
    if (!dbAvailable) return;
    const created = await createUser('charlie@example.com', 'pass');
    const found = await findById(created.id);
    expect(found).toBeTruthy();
    expect(found?.email).toBe('charlie@example.com');
  });

  test('should reject duplicate email', async () => {
    if (!dbAvailable) return;
    await createUser('dupe@example.com', 'pass1');
    try {
      await createUser('dupe@example.com', 'pass2');
      fail('Should have thrown');
    } catch (e: any) {
      expect(e.message).toContain('exists');
    }
  });

  test('should verify correct password', async () => {
    if (!dbAvailable) return;
    const user = await createUser('eve@example.com', 'mypassword');
    const rec = await findByEmail('eve@example.com');
    expect(rec).toBeTruthy();
    const ok = await verifyPassword(rec!, 'mypassword');
    expect(ok).toBe(true);
  });

  test('should reject wrong password', async () => {
    if (!dbAvailable) return;
    const user = await createUser('frank@example.com', 'correct');
    const rec = await findByEmail('frank@example.com');
    const ok = await verifyPassword(rec!, 'wrong');
    expect(ok).toBe(false);
  });

  test('should clear all users on revokeAllUsers', async () => {
    if (!dbAvailable) return;
    await createUser('user1@example.com', 'pass');
    await createUser('user2@example.com', 'pass');
    await revokeAllUsers();
    expect(await findByEmail('user1@example.com')).toBeNull();
    expect(await findByEmail('user2@example.com')).toBeNull();
  });
});
