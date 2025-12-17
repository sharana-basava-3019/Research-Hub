# Document Plagiarism Detection System

## Overview

A simple yet effective plagiarism detection system for RESEARCH HUB that allows users to upload **PDF and DOCX documents** for plagiarism checking. The system uses **TF-IDF (Term Frequency-Inverse Document Frequency)** and **cosine similarity** algorithms to compare documents and calculate similarity percentages.

---

## ⚠️ Important Disclaimer

**This is a BASIC plagiarism detection tool** for educational and preliminary screening purposes. It:
- ✅ Detects text similarity using statistical algorithms
- ✅ Compares documents against your database of existing documents
- ❌ Does NOT detect paraphrased content
- ❌ Does NOT detect translated plagiarism
- ❌ Does NOT check against external databases or the internet
- ❌ Is NOT a replacement for professional tools (Turnitin, iThenticate, etc.)

**Use this for initial screening only. Professional academic plagiarism detection requires specialized commercial tools.**

---

## Features

### ✨ Key Capabilities

1. **Document Upload & Processing**
   - Accepts PDF and DOCX file formats
   - Maximum file size: 10 MB
   - Automatic text extraction from documents

2. **Smart Text Analysis**
   - TF-IDF vectorization for semantic understanding
   - Cosine similarity calculation (0-100% similarity)
   - Filters common stop words and punctuation
   - Minimum 100 characters required for analysis

3. **Comprehensive Comparison**
   - Compares uploaded document against all existing documents in the system
   - Returns top 10 most similar documents
   - Provides detailed similarity scores for each match

4. **Clear Status Reporting**
   - **High Similarity (75%+)**: Potential plagiarism detected
   - **Moderate Similarity (50-74%)**: Manual review recommended
   - **Low Similarity (25-49%)**: Minor overlaps detected
   - **Clear (<25%)**: No significant matches found

---

## Technical Architecture

### Backend Stack: Node.js + Express

```
Backend Structure:
├── services/
│   ├── documentExtractor.js      # PDF & DOCX text extraction
│   └── plagiarismChecker.js      # Similarity algorithms
├── controllers/
│   └── documentPlagiarismController.js  # Request handlers
└── routes/
    └── documentPlagiarismRoutes.js      # API endpoints
```

### Key Dependencies

```json
{
  "pdf-parse": "^1.1.1",      // PDF text extraction
  "mammoth": "^1.6.0",        // DOCX text extraction
  "natural": "^8.1.0",        // NLP & TF-IDF algorithms
  "multer": "^2.0.2"          // File upload handling
}
```

---

## Installation

### 1. Install Required Packages

```bash
cd server
npm install pdf-parse mammoth --save
```

These packages are already installed in your project.

### 2. Verify File Structure

Ensure the following files exist:
- `server/services/documentExtractor.js`
- `server/services/plagiarismChecker.js`
- `server/controllers/documentPlagiarismController.js`
- `server/routes/documentPlagiarismRoutes.js`

### 3. Server Configuration

The plagiarism routes are already added to `server/server.js`:
```javascript
app.use('/api/plagiarism', require('./routes/documentPlagiarismRoutes'));
```

---

## API Endpoints

### 1. Check Document for Plagiarism

**Endpoint:** `POST /api/plagiarism/check-document`

**Description:** Upload a single document and check it against all existing documents in the system.

**Authentication:** Required (Bearer Token)

**Request:**
```http
POST /api/plagiarism/check-document
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Body:
- document: [PDF or DOCX file]
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Document plagiarism check completed",
  "data": {
    "uploadedFile": {
      "originalName": "research_paper.pdf",
      "size": 245678,
      "type": "application/pdf",
      "textLength": 5432
    },
    "plagiarismCheck": {
      "status": "moderate_similarity",
      "similarityPercentage": 62,
      "message": "Moderate similarity detected (62%). Manual review recommended.",
      "totalDocumentsChecked": 45
    },
    "matches": [
      {
        "documentId": "507f1f77bcf86cd799439011",
        "documentName": "similar_research.pdf",
        "uploadedBy": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@university.edu"
        },
        "similarityPercentage": 62,
        "similarityScore": 0.62
      },
      {
        "documentId": "507f1f77bcf86cd799439012",
        "documentName": "another_paper.docx",
        "similarityPercentage": 38,
        "similarityScore": 0.38
      }
    ],
    "mostSimilarDocument": {
      "id": "507f1f77bcf86cd799439011",
      "name": "similar_research.pdf",
      "similarityPercentage": 62
    },
    "report": {
      "summary": {
        "status": "moderate_similarity",
        "similarityPercentage": "62%",
        "interpretation": "Notable similarities found. Review the matches to ensure proper attribution and originality.",
        "recommendation": "Manual review required. Check if similarities are from proper citations or references."
      },
      "details": {
        "totalMatches": 8,
        "topMatches": [...],
        "disclaimer": "This is a basic plagiarism check using text similarity algorithms..."
      }
    },
    "disclaimer": "This is a BASIC plagiarism check..."
  }
}
```

---

### 2. Compare Two Documents

**Endpoint:** `POST /api/plagiarism/compare-documents`

**Description:** Upload two documents and directly compare them for similarity.

**Authentication:** Required (Bearer Token)

**Request:**
```http
POST /api/plagiarism/compare-documents
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Body:
- documents: [PDF or DOCX file 1]
- documents: [PDF or DOCX file 2]
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Documents compared successfully",
  "data": {
    "document1": {
      "originalName": "paper1.pdf",
      "size": 156789,
      "textLength": 4567
    },
    "document2": {
      "originalName": "paper2.docx",
      "size": 234567,
      "textLength": 5123
    },
    "comparison": {
      "status": "high_similarity",
      "similarityPercentage": 78,
      "similarityScore": 0.78,
      "message": "High similarity detected (78%). This document may contain plagiarized content.",
      "interpretation": "Significant portions of this document match existing content. This requires immediate attention."
    },
    "disclaimer": "This is a BASIC text similarity check..."
  }
}
```

---

### 3. Get Plagiarism Statistics

**Endpoint:** `GET /api/plagiarism/stats`

**Description:** Get statistics about documents available for comparison.

**Authentication:** Required (Bearer Token)

**Request:**
```http
GET /api/plagiarism/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "totalProjects": 127,
    "totalDocuments": 456,
    "processableDocuments": 389,
    "documentTypes": {
      "pdf": 245,
      "docx": 144,
      "other": 67
    },
    "supportedFormats": ["PDF", "DOCX"],
    "maxFileSize": "10 MB",
    "minTextLength": "100 characters"
  }
}
```

---

## Code Examples

### Frontend Integration (JavaScript/React)

#### Example 1: Upload Document for Plagiarism Check

```javascript
import axios from 'axios';

const checkDocumentPlagiarism = async (file) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('document', file);

    // Get auth token
    const token = localStorage.getItem('token');

    // Make API request
    const response = await axios.post(
      'http://localhost:5000/api/plagiarism/check-document',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Handle response
    const { plagiarismCheck, matches, report } = response.data.data;
    
    console.log('Similarity:', plagiarismCheck.similarityPercentage + '%');
    console.log('Status:', plagiarismCheck.status);
    console.log('Top Matches:', matches);
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
};

// Usage in React component
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    alert('Please upload a PDF or DOCX file');
    return;
  }
  
  try {
    setLoading(true);
    const result = await checkDocumentPlagiarism(file);
    
    // Display results
    setResults(result);
    setLoading(false);
  } catch (error) {
    alert('Failed to check document');
    setLoading(false);
  }
};
```

#### Example 2: Compare Two Documents

```javascript
const compareTwoDocuments = async (file1, file2) => {
  try {
    const formData = new FormData();
    formData.append('documents', file1);
    formData.append('documents', file2);

    const token = localStorage.getItem('token');

    const response = await axios.post(
      'http://localhost:5000/api/plagiarism/compare-documents',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const { comparison } = response.data.data;
    console.log('Similarity:', comparison.similarityPercentage + '%');
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
};
```

---

### Backend Usage (Direct Function Calls)

#### Example 1: Extract Text from Document

```javascript
const DocumentExtractor = require('./services/documentExtractor');

// Extract text from PDF
const pdfText = await DocumentExtractor.extractText('/path/to/document.pdf');
console.log('Extracted text:', pdfText);

// Extract text from DOCX
const docxText = await DocumentExtractor.extractText('/path/to/document.docx');
console.log('Extracted text:', docxText);

// Validate document before processing
const validation = DocumentExtractor.validateDocument('/path/to/document.pdf', 10);
if (validation.valid) {
  console.log('Document is valid');
} else {
  console.log('Error:', validation.error);
}
```

#### Example 2: Calculate Similarity Between Texts

```javascript
const PlagiarismChecker = require('./services/plagiarismChecker');

const text1 = "This is a sample research paper about artificial intelligence...";
const text2 = "This research discusses machine learning and AI applications...";

// Calculate similarity
const similarity = PlagiarismChecker.calculateSimilarity(text1, text2);
console.log('Similarity score:', similarity); // 0.0 to 1.0

const percentage = Math.round(similarity * 100);
console.log('Similarity percentage:', percentage + '%');
```

#### Example 3: Compare Document Against Multiple Documents

```javascript
const PlagiarismChecker = require('./services/plagiarismChecker');

const newDocumentText = "Your new document text here...";

const existingDocuments = [
  {
    _id: 'doc1',
    filename: 'paper1.pdf',
    text: 'Content of first paper...'
  },
  {
    _id: 'doc2',
    filename: 'paper2.docx',
    text: 'Content of second paper...'
  }
];

// Perform comparison
const result = await PlagiarismChecker.compareDocument(
  newDocumentText,
  existingDocuments
);

console.log('Status:', result.status);
console.log('Similarity:', result.similarityPercentage + '%');
console.log('Matches found:', result.matches.length);

// Generate detailed report
const report = PlagiarismChecker.generateReport(result);
console.log('Report:', report);
```

---

## Testing with cURL

### Test Document Upload

```bash
# Check single document
curl -X POST http://localhost:5000/api/plagiarism/check-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/your/document.pdf"

# Compare two documents
curl -X POST http://localhost:5000/api/plagiarism/compare-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "documents=@/path/to/document1.pdf" \
  -F "documents=@/path/to/document2.docx"

# Get statistics
curl -X GET http://localhost:5000/api/plagiarism/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing with Postman

### Setup Instructions

1. **Import Collection**
   - Import `postman/RESEARCH-HUB.postman_collection.json`

2. **Set Environment Variables**
   ```
   base_url: http://localhost:5000
   token: YOUR_JWT_TOKEN
   ```

3. **Test Endpoints**

   **Check Document:**
   - Method: POST
   - URL: `{{base_url}}/api/plagiarism/check-document`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: form-data
     - Key: `document`
     - Type: File
     - Value: Select PDF/DOCX file

   **Compare Documents:**
   - Method: POST
   - URL: `{{base_url}}/api/plagiarism/compare-documents`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: form-data
     - Key: `documents` (File 1)
     - Key: `documents` (File 2)

---

## How It Works

### 1. Text Extraction Process

```
User uploads PDF/DOCX
        ↓
Validate file (type, size)
        ↓
Extract raw text using:
  - pdf-parse for PDF
  - mammoth for DOCX
        ↓
Clean extracted text
```

### 2. Text Cleaning & Normalization

```javascript
// The system performs:
1. Convert to lowercase
2. Remove special characters & punctuation
3. Tokenize into words
4. Remove stop words (a, the, is, etc.)
5. Remove very short words (< 3 characters)
```

### 3. Similarity Calculation (TF-IDF + Cosine Similarity)

```
Step 1: Calculate TF-IDF vectors
  - Term Frequency (TF): How often a word appears in document
  - Inverse Document Frequency (IDF): How unique a word is

Step 2: Calculate Cosine Similarity
  - Compare angle between two document vectors
  - Result: 0 (completely different) to 1 (identical)

Step 3: Convert to percentage
  - similarity_score × 100 = similarity_percentage
```

### 4. Result Interpretation

| Similarity | Status | Meaning |
|------------|--------|---------|
| 75-100% | High Similarity | Likely plagiarism - immediate review required |
| 50-74% | Moderate Similarity | Manual review needed - check citations |
| 25-49% | Low Similarity | Minor overlaps - common phrases |
| 0-24% | Clear | No significant matches - appears original |

---

## Limitations & Considerations

### ⚠️ What This System CANNOT Detect

1. **Paraphrasing**: If someone rewrites content in their own words
2. **Translation**: Content translated from another language
3. **Synonym Replacement**: Using synonyms to mask plagiarism
4. **Sentence Restructuring**: Changing sentence order
5. **External Sources**: Content from the internet or external databases
6. **Images/Tables**: Plagiarized figures, charts, or data tables

### ✅ What This System CAN Detect

1. **Direct Copying**: Exact or near-exact text matches
2. **Internal Duplication**: Similar content within your database
3. **High Text Overlap**: Significant word-level similarities
4. **Self-Plagiarism**: Resubmitted work from the same author

### 📊 Accuracy Factors

- **Database Size**: More documents = better detection
- **Document Quality**: Clear text extracts better than scanned PDFs
- **Content Type**: Technical papers may show higher similarity due to terminology
- **Length**: Longer documents provide more reliable results

---

## Best Practices

### For Users

1. ✅ Upload clear, text-based PDF/DOCX files (not scanned images)
2. ✅ Ensure documents have at least 100 characters of text
3. ✅ Review similarity reports manually - don't rely solely on percentages
4. ✅ Check if high similarities are from proper citations/quotes
5. ⚠️ Use this as a preliminary check, not final judgment

### For Developers

1. ✅ Set appropriate file size limits (currently 10 MB)
2. ✅ Implement rate limiting to prevent abuse
3. ✅ Clean up temporary uploaded files after processing
4. ✅ Log plagiarism checks for audit trails
5. ✅ Consider adding document encryption for sensitive content

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Please upload a PDF or DOCX file" | Wrong file type | Upload .pdf or .docx only |
| "File size exceeds 10MB limit" | File too large | Compress document or split into parts |
| "Unable to extract sufficient text" | Scanned PDF or empty document | Use text-based documents |
| "Document must contain at least 100 characters" | Document too short | Add more content |
| "Not authorized" | Missing/invalid token | Login and get fresh JWT token |

---

## Future Enhancements

Potential improvements for a production system:

1. **N-gram Analysis**: Detect phrase-level similarities
2. **Citation Detection**: Identify and exclude properly cited content
3. **Batch Processing**: Check multiple documents at once
4. **External API Integration**: Compare against Crossref, Google Scholar
5. **Machine Learning**: Use deep learning for semantic plagiarism detection
6. **Visualization**: Show side-by-side comparison with highlighted matches
7. **Scheduling**: Automated periodic checks for new submissions
8. **Reporting**: Generate PDF reports with detailed analysis

---

## Performance Optimization

### Current Performance

- **Text Extraction**: ~1-3 seconds per document
- **Similarity Calculation**: ~0.5-2 seconds per comparison
- **Full Check (against 100 docs)**: ~30-60 seconds

### Optimization Tips

```javascript
// 1. Use caching for frequently accessed documents
const cache = new Map();

// 2. Implement pagination for large document sets
const batchSize = 50;

// 3. Use worker threads for parallel processing
const { Worker } = require('worker_threads');

// 4. Store extracted text in database to avoid re-extraction
await Project.updateOne(
  { 'attachments._id': attachmentId },
  { $set: { 'attachments.$.extractedText': text } }
);
```

---

## Security Considerations

1. **File Upload Security**
   - Validate file types strictly
   - Scan uploaded files for viruses (implement antivirus integration)
   - Store uploaded files in isolated directory

2. **Authentication**
   - All endpoints require valid JWT token
   - Implement role-based access control (RBAC)

3. **Data Privacy**
   - Delete temporary files immediately after processing
   - Encrypt sensitive documents at rest
   - Log access to plagiarism reports

4. **Rate Limiting**
   - Limit API requests to prevent abuse
   - Current limit: 100 requests per 15 minutes

---

## Support & Troubleshooting

### Debugging Tips

```javascript
// Enable detailed logging
process.env.DEBUG = 'plagiarism:*';

// Check if text extraction works
const DocumentExtractor = require('./services/documentExtractor');
const text = await DocumentExtractor.extractText('/path/to/test.pdf');
console.log('Extracted text length:', text.length);

// Test similarity calculation
const PlagiarismChecker = require('./services/plagiarismChecker');
const similarity = PlagiarismChecker.calculateSimilarity('test text 1', 'test text 2');
console.log('Similarity:', similarity);
```

### Get Help

- Check logs in console for error messages
- Verify file uploads are enabled in multer configuration
- Ensure MongoDB connection is working
- Test with sample PDF/DOCX files first

---

## License

MIT License - Feel free to use and modify for your institution.

---

## Acknowledgments

- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX text extraction
- **natural**: Natural Language Processing library for TF-IDF
- **multer**: File upload handling

---

**Remember: This is a BASIC plagiarism detection tool for preliminary screening. Always use professional tools for official academic integrity decisions.**
