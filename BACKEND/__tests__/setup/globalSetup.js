/**
 * Global setup — start in-memory MongoDB before all tests
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_jwt_secret_for_research_hub_tests';
  process.env.JWT_EXPIRE = '1h';
  process.env.NODE_ENV = 'test';
  global.__MONGOD__ = mongod;
};
