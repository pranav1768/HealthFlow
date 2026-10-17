const request = require('supertest');

// Stub socket so tests don't need a real socket server
jest.mock('../sockets', () => ({
  getIO: () => ({ to: () => ({ emit: () => {} }) }),
  initSocket: jest.fn(),
}));

const app = require('../app');
const User = require('../models/User');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerUser(overrides = {}) {
  return request(app).post('/api/auth/register').send({
    name: 'Test Patient',
    email: `patient-${Date.now()}@test.com`,
    password: 'Password@123',
    role: 'patient',
    ...overrides,
  });
}

// ─── Registration ─────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new patient and returns token + user', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('patient');
    expect(res.body.user.password).toBeUndefined(); // never expose password
  });

  it('registers a new doctor with specialization and fee', async () => {
    const res = await registerUser({
      name: 'Dr. Test',
      email: `doctor-${Date.now()}@test.com`,
      role: 'doctor',
      specialization: 'Cardiology',
      consultationFee: 800,
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('doctor');
  });

  it('rejects registration with duplicate email', async () => {
    const email = `dup-${Date.now()}@test.com`;
    await registerUser({ email });
    const res = await registerUser({ email });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('rejects admin account creation via public API', async () => {
    const res = await registerUser({ role: 'admin' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });

  it('rejects doctor registration without specialization', async () => {
    const res = await registerUser({
      role: 'doctor',
      email: `doc-nospec-${Date.now()}@test.com`,
    });
    expect(res.status).toBe(400);
  });

  it('rejects registration with missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('rejects weak password (less than 8 chars)', async () => {
    const res = await registerUser({ password: '123' });
    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  let testEmail;
  const testPassword = 'Password@123';

  beforeEach(async () => {
    testEmail = `login-${Date.now()}@test.com`;
    await registerUser({ email: testEmail, password: testPassword });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPass@999',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@nowhere.com',
      password: testPassword,
    });
    expect(res.status).toBe(401);
  });

  it('rejects login with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testEmail });
    expect(res.status).toBe(400);
  });

  it('rejects login for deactivated account', async () => {
    await User.findOneAndUpdate({ email: testEmail }, { isActive: false });
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('sets httpOnly cookie on successful login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/token=loggedout/);
  });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const email = `me-${Date.now()}@test.com`;
    const reg = await registerUser({ email });
    const token = reg.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });
});

// ─── Change Password ──────────────────────────────────────────────────────────

describe('PATCH /api/auth/change-password', () => {
  it('changes password with correct current password', async () => {
    const email = `chpw-${Date.now()}@test.com`;
    const reg = await registerUser({ email, password: 'OldPass@123' });
    const token = reg.body.token;

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    // Verify new password works
    const login = await request(app).post('/api/auth/login').send({
      email,
      password: 'NewPass@456',
    });
    expect(login.status).toBe(200);
  });

  it('rejects change with wrong current password', async () => {
    const reg = await registerUser();
    const token = reg.body.token;

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongCurrent@1', newPassword: 'NewPass@456' });
    expect(res.status).toBe(401);
  });

  it('rejects new password shorter than 8 chars', async () => {
    const reg = await registerUser();
    const token = reg.body.token;

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password@123', newPassword: '123' });
    expect(res.status).toBe(400);
  });
});
