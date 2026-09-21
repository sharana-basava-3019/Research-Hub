const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Event = require('../models/Event');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Find an admin user to be the organizer
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('❌ No admin user found');
      process.exit(1);
    }
    
    console.log(`📋 Using ${adminUser.firstName} ${adminUser.lastName} as event organizer\n`);
    
    // Create a new Competition event
    const competitionEvent = await Event.create({
      title: 'Annual Research Innovation Challenge 2025',
      description: 'Showcase your groundbreaking research ideas and compete for funding opportunities. Teams will present innovative research proposals across various disciplines including AI, biotechnology, renewable energy, and social sciences. Winners receive research grants and mentorship opportunities.',
      category: 'Competition',
      startDate: new Date('2025-12-20T09:00:00'),
      endDate: new Date('2025-12-20T18:00:00'),
      location: {
        type: 'Physical',
        venue: 'Innovation Center Auditorium',
        address: 'Research Complex, Block A',
        city: 'University Campus',
        country: 'USA'
      },
      organizer: adminUser._id,
      capacity: 100,
      registrationDeadline: new Date('2025-12-15T23:59:59'),
      status: 'Published',
      topics: ['Innovation', 'Research Proposals', 'Pitch Competition', 'Funding'],
      tags: ['Competition', 'Innovation', 'Research', 'Grants', 'Entrepreneurship']
    });
    
    console.log('✅ Successfully added Competition event!\n');
    console.log('📊 Event Details:');
    console.log(`   Title: ${competitionEvent.title}`);
    console.log(`   Category: ${competitionEvent.category}`);
    console.log(`   Date: ${competitionEvent.startDate.toLocaleDateString()}`);
    console.log(`   Location: ${competitionEvent.location.venue}`);
    console.log(`   Capacity: ${competitionEvent.capacity}`);
    console.log('');
    
    // Display all events summary
    const allEvents = await Event.find({}).sort('startDate');
    console.log(`📊 Total Events: ${allEvents.length}\n`);
    
    const categories = {};
    allEvents.forEach(event => {
      if (!categories[event.category]) {
        categories[event.category] = 0;
      }
      categories[event.category]++;
    });
    
    console.log('📈 Events by Category:');
    Object.keys(categories).sort().forEach(cat => {
      console.log(`   ${cat}: ${categories[cat]} events`);
    });
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
