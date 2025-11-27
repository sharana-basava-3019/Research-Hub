/**
 * Database Seeder
 * Populates database with sample data for testing and demo
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Project = require('../models/Project');
const Collaboration = require('../models/Collaboration');
const Comment = require('../models/Comment');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample Users
const users = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@university.edu',
    password: 'password123',
    institution: 'Stanford University',
    department: 'Computer Science',
    designation: 'Professor',
    researchInterests: ['Machine Learning', 'Artificial Intelligence', 'Data Mining'],
    bio: 'Research focuses on machine learning algorithms and applications.',
    role: 'admin'
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@university.edu',
    password: 'password123',
    institution: 'MIT',
    department: 'Electrical Engineering',
    designation: 'Associate Professor',
    researchInterests: ['IoT', 'Embedded Systems', 'Robotics'],
    bio: 'Specializing in Internet of Things and embedded systems design.'
  },
  {
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol@university.edu',
    password: 'password123',
    institution: 'Harvard University',
    department: 'Biomedical Engineering',
    designation: 'PhD Student',
    researchInterests: ['Medical Imaging', 'Signal Processing', 'Healthcare'],
    bio: 'PhD candidate researching medical imaging techniques.'
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david@university.edu',
    password: 'password123',
    institution: 'UC Berkeley',
    department: 'Data Science',
    designation: 'Postdoc',
    researchInterests: ['Natural Language Processing', 'Deep Learning', 'Text Analytics'],
    bio: 'Postdoctoral researcher in NLP and deep learning.'
  },
  {
    firstName: 'Emma',
    lastName: 'Martinez',
    email: 'emma@university.edu',
    password: 'password123',
    institution: 'Carnegie Mellon University',
    department: 'Cybersecurity',
    designation: 'Assistant Professor',
    researchInterests: ['Network Security', 'Cryptography', 'Privacy'],
    bio: 'Researching cybersecurity and privacy-preserving technologies.'
  }
];

// Sample Projects
const createProjects = (userIds) => [
  {
    title: 'Deep Learning for Medical Diagnosis',
    description: 'Developing advanced deep learning models for automated medical diagnosis using X-ray and MRI images. This project aims to improve diagnostic accuracy and reduce healthcare costs.',
    abstract: 'Application of convolutional neural networks for medical image analysis.',
    owner: userIds[0],
    researchArea: 'Artificial Intelligence',
    keywords: ['Deep Learning', 'Medical Imaging', 'CNN', 'Healthcare', 'Diagnosis'],
    methodology: 'CNN-based image classification with transfer learning',
    status: 'In Progress',
    visibility: 'Public',
    isOpenForCollaboration: true,
    requiredSkills: ['Python', 'TensorFlow', 'Medical Imaging'],
    tags: ['AI', 'Healthcare', 'Machine Learning']
  },
  {
    title: 'Smart Home IoT Security Framework',
    description: 'Building a comprehensive security framework for smart home IoT devices. Focus on preventing unauthorized access and ensuring data privacy.',
    owner: userIds[1],
    researchArea: 'Internet of Things',
    keywords: ['IoT', 'Security', 'Smart Home', 'Privacy', 'Encryption'],
    methodology: 'Implementation of lightweight encryption protocols',
    status: 'Planning',
    visibility: 'Public',
    isOpenForCollaboration: true,
    requiredSkills: ['IoT', 'Cryptography', 'Embedded Systems'],
    tags: ['IoT', 'Security', 'Smart Home']
  },
  {
    title: 'Natural Language Understanding for Customer Service',
    description: 'Developing NLP models to improve automated customer service systems. Using transformers and BERT for intent classification and response generation.',
    owner: userIds[3],
    researchArea: 'Natural Language Processing',
    keywords: ['NLP', 'BERT', 'Chatbots', 'Transformers', 'Customer Service'],
    methodology: 'Fine-tuning pre-trained language models',
    status: 'In Progress',
    visibility: 'Public',
    isOpenForCollaboration: true,
    requiredSkills: ['Python', 'PyTorch', 'NLP', 'BERT'],
    tags: ['NLP', 'AI', 'Chatbots']
  },
  {
    title: 'Blockchain for Supply Chain Management',
    description: 'Implementing blockchain technology to enhance transparency and traceability in supply chain management systems.',
    owner: userIds[4],
    researchArea: 'Blockchain',
    keywords: ['Blockchain', 'Supply Chain', 'Smart Contracts', 'Ethereum', 'Traceability'],
    methodology: 'Ethereum-based smart contract development',
    status: 'Completed',
    visibility: 'Public',
    isOpenForCollaboration: false,
    tags: ['Blockchain', 'Supply Chain']
  },
  {
    title: 'Federated Learning for Privacy-Preserving ML',
    description: 'Research on federated learning techniques that enable machine learning on distributed data while preserving privacy.',
    owner: userIds[0],
    researchArea: 'Machine Learning',
    keywords: ['Federated Learning', 'Privacy', 'Distributed ML', 'Differential Privacy'],
    methodology: 'Privacy-preserving distributed optimization',
    status: 'In Progress',
    visibility: 'Public',
    isOpenForCollaboration: true,
    requiredSkills: ['Machine Learning', 'Python', 'Privacy Technologies'],
    tags: ['ML', 'Privacy', 'Federated Learning']
  }
];

// Seed function
const seedData = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany();
    await Project.deleteMany();
    await Collaboration.deleteMany();
    await Comment.deleteMany();
    console.log('✅ Existing data cleared');

    // Create users
    console.log('\n👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Extract user IDs
    const userIds = createdUsers.map(user => user._id);

    // Create projects
    console.log('\n📊 Creating projects...');
    const projects = createProjects(userIds);
    const createdProjects = await Project.create(projects);
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Add collaborators to some projects
    console.log('\n🤝 Adding collaborators...');
    createdProjects[0].collaborators.push({
      user: userIds[2],
      role: 'Co-Investigator'
    });
    await createdProjects[0].save();

    createdProjects[2].collaborators.push({
      user: userIds[0],
      role: 'Contributor'
    });
    await createdProjects[2].save();
    console.log('✅ Collaborators added');

    // Create sample collaborations
    console.log('\n📨 Creating collaboration requests...');
    const collaborations = [
      {
        sender: userIds[1],
        receiver: userIds[0],
        project: createdProjects[1]._id,
        message: 'Would love to collaborate on IoT security. I have expertise in machine learning that could complement this project.',
        proposedRole: 'Co-Investigator',
        status: 'Pending'
      },
      {
        sender: userIds[4],
        receiver: userIds[3],
        project: createdProjects[2]._id,
        message: 'Interested in contributing to the NLP project. I can help with security aspects.',
        proposedRole: 'Contributor',
        status: 'Accepted'
      }
    ];
    await Collaboration.create(collaborations);
    console.log(`✅ Created ${collaborations.length} collaboration requests`);

    // Create sample comments
    console.log('\n💬 Creating comments...');
    const comments = [
      {
        text: 'Great project! Looking forward to seeing the results.',
        author: userIds[1],
        project: createdProjects[0]._id
      },
      {
        text: 'Have you considered using ResNet architecture for this?',
        author: userIds[3],
        project: createdProjects[0]._id
      },
      {
        text: 'This approach to IoT security is very innovative!',
        author: userIds[4],
        project: createdProjects[1]._id
      }
    ];
    await Comment.create(comments);
    console.log(`✅ Created ${comments.length} comments`);

    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database seeded successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Projects: ${createdProjects.length}`);
    console.log(`   Collaborations: ${collaborations.length}`);
    console.log(`   Comments: ${comments.length}`);
    console.log('\n👤 Sample Login Credentials:');
    console.log('   Email: alice@university.edu');
    console.log('   Password: password123');
    console.log('   Role: Admin');
    console.log('\n' + '='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();
