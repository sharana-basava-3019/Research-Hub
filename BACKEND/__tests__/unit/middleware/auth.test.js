/**
 * Unit Tests — Auth Middleware
 * Tests: protect, authorize, optionalAuth
 */

const jwt = require('jsonwebtoken');
const { createUser, createAdmin, getAuthToken } = require('../../../__tests__/setup/testSetup');

// We test the middleware in isolation by mocking req/res/next
const authMiddleware = require('../../../middleware/auth');

// ─── Helper: build mock req/res/next ───────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();

// ─── protect() ─────────────────────────────────────────────────────────────
describe('Middleware: protect()', () => {
  test('returns 401 when no Authorization header is provided', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic sometoken' } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { id: 'fakeId', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when token is signed with wrong secret', async () => {
    const badToken = jwt.sign({ id: 'fakeId', role: 'user' }, 'wrong_secret');
    const req = { headers: { authorization: `Bearer ${badToken}` } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when user does not exist in database', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // valid ObjectId, non-existent
    const token = jwt.sign(
      { id: fakeId, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when user account is deactivated', async () => {
    const user = await createUser({ isActive: false });
    const token = getAuthToken(user);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    );
  });

  test('calls next() and attaches user to req for valid active user', async () => {
    const user = await createUser();
    const token = getAuthToken(user);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
    expect(req.user.password).toBeUndefined(); // password is excluded
  });
});

// ─── authorize() ───────────────────────────────────────────────────────────
describe('Middleware: authorize()', () => {
  const makeReq = (role, designation) => ({ user: { role, designation } });

  test('allows access when role matches', () => {
    const req = makeReq('admin', 'Admin');
    const res = mockRes();
    const next = mockNext();

    authMiddleware.authorize('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when role does not match', () => {
    const req = makeReq('user', 'Researcher');
    const res = mockRes();
    const next = mockNext();

    authMiddleware.authorize('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows access when designation matches', () => {
    const req = makeReq('user', 'Professor');
    const res = mockRes();
    const next = mockNext();

    authMiddleware.authorize('Professor')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('faculty wildcard allows Professor designation', () => {
    const req = makeReq('user', 'Professor');
    const res = mockRes();
    const next = mockNext();

    authMiddleware.authorize('faculty')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('faculty wildcard also allows Researcher designation (documented behavior)', () => {
    // NOTE: Bug #2 in implementation plan — Researchers can access faculty routes.
    // This test documents the CURRENT behavior. If this is intentional, keep it.
    // If it should be Professors-only, this test should be updated after fix.
    const req = makeReq('user', 'Researcher');
    const res = mockRes();
    const next = mockNext();

    authMiddleware.authorize('faculty')(req, res, next);
    expect(next).toHaveBeenCalled(); // Current behavior: Researcher is "faculty"
  });

  test('Student designation is denied faculty access', () => {
    const req = makeReq('user', 'Student');
    const res = mockRes();
    const next = mockNext();

    authMiddleware.authorize('faculty')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─── optionalAuth() ────────────────────────────────────────────────────────
describe('Middleware: optionalAuth()', () => {
  test('calls next() without attaching user when no token is present', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('attaches user to req when valid token is present', async () => {
    const user = await createUser();
    const token = getAuthToken(user);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  test('still calls next() when token is invalid (does not throw)', async () => {
    const req = { headers: { authorization: 'Bearer invalid_token_value' } };
    const res = mockRes();
    const next = mockNext();

    await authMiddleware.optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeNull();
  });
});
