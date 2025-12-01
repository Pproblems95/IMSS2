import request from 'supertest';
import app from '../app';
import { revokeAllUsers } from '../models/user';

// Integration tests for Auth endpoints
// Requires PostgreSQL to be running
// Instructions:
// 1. Start PostgreSQL: docker run --name imss-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=imss_medical -p 5432:5432 -d postgres:15
// 2. Run migrations: npm run migrate
// 3. Run tests: npm test

describe('Auth Integration Tests', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    // Check if database is available
    try {
      await revokeAllUsers();
      dbAvailable = true;
    } catch (err: any) {
      console.warn('⚠️  PostgreSQL not available - skipping integration tests');
      console.warn('    To run these tests, start PostgreSQL and run: npm run migrate');
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    try {
      await revokeAllUsers();
    } catch (err) {
      // ignore
    }
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    try {
      const { close } = await import('../db/pool');
      await close?.();
    } catch (e) {
      // ignore cleanup errors
    }
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user with email and password', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'securePassword123',
          curp: 'ABC123XYZ',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'newuser@example.com');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    test('should reject registration without email', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'test123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('should reject registration without password', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('should reject duplicate email registration', async () => {
      if (!dbAvailable) return;
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'pass1',
        });

      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'pass2',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      if (!dbAvailable) return;
      // Create a test user before login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'correctPassword123',
        });
    });

    test('should login with correct credentials and return tokens', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'correctPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.accessToken.split('.').length).toBe(3); // JWT format
    });

    test('should reject login with wrong password', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('should reject login without email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'test123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('should reject login without password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('should handle case-insensitive email on login', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'LOGIN@EXAMPLE.COM',
          password: 'correctPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      if (!dbAvailable) return;
      // Register and login to get tokens
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'testPassword123',
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'testPassword123',
        });

      refreshToken = loginRes.body.refreshToken;
      accessToken = loginRes.body.accessToken;
    });

    test('should refresh and return new tokens', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.accessToken).not.toBe(accessToken); // New token issued
      expect(res.body.refreshToken).not.toBe(refreshToken); // Token rotated
    });

    test('should reject refresh with invalid token', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    test('should reject refresh without token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('should prevent reuse of refresh token', async () => {
      if (!dbAvailable) return;
      // First refresh should work
      const res1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res1.status).toBe(200);

      // Attempt to reuse old refresh token should fail (token consumed)
      const res2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res2.status).toBe(401);
      expect(res2.body.message).toContain('revoked');
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      if (!dbAvailable) return;
      // Register and login to get tokens
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'testPassword123',
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'testPassword123',
        });

      refreshToken = loginRes.body.refreshToken;
      accessToken = loginRes.body.accessToken;
    });

    test('should revoke specific refresh token', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken,
        });

      expect(res.status).toBe(204);

      // Verify token is revoked (cannot refresh)
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    test('should revoke all tokens for authenticated user', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // Verify token is revoked
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    test('should reject logout without token', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No token');
    });

    test('should reject logout with invalid refresh token', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'invalid.token.here',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'imss-medical-backend');
    });
  });
});
