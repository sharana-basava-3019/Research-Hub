/**
 * Script to add sample events to the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

const sampleEvents = [
  // Upcoming Events
  {
    title: "AI & Machine Learning Symposium 2025",
    description: "Join us for a comprehensive symposium on the latest advances in Artificial Intelligence and Machine Learning. Leading researchers will present their groundbreaking work on deep learning, neural networks, and AI ethics. This event features keynote speakers from top tech companies and academic institutions.",
    category: "Symposium",
    startDate: new Date('2025-12-15T09:00:00'),
    endDate: new Date('2025-12-15T17:00:00'),
    location: {
      type: "Physical",
      venue: "Main Auditorium",
      address: "Tech Building, 3rd Floor",
      city: "University Campus",
      country: "USA"
    },
    organizer: null, // Will be set to first admin user
    capacity: 200,
    registrationDeadline: new Date('2025-12-10T23:59:59'),
    tags: ["AI", "Machine Learning", "Research", "Technology"],
    topics: ["Deep Learning", "Neural Networks", "AI Ethics"],
    status: "Published"
  },
  {
    title: "Virtual Workshop: Introduction to Quantum Computing",
    description: "An introductory workshop designed for researchers interested in quantum computing. Learn about qubits, quantum gates, and quantum algorithms. Hands-on sessions will guide you through using quantum simulators and programming quantum circuits using Qiskit.",
    category: "Workshop",
    startDate: new Date('2025-11-25T14:00:00'),
    endDate: new Date('2025-11-25T18:00:00'),
    location: {
      type: "Virtual",
      virtualLink: "https://zoom.us/j/quantum-workshop-2025"
    },
    organizer: null,
    capacity: 50,
    registrationDeadline: new Date('2025-11-23T23:59:59'),
    tags: ["Quantum Computing", "Workshop", "Virtual", "Physics"],
    topics: ["Qubits", "Quantum Gates", "Quantum Algorithms", "Qiskit"],
    status: "Published"
  },
  {
    title: "Research Collaboration Fair 2025",
    description: "Network with fellow researchers and explore collaboration opportunities across different departments and institutions. Present your research projects, discover potential partners, and build interdisciplinary research teams. Refreshments will be provided.",
    category: "Exhibition",
    startDate: new Date('2025-12-01T10:00:00'),
    endDate: new Date('2025-12-01T16:00:00'),
    location: {
      type: "Physical",
      venue: "University Center, Hall C",
      address: "Main Campus",
      city: "University Campus",
      country: "USA"
    },
    organizer: null,
    capacity: 150,
    registrationDeadline: new Date('2025-11-28T23:59:59'),
    tags: ["Networking", "Collaboration", "Research", "Interdisciplinary"],
    topics: ["Research Collaboration", "Networking", "Interdisciplinary Research"],
    status: "Published"
  },
  {
    title: "Data Science Bootcamp: Advanced Analytics",
    description: "Intensive 2-day bootcamp covering advanced data analytics, statistical modeling, and big data processing. Topics include Python for data science, pandas, scikit-learn, and real-world case studies. Participants will work on hands-on projects throughout the bootcamp.",
    category: "Training",
    startDate: new Date('2025-11-30T09:00:00'),
    endDate: new Date('2025-12-01T17:00:00'),
    location: {
      type: "Physical",
      venue: "Computer Science Lab 301",
      address: "Engineering Building",
      city: "University Campus",
      country: "USA"
    },
    organizer: null,
    capacity: 40,
    registrationDeadline: new Date('2025-11-27T23:59:59'),
    tags: ["Data Science", "Python", "Analytics", "Big Data"],
    topics: ["Python", "Pandas", "Scikit-learn", "Statistical Modeling"],
    status: "Published"
  },

  // Past Events
  {
    title: "Annual Research Conference 2024",
    description: "The 2024 Annual Research Conference brought together over 300 researchers from around the world. Featured presentations on cutting-edge research in biotechnology, computer science, and environmental studies. The event included poster sessions, panel discussions, and networking opportunities.",
    category: "Conference",
    startDate: new Date('2024-10-20T08:00:00'),
    endDate: new Date('2024-10-22T18:00:00'),
    location: {
      type: "Physical",
      venue: "International Convention Center",
      address: "Downtown Convention Center",
      city: "University City",
      country: "USA"
    },
    organizer: null,
    capacity: 300,
    registrationDeadline: new Date('2024-10-15T23:59:59'),
    tags: ["Research", "Conference", "Biotechnology", "Computer Science"],
    topics: ["Biotechnology", "Computer Science", "Environmental Studies"],
    status: "Completed"
  },
  {
    title: "Cybersecurity Essentials Workshop",
    description: "A comprehensive workshop on cybersecurity fundamentals covering network security, encryption, threat detection, and incident response. Participants learned about common vulnerabilities and best practices for securing research data and systems.",
    category: "Workshop",
    startDate: new Date('2024-09-15T13:00:00'),
    endDate: new Date('2024-09-15T17:00:00'),
    location: {
      type: "Physical",
      venue: "Engineering Building, Room 205",
      address: "Engineering Complex",
      city: "University Campus",
      country: "USA"
    },
    organizer: null,
    capacity: 60,
    registrationDeadline: new Date('2024-09-12T23:59:59'),
    tags: ["Cybersecurity", "Workshop", "Security", "Technology"],
    topics: ["Network Security", "Encryption", "Threat Detection"],
    status: "Completed"
  },
  {
    title: "Research Methodology Seminar Series",
    description: "A series of seminars focusing on research design, methodology, and academic writing. Covered topics included qualitative and quantitative research methods, statistical analysis, literature review techniques, and publishing in peer-reviewed journals.",
    category: "Seminar",
    startDate: new Date('2024-08-10T10:00:00'),
    endDate: new Date('2024-08-10T15:00:00'),
    location: {
      type: "Physical",
      venue: "Graduate Research Center",
      address: "Research Building",
      city: "University Campus",
      country: "USA"
    },
    organizer: null,
    capacity: 80,
    registrationDeadline: new Date('2024-08-05T23:59:59'),
    tags: ["Research Methods", "Academic Writing", "Seminar", "Graduate Studies"],
    topics: ["Research Design", "Statistical Analysis", "Academic Publishing"],
    status: "Completed"
  },
  {
    title: "Climate Change and Sustainability Summit",
    description: "Virtual summit addressing the urgent challenges of climate change and sustainability. Featured renowned climate scientists, policy makers, and environmental researchers. Discussions covered renewable energy, carbon reduction strategies, and sustainable development goals.",
    category: "Conference",
    startDate: new Date('2024-07-05T09:00:00'),
    endDate: new Date('2024-07-05T16:00:00'),
    location: {
      type: "Virtual",
      virtualLink: "https://zoom.us/j/climate-summit-2024"
    },
    organizer: null,
    capacity: 500,
    registrationDeadline: new Date('2024-07-01T23:59:59'),
    tags: ["Climate Change", "Sustainability", "Environment", "Virtual"],
    topics: ["Renewable Energy", "Carbon Reduction", "Sustainable Development"],
    status: "Completed"
  }
];

const addEvents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Find the first admin user to set as organizer
    const User = require('../models/User');
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`📋 Using ${adminUser.firstName} ${adminUser.lastName} as event organizer`);

    // Clear existing events (optional - comment out if you want to keep existing events)
    // await Event.deleteMany({});
    // console.log('🗑️  Cleared existing events');

    // Set organizer for all events
    const eventsWithOrganizer = sampleEvents.map(event => ({
      ...event,
      organizer: adminUser._id
    }));

    // Insert events
    const createdEvents = await Event.insertMany(eventsWithOrganizer);

    console.log(`\n✅ Successfully added ${createdEvents.length} events to the database!\n`);

    // Display summary
    console.log('📊 Events Summary:');
    console.log('─────────────────────────────────────────────────────');
    
    const upcomingEvents = createdEvents.filter(e => e.status === 'Published');
    const pastEvents = createdEvents.filter(e => e.status === 'Completed');

    console.log(`\n🔜 Upcoming Events (${upcomingEvents.length}):`);
    upcomingEvents.forEach(event => {
      console.log(`   • ${event.title} (${event.category}) - ${event.startDate.toLocaleDateString()}`);
    });

    console.log(`\n✅ Past Events (${pastEvents.length}):`);
    pastEvents.forEach(event => {
      console.log(`   • ${event.title} (${event.category}) - ${event.startDate.toLocaleDateString()}`);
    });

    console.log('\n─────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error adding events:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
addEvents();
