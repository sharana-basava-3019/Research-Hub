const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let localMongod;

// Connect to the in-memory MongoDB before each test suite
beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    localMongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = localMongod.getUri();
    process.env.MONGO_URI = localMongod.getUri();
  }
  process.env.MONGO_URI = process.env.MONGODB_URI;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_research_hub_tests';
  process.env.NODE_ENV = 'test';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

// Clean all collections between test suites
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests in the suite
afterAll(async () => {
  await mongoose.disconnect();
  if (localMongod) {
    await localMongod.stop();
  }
});

/**
 * Factory: create a user directly in DB (bypasses HTTP)
 */
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

const createUser = async (overrides = {}) => {
  const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const defaults = {
    firstName: 'Test',
    lastName: 'User',
    email: `test_${uniqueSuffix}@example.com`,
    username: `u_${uniqueSuffix}`,
    password: 'TestPass123!',
    institution: 'Test University',
    department: 'Computer Science',
    designation: 'Researcher',
    role: 'user'
  };
  return await User.create({ ...defaults, ...overrides });
};

const createAdmin = async (overrides = {}) => {
  return await createUser({ role: 'admin', designation: 'Admin', ...overrides });
};

const createProfessor = async (overrides = {}) => {
  return await createUser({ designation: 'Professor', ...overrides });
};

/**
 * Generate JWT token for a user (mirrors generateAuthToken)
 */
const getAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Factory: create a project directly in DB
 */
const Project = require('../../models/Project');

const createProject = async (owner, overrides = {}) => {
  const defaults = {
    title: `Test Project ${Date.now()}`,
    description: 'A test project description for automated tests.',
    researchArea: 'Computer Science',
    owner: owner._id,
    isOpenForCollaboration: true,
    visibility: 'Public'
  };
  return await Project.create({ ...defaults, ...overrides });
};

/**
 * Factory: create a collaboration request directly in DB
 */
const Collaboration = require('../../models/Collaboration');

const createCollaboration = async (sender, receiver, project, overrides = {}) => {
  const defaults = {
    sender: sender._id,
    receiver: receiver._id,
    project: project._id,
    message: 'Please let me collaborate on your project.',
    proposedRole: 'Collaborator',
    collaborationType: 'request',
    status: 'Pending'
  };
  return await Collaboration.create({ ...defaults, ...overrides });
};

module.exports = {
  createUser,
  createAdmin,
  createProfessor,
  createProject,
  createCollaboration,
  getAuthToken
};
