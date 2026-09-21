const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Event = require('../models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Check current event categories
    const events = await Event.find({});
    console.log('📊 Current Events:\n');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Category: ${event.category}`);
    });
    
    console.log('\n🔄 Updating event categories...\n');
    
    // Update Symposium -> Conference
    await Event.updateOne(
      { title: 'AI & Machine Learning Symposium 2025' },
      { $set: { category: 'Conference' } }
    );
    console.log('✅ Updated: AI & Machine Learning Symposium 2025 -> Conference');
    
    // Update Seminar -> Workshop
    await Event.updateOne(
      { title: 'Research Methodology Seminar Series' },
      { $set: { category: 'Workshop' } }
    );
    console.log('✅ Updated: Research Methodology Seminar Series -> Workshop');
    
    // Update Training -> Workshop
    await Event.updateOne(
      { title: 'Data Science Bootcamp: Advanced Analytics' },
      { $set: { category: 'Workshop' } }
    );
    console.log('✅ Updated: Data Science Bootcamp -> Workshop');
    
    // Display updated events
    console.log('\n📊 Updated Events:\n');
    const updatedEvents = await Event.find({});
    updatedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Category: ${event.category}`);
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
