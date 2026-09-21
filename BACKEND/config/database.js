/**
 * MongoDB Database Configuration
 * Handles connection to MongoDB using Mongoose with retry logic
 */

const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retryCount = 0) => {
  // Always force 127.0.0.1 — Node 17+ resolves 'localhost' to IPv6 ::1
  // but MongoDB typically only listens on IPv4 127.0.0.1
  const mongoURI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/research-hub')
    .replace('//localhost', '//127.0.0.1');

  try {
    const conn = await mongoose.connect(mongoURI, {
      family: 4,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    global.DATABASE_AVAILABLE = true;

  } catch (error) {
    console.error(`❌ MongoDB Connection Error (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // exponential backoff
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    // After all retries exhausted:
    if (process.env.NODE_ENV === 'production') {
      console.error('💀 Could not connect to MongoDB after all retries. Exiting.');
      process.exit(1);
    } else {
      console.error('⚠️  Could not connect to MongoDB after all retries. Running WITHOUT database.');
      console.error('    Make sure MongoDB is running: net start MongoDB');
      global.DATABASE_AVAILABLE = false;
    }
  }
};

// ── Connection event logging ────────────────────────────────────────────────

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to database');
  global.DATABASE_AVAILABLE = true;
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected from database');
  global.DATABASE_AVAILABLE = false;
  // Auto-reconnect in development after a brief pause
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Attempting automatic reconnect in 5s...');
    setTimeout(() => connectDB(), 5000);
  }
});

// ── Graceful shutdown ───────────────────────────────────────────────────────

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing MongoDB connection...`);
  await mongoose.connection.close();
  console.log('✅ Mongoose connection closed. Exiting.');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;
