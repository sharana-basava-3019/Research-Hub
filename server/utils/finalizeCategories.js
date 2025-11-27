const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Event = require('../models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Update Exhibition -> Conference (since it's a research collaboration fair)
    await Event.updateOne(
      { title: 'Research Collaboration Fair 2025' },
      { $set: { category: 'Conference' } }
    );
    console.log('✅ Updated: Research Collaboration Fair 2025 -> Conference');
    
    // Display all events
    console.log('\n📊 Final Event Categories:\n');
    const events = await Event.find({});
    events.forEach((event, index) => {
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
