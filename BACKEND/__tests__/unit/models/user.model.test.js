/**
 * Unit Tests — User Model
 * Tests: password hashing, comparePassword, generateAuthToken,
 *        getPublicProfile, findByUsername, usernameExists
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');

describe('User Model — Schema Validation', () => {
  test('creates a valid user successfully', async () => {
    const user = await User.create({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@test.com',
      username: 'alice.smith',
      password: 'Secret123!',
      institution: 'Test University'
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('alice.smith@test.com');
    expect(user.role).toBe('user');
    expect(user.designation).toBe('Student');
    expect(user.isActive).toBe(true);
  });

  test('requires firstName, lastName, email, password, institution', async () => {
    await expect(User.create({})).rejects.toThrow();
  });

  test('enforces unique email constraint', async () => {
    await User.create({
      firstName: 'A', lastName: 'B', email: 'dup@test.com',
      username: 'user_a', password: 'pass123', institution: 'Uni'
    });

    await expect(
      User.create({
        firstName: 'C', lastName: 'D', email: 'dup@test.com',
        username: 'user_b', password: 'pass123', institution: 'Uni'
      })
    ).rejects.toThrow();
  });

  test('enforces unique username constraint', async () => {
    await User.create({
      firstName: 'A', lastName: 'B', email: 'a@test.com',
      username: 'same_username', password: 'pass123', institution: 'Uni'
    });

    await expect(
      User.create({
        firstName: 'C', lastName: 'D', email: 'c@test.com',
        username: 'same_username', password: 'pass123', institution: 'Uni'
      })
    ).rejects.toThrow();
  });

  test('rejects username shorter than 3 characters', async () => {
    await expect(
      User.create({
        firstName: 'A', lastName: 'B', email: 'short@test.com',
        username: 'ab', password: 'pass123', institution: 'Uni'
      })
    ).rejects.toThrow();
  });

  test('automatically converts uppercase username to lowercase', async () => {
    const user = await User.create({
      firstName: 'A', lastName: 'B', email: 'upper_user@test.com',
      username: 'Alice123', password: 'pass123', institution: 'Uni'
    });
    expect(user.username).toBe('alice123');
  });

  test('rejects username with invalid characters (e.g. spaces or symbols)', async () => {
    await expect(
      User.create({
        firstName: 'A', lastName: 'B', email: 'invalid_char@test.com',
        username: 'alice!123', password: 'pass123', institution: 'Uni'
      })
    ).rejects.toThrow();
  });

  test('rejects invalid designation enum', async () => {
    await expect(
      User.create({
        firstName: 'A', lastName: 'B', email: 'desg@test.com',
        username: 'desg_user', password: 'pass123', institution: 'Uni',
        designation: 'SuperHero' // invalid
      })
    ).rejects.toThrow();
  });

  test('stores email in lowercase', async () => {
    const user = await User.create({
      firstName: 'A', lastName: 'B', email: 'UPPER@TEST.COM',
      username: 'upper_user', password: 'pass123', institution: 'Uni'
    });
    expect(user.email).toBe('upper@test.com');
  });

  test('has fullName virtual that concatenates first + last', async () => {
    const user = await User.create({
      firstName: 'Alice', lastName: 'Johnson', email: 'aj@test.com',
      username: 'alice.johnson', password: 'pass123', institution: 'Uni'
    });
    expect(user.fullName).toBe('Alice Johnson');
  });
});

describe('User Model — Password', () => {
  test('hashes the password before saving', async () => {
    const plainPassword = 'MySecret123!';
    const user = await User.create({
      firstName: 'Bob', lastName: 'Tester', email: 'bob@test.com',
      username: 'bob.tester', password: plainPassword, institution: 'Uni'
    });

    // Retrieve with password
    const dbUser = await User.findById(user._id).select('+password');
    expect(dbUser.password).not.toBe(plainPassword);
    expect(dbUser.password).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix
  });

  test('does NOT re-hash on non-password field update', async () => {
    const user = await User.create({
      firstName: 'Carol', lastName: 'Tester', email: 'carol@test.com',
      username: 'carol.tester', password: 'MySecret123!', institution: 'Uni'
    });
    const hash1 = (await User.findById(user._id).select('+password')).password;

    // Update a non-password field
    user.firstName = 'Caroline';
    await user.save();

    const hash2 = (await User.findById(user._id).select('+password')).password;
    expect(hash1).toBe(hash2); // hash unchanged
  });

  test('comparePassword returns true for correct password', async () => {
    const user = await User.create({
      firstName: 'Dan', lastName: 'Tester', email: 'dan@test.com',
      username: 'dan.tester', password: 'MySecret123!', institution: 'Uni'
    });
    const dbUser = await User.findById(user._id).select('+password');
    const isMatch = await dbUser.comparePassword('MySecret123!');
    expect(isMatch).toBe(true);
  });

  test('comparePassword returns false for wrong password', async () => {
    const user = await User.create({
      firstName: 'Eve', lastName: 'Tester', email: 'eve@test.com',
      username: 'eve.tester', password: 'MySecret123!', institution: 'Uni'
    });
    const dbUser = await User.findById(user._id).select('+password');
    const isMatch = await dbUser.comparePassword('WrongPassword!');
    expect(isMatch).toBe(false);
  });

  test('password field is NOT returned by default queries', async () => {
    const user = await User.create({
      firstName: 'Frank', lastName: 'Tester', email: 'frank@test.com',
      username: 'frank.tester', password: 'MySecret123!', institution: 'Uni'
    });
    const dbUser = await User.findById(user._id);
    expect(dbUser.password).toBeUndefined();
  });
});

describe('User Model — generateAuthToken()', () => {
  test('generates a valid JWT with id and role payload', async () => {
    const user = await User.create({
      firstName: 'Grace', lastName: 'Tester', email: 'grace@test.com',
      username: 'grace.tester', password: 'pass123', institution: 'Uni',
      role: 'user'
    });

    const token = user.generateAuthToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.id).toBe(user._id.toString());
    expect(decoded.role).toBe('user');
  });

  test('generates admin JWT for admin user', async () => {
    const user = await User.create({
      firstName: 'Harry', lastName: 'Admin', email: 'harry@test.com',
      username: 'harry.admin', password: 'pass123', institution: 'Uni',
      role: 'admin'
    });

    const token = user.generateAuthToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.role).toBe('admin');
  });
});

describe('User Model — getPublicProfile()', () => {
  test('returns user object without password field', async () => {
    const user = await User.create({
      firstName: 'Ivan', lastName: 'Tester', email: 'ivan@test.com',
      username: 'ivan.tester', password: 'pass123', institution: 'Uni'
    });
    const profile = user.getPublicProfile();
    expect(profile.password).toBeUndefined();
    expect(profile.firstName).toBe('Ivan');
    expect(profile.email).toBe('ivan@test.com');
  });
});

describe('User Model — Static Methods', () => {
  test('findByUsername returns user (case-insensitive)', async () => {
    await User.create({
      firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com',
      username: 'jane.doe', password: 'pass123', institution: 'Uni'
    });

    const found = await User.findByUsername('JANE.DOE');
    expect(found).not.toBeNull();
    expect(found.email).toBe('jane@test.com');
  });

  test('findByUsername returns null for non-existent username', async () => {
    const found = await User.findByUsername('nonexistent_xyz');
    expect(found).toBeNull();
  });

  test('usernameExists returns true for existing username', async () => {
    await User.create({
      firstName: 'Karl', lastName: 'Tester', email: 'karl@test.com',
      username: 'karl.tester', password: 'pass123', institution: 'Uni'
    });
    const exists = await User.usernameExists('karl.tester');
    expect(exists).toBe(true);
  });

  test('usernameExists returns false for non-existent username', async () => {
    const exists = await User.usernameExists('nobody_xyz_000');
    expect(exists).toBe(false);
  });
});
