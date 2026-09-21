/**
 * Integration Tests — Admin User Routes (/api/users/*)
 * Tests RBAC enforcement and admin CRUD operations.
 * Also tests the SECURITY FIX for privilege escalation in PUT /api/users/:id.
 */

const request = require('supertest');
require('../setup/testSetup');
const { createUser, createAdmin, getAuthToken } = require('../setup/testSetup');
const app = require('../../server');
const User = require('../../models/User');

// ─── GET /api/users ────────────────────────────────────────────────────────
describe('GET /api/users', () => {
  test('200 — admin can list all users', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);
    await createUser();
    await createUser();

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(2);
  });

  test('403 — non-admin user is forbidden', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('401 — unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('200 — supports pagination (page, limit)', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);

    const res = await request(app)
      .get('/api/users?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.data.users.length).toBeLessThanOrEqual(5);
  });
});

// ─── POST /api/users ───────────────────────────────────────────────────────
describe('POST /api/users (Admin creates user)', () => {
  const newUserPayload = () => ({
    firstName: 'Admin',
    lastName: 'Created',
    email: `admin_created_${Date.now()}@test.com`,
    password: 'Secret123!',
    institution: 'Admin University'
  });

  test('201 — admin can create a new user', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(newUserPayload());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('201 — auto-generates username when not provided', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(newUserPayload());

    expect(res.status).toBe(201);
    expect(res.body.data.user.username).toBeDefined();
  });

  test('400 — rejects duplicate email', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);
    const payload = newUserPayload();

    await request(app).post('/api/users').set('Authorization', `Bearer ${token}`).send(payload);
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`).send(payload);

    expect(res.status).toBe(400);
  });

  test('400 — rejects missing required fields', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Only' });

    expect(res.status).toBe(400);
  });

  test('403 — non-admin cannot create users', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(newUserPayload());

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/users/:id ────────────────────────────────────────────────────
describe('GET /api/users/:id', () => {
  test('200 — admin can get a single user by ID', async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const token = getAuthToken(admin);

    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user._id.toString()).toBe(user._id.toString());
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('404 — returns 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('403 — non-admin cannot get user details', async () => {
    const user = await createUser();
    const target = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .get(`/api/users/${target._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/users/:id ────────────────────────────────────────────────────
describe('PUT /api/users/:id', () => {
  test('200 — admin can update user fields', async () => {
    const admin = await createAdmin();
    const user = await createUser({ designation: 'Student' });
    const token = getAuthToken(admin);

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ designation: 'Researcher', firstName: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.designation).toBe('Researcher');
    expect(res.body.data.user.firstName).toBe('Updated');
  });

  test('SECURITY — cannot change role via PUT body (privilege escalation fix)', async () => {
    const admin = await createAdmin();
    const user = await createUser({ role: 'user' });
    const token = getAuthToken(admin);

    await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' }); // attacker tries to escalate

    const refreshed = await User.findById(user._id);
    expect(refreshed.role).toBe('user'); // must remain unchanged after fix
  });

  test('SECURITY — cannot change password via PUT body', async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const token = getAuthToken(admin);
    const originalHash = (await User.findById(user._id).select('+password')).password;

    await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewHackedPassword!' });

    const refreshedHash = (await User.findById(user._id).select('+password')).password;
    expect(refreshedHash).toBe(originalHash); // password unchanged
  });

  test('SECURITY — cannot change email via PUT body', async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const token = getAuthToken(admin);
    const originalEmail = user.email;

    await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'hacked@hacker.com' });

    const refreshed = await User.findById(user._id);
    expect(refreshed.email).toBe(originalEmail); // email unchanged
  });

  test('404 — returns 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .put(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Ghost' });

    expect(res.status).toBe(404);
  });

  test('403 — non-admin cannot update users', async () => {
    const user = await createUser();
    const target = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .put(`/api/users/${target._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/users/:id ─────────────────────────────────────────────────
describe('DELETE /api/users/:id', () => {
  test('200 — admin can delete a user', async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const token = getAuthToken(admin);

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const deleted = await User.findById(user._id);
    expect(deleted).toBeNull();
  });

  test('404 — returns 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = getAuthToken(admin);
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .delete(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('403 — non-admin cannot delete users', async () => {
    const user = await createUser();
    const target = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    const stillExists = await User.findById(target._id);
    expect(stillExists).not.toBeNull();
  });
});
