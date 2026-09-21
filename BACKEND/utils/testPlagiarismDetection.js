/**
 * Test Script for Document Plagiarism Detection
 * This script tests the document extraction and plagiarism checking functionality
 */

const DocumentExtractor = require('../services/documentExtractor');
const PlagiarismChecker = require('../services/plagiarismChecker');
const path = require('path');

// Test texts for demonstration
const sampleText1 = `
Artificial intelligence has revolutionized modern computing systems. Machine learning algorithms 
enable computers to learn from data without explicit programming. Deep learning, a subset of 
machine learning, uses neural networks with multiple layers to process complex patterns. 
These technologies have applications in image recognition, natural language processing, and 
autonomous systems. The field continues to evolve rapidly with new breakthroughs emerging regularly.
`;

const sampleText2 = `
Artificial intelligence transformed how we approach computing. Machine learning methods allow 
systems to improve from experience automatically. Neural networks with many layers, known as 
deep learning, can identify intricate patterns in data. Common uses include computer vision, 
text analysis, and self-driving vehicles. Research in this area advances quickly with continuous 
innovations and discoveries.
`;

const sampleText3 = `
Cloud computing provides on-demand access to computing resources over the internet. Organizations 
can scale their infrastructure dynamically based on needs. This model reduces capital expenditure 
on hardware and allows for flexible resource allocation. Major providers include Amazon Web Services, 
Microsoft Azure, and Google Cloud Platform. Security and data privacy remain important considerations 
for cloud adoption.
`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function printHeader(title) {
  console.log('\n' + colors.bright + colors.blue + '═'.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + title + colors.reset);
  console.log(colors.bright + colors.blue + '═'.repeat(80) + colors.reset + '\n');
}

function printSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

function printError(message) {
  console.log(colors.red + '✗ ' + message + colors.reset);
}

function printInfo(message) {
  console.log(colors.yellow + 'ℹ ' + message + colors.reset);
}

function getSimilarityColor(percentage) {
  if (percentage >= 75) return colors.red;
  if (percentage >= 50) return colors.yellow;
  if (percentage >= 25) return colors.cyan;
  return colors.green;
}

async function testTextCleaning() {
  printHeader('TEST 1: Text Cleaning & Normalization');
  
  const rawText = "Hello, World! This is a TEST with Numbers (123) and Special-Characters @#$%";
  console.log('Raw text:', rawText);
  
  const cleaned = PlagiarismChecker.cleanText(rawText);
  console.log('Cleaned text:', cleaned);
  
  printSuccess('Text cleaning completed\n');
}

async function testSimilarityCalculation() {
  printHeader('TEST 2: Similarity Calculation (TF-IDF + Cosine Similarity)');
  
  console.log('Comparing three sample texts:\n');
  
  // Test 1: High similarity (paraphrased content)
  const similarity1 = PlagiarismChecker.calculateSimilarity(sampleText1, sampleText2);
  const percentage1 = Math.round(similarity1 * 100);
  console.log('Text 1 vs Text 2 (AI topics - paraphrased):');
  console.log(`  Similarity: ${getSimilarityColor(percentage1)}${percentage1}%${colors.reset}`);
  console.log(`  Status: ${PlagiarismChecker.getInterpretation(getStatus(similarity1))}\n`);
  
  // Test 2: Low similarity (different topics)
  const similarity2 = PlagiarismChecker.calculateSimilarity(sampleText1, sampleText3);
  const percentage2 = Math.round(similarity2 * 100);
  console.log('Text 1 vs Text 3 (AI vs Cloud - different topics):');
  console.log(`  Similarity: ${getSimilarityColor(percentage2)}${percentage2}%${colors.reset}`);
  console.log(`  Status: ${PlagiarismChecker.getInterpretation(getStatus(similarity2))}\n`);
  
  // Test 3: Perfect similarity (identical)
  const similarity3 = PlagiarismChecker.calculateSimilarity(sampleText1, sampleText1);
  const percentage3 = Math.round(similarity3 * 100);
  console.log('Text 1 vs Text 1 (identical):');
  console.log(`  Similarity: ${getSimilarityColor(percentage3)}${percentage3}%${colors.reset}`);
  console.log(`  Status: Perfect match\n`);
  
  printSuccess('Similarity calculations completed\n');
}

async function testDocumentComparison() {
  printHeader('TEST 3: Document Comparison Against Database');
  
  const newDocumentText = sampleText1;
  
  const existingDocuments = [
    {
      _id: 'doc1',
      filename: 'ai_research_paper.pdf',
      text: sampleText2,
      uploadedBy: { firstName: 'John', lastName: 'Doe' }
    },
    {
      _id: 'doc2',
      filename: 'cloud_computing_study.docx',
      text: sampleText3,
      uploadedBy: { firstName: 'Jane', lastName: 'Smith' }
    }
  ];
  
  console.log('Checking new document against 2 existing documents...\n');
  
  const result = await PlagiarismChecker.compareDocument(newDocumentText, existingDocuments);
  
  console.log('Results:');
  console.log(`  Status: ${colors.bright}${result.status}${colors.reset}`);
  console.log(`  Similarity: ${getSimilarityColor(result.similarityPercentage)}${result.similarityPercentage}%${colors.reset}`);
  console.log(`  Message: ${result.message}`);
  console.log(`  Documents Checked: ${result.totalDocumentsChecked}`);
  console.log(`  Matches Found: ${result.matches.length}\n`);
  
  if (result.matches.length > 0) {
    console.log('Top Matches:');
    result.matches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.documentName}`);
      console.log(`     Similarity: ${getSimilarityColor(match.similarityPercentage)}${match.similarityPercentage}%${colors.reset}\n`);
    });
  }
  
  printSuccess('Document comparison completed\n');
}

async function testReportGeneration() {
  printHeader('TEST 4: Report Generation');
  
  const comparisonResult = {
    status: 'moderate_similarity',
    similarityPercentage: 65,
    matches: [
      {
        documentId: 'doc1',
        documentName: 'similar_paper.pdf',
        similarityPercentage: 65
      },
      {
        documentId: 'doc2',
        documentName: 'another_doc.docx',
        similarityPercentage: 42
      }
    ]
  };
  
  const report = PlagiarismChecker.generateReport(comparisonResult);
  
  console.log('Generated Report:\n');
  console.log(JSON.stringify(report, null, 2));
  
  printSuccess('Report generation completed\n');
}

async function testFileValidation() {
  printHeader('TEST 5: File Validation');
  
  // Test supported file types
  console.log('Testing file type validation:\n');
  
  const testFiles = [
    'document.pdf',
    'paper.docx',
    'image.jpg',
    'data.txt'
  ];
  
  testFiles.forEach(filename => {
    const isSupported = DocumentExtractor.isSupportedFileType(filename);
    if (isSupported) {
      printSuccess(`${filename} - Supported`);
    } else {
      printInfo(`${filename} - Not supported`);
    }
  });
  
  console.log('\n');
  printSuccess('File validation tests completed\n');
}

function getStatus(similarity) {
  if (similarity >= 0.75) return 'high_similarity';
  if (similarity >= 0.50) return 'moderate_similarity';
  if (similarity >= 0.25) return 'low_similarity';
  return 'clear';
}

// Main test runner
async function runAllTests() {
  console.log(colors.bright + colors.cyan);
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║         DOCUMENT PLAGIARISM DETECTION - TEST SUITE                       ║');
  console.log('║         RESEARCH HUB - University Research Collaboration Platform        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    await testTextCleaning();
    await testSimilarityCalculation();
    await testDocumentComparison();
    await testReportGeneration();
    await testFileValidation();
    
    printHeader('TEST SUMMARY');
    printSuccess('All tests completed successfully!');
    console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
    console.log('  1. Start your server: npm start');
    console.log('  2. Test API endpoints using Postman or cURL');
    console.log('  3. Check the documentation: DOCUMENT_PLAGIARISM_DETECTION.md\n');
    
  } catch (error) {
    printError('Test failed: ' + error.message);
    console.error(error);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testTextCleaning,
  testSimilarityCalculation,
  testDocumentComparison,
  testReportGeneration,
  testFileValidation
};
