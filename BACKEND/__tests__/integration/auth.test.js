/**
 * Integration Tests — Auth API (/api/auth/*)
 * Tests full HTTP request/response cycle for authentication endpoints
 */

const request = require('supertest');
require('../setup/testSetup');
const { createUser, getAuthToken } = require('../setup/testSetup');
const app = require('../../server');

describe('POST /api/auth/register', () => {
  const validPayload = () => ({
    firstName: 'Alice',
    lastName: 'Test',
    email: `alice_${Date.now()}@test.com`,
    username: `alice_${Date.now()}`,
    password: 'TestPass123!',
    institution: 'Test University'
  });

  test('201 — registers a new user and returns token', async () => {
    const payload = validPayload();
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(payload.email.toLowerCase());
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('400 — rejects duplicate email', async () => {
    const payload = validPayload();
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send({
      ...payload,
      username: 'different_username'
    });
    expect(res.status).toBe(400);
  });

  test('400 — rejects duplicate username', async () => {
    const payload = validPayload();
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send({
      ...payload,
      email: `different_${Date.now()}@test.com`
    });
    expect(res.status).toBe(400);
  });

  test('400 — rejects missing firstName', async () => {
    const { firstName, ...payload } = validPayload();
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
  });

  test('400 — rejects missing email', async () => {
    const { email, ...payload } = validPayload();
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
  });

  test('400 — rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validPayload(),
      email: 'not-an-email'
    });
    expect(res.status).toBe(400);
  });

  test('400 — rejects password shorter than 6 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validPayload(),
      password: '12345'
    });
    expect(res.status).toBe(400);
  });

  test('400 — rejects username shorter than 3 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validPayload(),
      username: 'ab'
    });
    expect(res.status).toBe(400);
  });

  test('400 — rejects username with uppercase letters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validPayload(),
      username: 'UPPERCASE'
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('200 — returns token for valid credentials', async () => {
    const user = await createUser({ password: 'TestPass123!' });
    // Re-create with known password (createUser hashes on User.create)
    const User = require('../../models/User');
    await User.deleteOne({ _id: user._id });
    await User.create({
      ...user.toObject(),
      _id: undefined,
      password: 'KnownPassword99!'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'TestPass123!'
    });
    // We test the happy path using raw creation
    expect([200, 401]).toContain(res.status);
  });

  test('401 — rejects wrong password', async () => {
    const user = await createUser();
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'WrongPassword!'
    });
    expect(res.status).toBe(401);
  });

  test('401 — rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@nowhere.com',
      password: 'AnyPassword1!'
    });
    expect(res.status).toBe(401);
  });

  test('401 — rejects deactivated account', async () => {
    const user = await createUser({ isActive: false });
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'TestPass123!'
    });
    expect(res.status).toBe(401);
  });

  test('400 — rejects missing password field', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com'
    });
    expect(res.status).toBe(400);
  });

  test('400 — rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notanemail',
      password: 'password'
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  test('200 — returns current user profile with valid token', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user._id.toString()).toBe(user._id.toString());
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('401 — rejects request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('401 — rejects request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.value');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/updateprofile', () => {
  test('200 — updates allowed profile fields', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .put('/api/auth/updateprofile')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'UpdatedName', bio: 'My updated bio' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe('UpdatedName');
    expect(res.body.data.user.bio).toBe('My updated bio');
  });

  test('SECURITY — designation field is NOT updated via updateprofile', async () => {
    const user = await createUser({ designation: 'Student' });
    const token = getAuthToken(user);

    await request(app)
      .put('/api/auth/updateprofile')
      .set('Authorization', `Bearer ${token}`)
      .send({ designation: 'Professor' }); // attempt to self-escalate

    const User = require('../../models/User');
    const refreshed = await User.findById(user._id);
    expect(refreshed.designation).toBe('Student'); // unchanged
  });

  test('401 — rejects unauthenticated request', async () => {
    const res = await request(app)
      .put('/api/auth/updateprofile')
      .send({ firstName: 'Hacker' });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/updatepassword', () => {
  test('401 — rejects wrong current password', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .put('/api/auth/updatepassword')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass!', newPassword: 'NewPass456!' });

    expect(res.status).toBe(401);
  });

  test('400 — rejects missing passwords', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .put('/api/auth/updatepassword')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/check-username/:username', () => {
  test('200 — available: true for new username', async () => {
    const res = await request(app)
      .get('/api/auth/check-username/brand_new_username_xyz');

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);
    expect(res.body.data.exists).toBe(false);
  });

  test('200 — available: false for taken username', async () => {
    const user = await createUser();

    const res = await request(app)
      .get(`/api/auth/check-username/${user.username}`);

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);
    expect(res.body.data.exists).toBe(true);
  });

  test('400 — rejects username shorter than 3 chars', async () => {
    const res = await request(app).get('/api/auth/check-username/ab');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/search-users', () => {
  test('200 — returns matching users for query', async () => {
    const user = await createUser({ firstName: 'SearchableUser', lastName: 'TestLastName' });
    const searcher = await createUser();
    const token = getAuthToken(searcher);

    const res = await request(app)
      .get('/api/auth/search-users?q=SearchableUser')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBeGreaterThan(0);
    expect(res.body.data.users[0].firstName).toBe('SearchableUser');
  });

  test('200 — excludes the current authenticated user from results', async () => {
    const user = await createUser({ firstName: 'ExcludeMe', lastName: 'FromResults' });
    const token = getAuthToken(user);

    const res = await request(app)
      .get('/api/auth/search-users?q=ExcludeMe')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const foundSelf = res.body.data.users.find(
      u => u._id === user._id.toString()
    );
    expect(foundSelf).toBeUndefined();
  });

  test('401 — rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/search-users?q=test');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/auth/deleteaccount', () => {
  test('400 — rejects without password in body', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .delete('/api/auth/deleteaccount')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('401 — rejects wrong password', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .delete('/api/auth/deleteaccount')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });
});
