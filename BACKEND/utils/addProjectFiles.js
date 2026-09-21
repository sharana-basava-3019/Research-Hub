const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Project = require('../models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Find all projects
    const projects = await Project.find({});
    
    console.log(`📋 Found ${projects.length} projects\n`);
    
    // Add attachments/files to specific projects
    const updates = [];
    
    // Update AI Medical Diagnosis project
    const aiProject = await Project.findOne({ title: /AI-Powered Medical Diagnosis/i });
    if (aiProject) {
      aiProject.attachments = [
        {
          filename: 'CNN_Model_Architecture.pdf',
          url: '/uploads/projects/ai-diagnosis/cnn_architecture.pdf',
          uploadedAt: new Date('2024-11-01')
        },
        {
          filename: 'Training_Dataset_Documentation.pdf',
          url: '/uploads/projects/ai-diagnosis/dataset_docs.pdf',
          uploadedAt: new Date('2024-10-15')
        },
        {
          filename: 'Model_Performance_Results.xlsx',
          url: '/uploads/projects/ai-diagnosis/performance_results.xlsx',
          uploadedAt: new Date('2024-11-10')
        },
        {
          filename: 'Research_Paper_Draft.docx',
          url: '/uploads/projects/ai-diagnosis/research_paper.docx',
          uploadedAt: new Date('2024-11-15')
        },
        {
          filename: 'Source_Code.zip',
          url: '/uploads/projects/ai-diagnosis/source_code.zip',
          uploadedAt: new Date('2024-11-01')
        }
      ];
      aiProject.repository = 'https://github.com/research-hub/ai-medical-diagnosis';
      aiProject.documentation = 'https://docs.research-hub.edu/ai-diagnosis';
      await aiProject.save();
      updates.push('AI-Powered Medical Diagnosis System');
    }
    
    // Update Urban Agriculture project
    const agricultureProject = await Project.findOne({ title: /Sustainable Urban Agriculture/i });
    if (agricultureProject) {
      agricultureProject.attachments = [
        {
          filename: 'Vertical_Farming_Design_Plans.pdf',
          url: '/uploads/projects/urban-agriculture/design_plans.pdf',
          uploadedAt: new Date('2024-09-01')
        },
        {
          filename: 'Water_Consumption_Analysis.xlsx',
          url: '/uploads/projects/urban-agriculture/water_analysis.xlsx',
          uploadedAt: new Date('2024-10-20')
        },
        {
          filename: 'Crop_Yield_Data_Q3_2024.csv',
          url: '/uploads/projects/urban-agriculture/yield_data_q3.csv',
          uploadedAt: new Date('2024-10-30')
        },
        {
          filename: 'System_Comparison_Report.pdf',
          url: '/uploads/projects/urban-agriculture/comparison_report.pdf',
          uploadedAt: new Date('2024-11-05')
        },
        {
          filename: 'Economic_Viability_Study.pdf',
          url: '/uploads/projects/urban-agriculture/economic_study.pdf',
          uploadedAt: new Date('2024-11-12')
        },
        {
          filename: 'Setup_Photos.zip',
          url: '/uploads/projects/urban-agriculture/setup_photos.zip',
          uploadedAt: new Date('2024-08-15')
        }
      ];
      agricultureProject.documentation = 'https://docs.research-hub.edu/urban-agriculture';
      await agricultureProject.save();
      updates.push('Sustainable Urban Agriculture Solutions');
    }
    
    // Update Quantum Computing project
    const quantumProject = await Project.findOne({ title: /Quantum Computing/i });
    if (quantumProject) {
      quantumProject.attachments = [
        {
          filename: 'Quantum_Algorithm_Implementation.ipynb',
          url: '/uploads/projects/quantum-crypto/algorithm_notebook.ipynb',
          uploadedAt: new Date('2024-10-25')
        },
        {
          filename: 'Cryptographic_Analysis_Report.pdf',
          url: '/uploads/projects/quantum-crypto/crypto_analysis.pdf',
          uploadedAt: new Date('2024-11-08')
        },
        {
          filename: 'Simulation_Results.json',
          url: '/uploads/projects/quantum-crypto/simulation_results.json',
          uploadedAt: new Date('2024-11-10')
        },
        {
          filename: 'Security_Protocol_Specifications.pdf',
          url: '/uploads/projects/quantum-crypto/security_specs.pdf',
          uploadedAt: new Date('2024-11-14')
        },
        {
          filename: 'Qiskit_Implementation_Code.py',
          url: '/uploads/projects/quantum-crypto/qiskit_code.py',
          uploadedAt: new Date('2024-10-28')
        }
      ];
      quantumProject.repository = 'https://github.com/research-hub/quantum-cryptography';
      quantumProject.documentation = 'https://docs.research-hub.edu/quantum-crypto';
      quantumProject.publications = [
        {
          title: 'Quantum-Resistant Encryption Methods for Blockchain',
          url: 'https://arxiv.org/example/quantum-blockchain',
          publishedDate: new Date('2024-11-01')
        }
      ];
      await quantumProject.save();
      updates.push('Quantum Computing Algorithms for Cryptography');
    }
    
    // Update Smart Grid project
    const smartGridProject = await Project.findOne({ title: /Smart Grid/i });
    if (smartGridProject) {
      smartGridProject.attachments = [
        {
          filename: 'IoT_Sensor_Network_Diagram.pdf',
          url: '/uploads/projects/smart-grid/network_diagram.pdf',
          uploadedAt: new Date('2024-09-15')
        },
        {
          filename: 'Energy_Optimization_Algorithm.py',
          url: '/uploads/projects/smart-grid/optimization_algo.py',
          uploadedAt: new Date('2024-10-10')
        },
        {
          filename: 'Real_Time_Data_Dashboard.html',
          url: '/uploads/projects/smart-grid/dashboard.html',
          uploadedAt: new Date('2024-10-25')
        },
        {
          filename: 'Energy_Savings_Report_Oct2024.pdf',
          url: '/uploads/projects/smart-grid/savings_report_oct.pdf',
          uploadedAt: new Date('2024-11-01')
        },
        {
          filename: 'Solar_Integration_Data.csv',
          url: '/uploads/projects/smart-grid/solar_data.csv',
          uploadedAt: new Date('2024-11-05')
        },
        {
          filename: 'System_Architecture_Documentation.pdf',
          url: '/uploads/projects/smart-grid/architecture_docs.pdf',
          uploadedAt: new Date('2024-11-12')
        }
      ];
      smartGridProject.repository = 'https://github.com/research-hub/smart-grid-iot';
      smartGridProject.documentation = 'https://docs.research-hub.edu/smart-grid';
      await smartGridProject.save();
      updates.push('Smart Grid Optimization Using IoT');
    }
    
    // Update Neural Interface project (Planning - add proposal documents)
    const neuralProject = await Project.findOne({ title: /Neural Interface/i });
    if (neuralProject) {
      neuralProject.attachments = [
        {
          filename: 'Project_Proposal.pdf',
          url: '/uploads/projects/neural-interface/proposal.pdf',
          uploadedAt: new Date('2024-11-01')
        },
        {
          filename: 'Literature_Review.pdf',
          url: '/uploads/projects/neural-interface/literature_review.pdf',
          uploadedAt: new Date('2024-11-08')
        },
        {
          filename: 'Budget_Breakdown.xlsx',
          url: '/uploads/projects/neural-interface/budget.xlsx',
          uploadedAt: new Date('2024-11-10')
        },
        {
          filename: 'Timeline_Gantt_Chart.pdf',
          url: '/uploads/projects/neural-interface/timeline.pdf',
          uploadedAt: new Date('2024-11-12')
        }
      ];
      neuralProject.documentation = 'https://docs.research-hub.edu/neural-interface';
      await neuralProject.save();
      updates.push('Neural Interface for Prosthetic Control');
    }
    
    // Update Marine Biology project
    const marineProject = await Project.findOne({ title: /Climate Change.*Marine/i });
    if (marineProject) {
      marineProject.attachments = [
        {
          filename: 'Satellite_Imagery_Analysis_2024.pdf',
          url: '/uploads/projects/marine-climate/satellite_analysis.pdf',
          uploadedAt: new Date('2024-10-15')
        },
        {
          filename: 'Coral_Bleaching_Data_Q2_2024.csv',
          url: '/uploads/projects/marine-climate/bleaching_data_q2.csv',
          uploadedAt: new Date('2024-08-20')
        },
        {
          filename: 'Temperature_pH_Sensor_Readings.xlsx',
          url: '/uploads/projects/marine-climate/sensor_readings.xlsx',
          uploadedAt: new Date('2024-10-30')
        },
        {
          filename: 'Biodiversity_Assessment_Report.pdf',
          url: '/uploads/projects/marine-climate/biodiversity_report.pdf',
          uploadedAt: new Date('2024-11-05')
        },
        {
          filename: 'Field_Research_Photos_2024.zip',
          url: '/uploads/projects/marine-climate/field_photos.zip',
          uploadedAt: new Date('2024-09-25')
        },
        {
          filename: 'Conservation_Strategy_Recommendations.pdf',
          url: '/uploads/projects/marine-climate/conservation_strategy.pdf',
          uploadedAt: new Date('2024-11-15')
        }
      ];
      marineProject.documentation = 'https://docs.research-hub.edu/marine-climate';
      marineProject.publications = [
        {
          title: 'Climate-Induced Coral Reef Degradation: A Three-Year Study',
          url: 'https://journals.example.com/marine-biology/coral-study',
          publishedDate: new Date('2024-10-15')
        }
      ];
      await marineProject.save();
      updates.push('Climate Change Impact on Marine Ecosystems');
    }
    
    console.log(`✅ Successfully updated ${updates.length} projects with files and documentation!\n`);
    
    console.log('📁 Updated Projects:');
    updates.forEach((title, index) => {
      console.log(`   ${index + 1}. ${title}`);
    });
    
    // Display summary
    console.log('\n📊 Files Added Summary:\n');
    const allProjects = await Project.find({}).select('title attachments repository documentation publications');
    
    allProjects.forEach(project => {
      if (project.attachments && project.attachments.length > 0) {
        console.log(`\n${project.title}:`);
        console.log(`   📎 ${project.attachments.length} file(s)`);
        if (project.repository) console.log(`   🔗 Repository: ${project.repository}`);
        if (project.documentation) console.log(`   📖 Documentation: ${project.documentation}`);
        if (project.publications && project.publications.length > 0) {
          console.log(`   📄 ${project.publications.length} publication(s)`);
        }
      }
    });
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
