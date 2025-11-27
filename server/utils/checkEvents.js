const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Event = require('../models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const events = await Event.find({}).select('title status isPublic startDate');
    
    console.log(`📊 Found ${events.length} events:\n`);
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   isPublic: ${event.isPublic}`);
      console.log(`   Start Date: ${event.startDate}`);
      console.log('');
    });
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
