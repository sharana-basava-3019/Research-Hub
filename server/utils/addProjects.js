const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Project = require('../models/Project');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Find users to be project owners
    const users = await User.find({}).limit(3);
    
    if (users.length === 0) {
      console.error('❌ No users found in database');
      process.exit(1);
    }
    
    console.log(`📋 Found ${users.length} users\n`);
    
    // Sample projects data
    const projectsData = [
      {
        title: 'AI-Powered Medical Diagnosis System',
        description: 'Developing a machine learning system to assist doctors in diagnosing diseases using medical imaging and patient data. The project leverages deep learning algorithms to analyze X-rays, MRIs, and CT scans with high accuracy.',
        category: 'Artificial Intelligence',
        researchArea: 'Artificial Intelligence',
        status: 'In Progress',
        visibility: 'Public',
        owner: users[0]._id,
        team: [users[1]._id],
        tags: ['AI', 'Healthcare', 'Deep Learning', 'Medical Imaging'],
        keywords: ['AI', 'Healthcare', 'Deep Learning', 'Medical Imaging', 'CNN', 'Diagnosis'],
        objectives: [
          'Develop CNN models for medical image analysis',
          'Achieve 95% accuracy in disease detection',
          'Create user-friendly interface for doctors',
          'Validate with real-world clinical data'
        ],
        methodology: 'We are using convolutional neural networks (CNNs) trained on large datasets of medical images. Transfer learning techniques are applied using pre-trained models like ResNet and VGG.',
        expectedOutcomes: 'A working prototype that can accurately diagnose common diseases from medical images, reducing diagnosis time by 40%.',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-12-31'),
        fundingAmount: 150000,
        fundingSource: 'National Health Research Grant'
      },
      {
        title: 'Sustainable Urban Agriculture Solutions',
        description: 'Research project focused on developing sustainable vertical farming techniques for urban environments. Investigating hydroponic and aeroponic systems to maximize crop yield while minimizing water usage and environmental impact.',
        category: 'Environmental Science',
        researchArea: 'Environmental Science',
        status: 'In Progress',
        visibility: 'Public',
        owner: users[1]._id,
        team: [users[0]._id, users[2]._id],
        tags: ['Sustainability', 'Agriculture', 'Urban Farming', 'Hydroponics'],
        keywords: ['Sustainability', 'Agriculture', 'Urban Farming', 'Hydroponics', 'Vertical Farming'],
        objectives: [
          'Design efficient vertical farming systems',
          'Reduce water consumption by 70%',
          'Increase crop yield per square meter',
          'Assess economic viability for urban areas'
        ],
        methodology: 'Comparative analysis of different growing systems including hydroponics, aeroponics, and aquaponics. Testing various crop types and monitoring growth rates, resource consumption, and yield.',
        expectedOutcomes: 'Scalable urban farming model that can produce fresh vegetables year-round with minimal environmental footprint.',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2026-06-15'),
        fundingAmount: 200000,
        fundingSource: 'Environmental Research Foundation'
      },
      {
        title: 'Quantum Computing Algorithms for Cryptography',
        description: 'Exploring quantum algorithms for next-generation cryptographic systems. Focus on developing quantum-resistant encryption methods and investigating potential applications in blockchain technology and secure communications.',
        category: 'Computer Science',
        researchArea: 'Computer Science',
        status: 'In Progress',
        visibility: 'Public',
        owner: users[2]._id,
        team: [users[0]._id],
        tags: ['Quantum Computing', 'Cryptography', 'Security', 'Blockchain'],
        keywords: ['Quantum Computing', 'Cryptography', 'Security', 'Blockchain', 'Encryption'],
        objectives: [
          'Develop quantum-resistant encryption algorithms',
          'Test algorithms on quantum simulators',
          'Analyze security implications of quantum computing',
          'Create practical implementation guidelines'
        ],
        methodology: 'Using IBM Qiskit and other quantum computing frameworks to simulate quantum algorithms. Mathematical analysis of cryptographic strength against quantum attacks.',
        expectedOutcomes: 'New cryptographic protocols that remain secure in the quantum computing era, with published research papers and open-source implementations.',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-09-30'),
        fundingAmount: 180000,
        fundingSource: 'Department of Defense Research Grant'
      },
      {
        title: 'Smart Grid Optimization Using IoT',
        description: 'Implementing Internet of Things (IoT) sensors and smart meters to optimize energy distribution in electrical grids. Developing predictive algorithms to balance supply and demand, reduce energy waste, and integrate renewable energy sources.',
        category: 'Engineering',
        researchArea: 'Electrical Engineering',
        status: 'In Progress',
        visibility: 'Public',
        owner: users[0]._id,
        team: [users[1]._id, users[2]._id],
        tags: ['IoT', 'Smart Grid', 'Energy', 'Renewable Energy'],
        keywords: ['IoT', 'Smart Grid', 'Energy', 'Renewable Energy', 'Optimization'],
        objectives: [
          'Deploy IoT sensor network across test grid',
          'Develop real-time energy optimization algorithms',
          'Reduce energy waste by 30%',
          'Integrate solar and wind energy sources'
        ],
        methodology: 'Installing smart sensors at key grid points, collecting real-time data, and using machine learning to predict demand patterns and optimize distribution.',
        expectedOutcomes: 'Fully functional smart grid prototype demonstrating significant energy savings and improved integration of renewable sources.',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-12-31'),
        fundingAmount: 250000,
        fundingSource: 'Energy Innovation Fund'
      },
      {
        title: 'Neural Interface for Prosthetic Control',
        description: 'Developing brain-computer interface technology to control prosthetic limbs using neural signals. Creating advanced signal processing algorithms to interpret brain activity and translate it into precise prosthetic movements.',
        category: 'Biomedical Engineering',
        researchArea: 'Biomedical Engineering',
        status: 'Planning',
        visibility: 'Public',
        owner: users[1]._id,
        team: [users[2]._id],
        tags: ['BCI', 'Prosthetics', 'Neuroscience', 'Signal Processing'],
        keywords: ['BCI', 'Prosthetics', 'Neuroscience', 'Signal Processing', 'Brain-Computer Interface'],
        objectives: [
          'Design non-invasive neural interface',
          'Achieve 90% accuracy in movement prediction',
          'Reduce response latency to under 100ms',
          'Conduct clinical trials with amputees'
        ],
        methodology: 'Using EEG sensors to capture brain signals, applying machine learning algorithms to decode motor intent, and developing control systems for prosthetic devices.',
        expectedOutcomes: 'Advanced prosthetic control system that provides natural, intuitive control for users, improving quality of life for amputees.',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2027-01-15'),
        fundingAmount: 300000,
        fundingSource: 'Biomedical Research Institute'
      },
      {
        title: 'Climate Change Impact on Marine Ecosystems',
        description: 'Long-term study analyzing the effects of rising ocean temperatures and acidification on coral reefs and marine biodiversity. Using satellite data, underwater sensors, and field research to track ecosystem changes.',
        category: 'Marine Biology',
        researchArea: 'Marine Biology',
        status: 'In Progress',
        visibility: 'Public',
        owner: users[2]._id,
        team: [users[0]._id, users[1]._id],
        tags: ['Climate Change', 'Marine Biology', 'Coral Reefs', 'Oceanography'],
        keywords: ['Climate Change', 'Marine Biology', 'Coral Reefs', 'Oceanography', 'Biodiversity'],
        objectives: [
          'Monitor coral bleaching events in real-time',
          'Assess biodiversity changes over 3-year period',
          'Identify resilient coral species',
          'Develop conservation strategies'
        ],
        methodology: 'Combining satellite imagery analysis, underwater temperature and pH sensors, and regular field surveys. Using statistical models to predict future ecosystem changes.',
        expectedOutcomes: 'Comprehensive dataset on climate impacts, identification of conservation priorities, and actionable recommendations for marine protection policies.',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2027-03-01'),
        fundingAmount: 220000,
        fundingSource: 'Ocean Conservation Fund'
      }
    ];
    
    console.log('🔄 Creating projects...\n');
    
    // Create projects
    const createdProjects = await Project.insertMany(projectsData);
    
    console.log(`✅ Successfully created ${createdProjects.length} projects!\n`);
    
    // Display summary
    console.log('📊 Projects Summary:\n');
    createdProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   Category: ${project.category}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Owner: ${users.find(u => u._id.toString() === project.owner.toString())?.firstName} ${users.find(u => u._id.toString() === project.owner.toString())?.lastName}`);
      console.log(`   Funding: $${project.fundingAmount?.toLocaleString() || 'N/A'}`);
      console.log('');
    });
    
    // Count by category
    const categories = {};
    createdProjects.forEach(project => {
      categories[project.category] = (categories[project.category] || 0) + 1;
    });
    
    console.log('📈 Projects by Category:');
    Object.keys(categories).forEach(cat => {
      console.log(`   ${cat}: ${categories[cat]}`);
    });
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
