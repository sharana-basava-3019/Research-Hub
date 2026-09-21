/**
 * Global teardown — stop in-memory MongoDB after all tests
 */
module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
