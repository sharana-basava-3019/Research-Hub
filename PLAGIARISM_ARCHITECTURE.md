# 🏗️ Plagiarism Detection System - Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   React UI   │  │ test-ui.html │  │   Postman    │             │
│  │  Component   │  │   Browser    │  │   / cURL     │             │
│  └───────┬──────┘  └──────┬───────┘  └──────┬───────┘             │
│          │                 │                  │                      │
│          └─────────────────┴──────────────────┘                      │
│                             │                                        │
│                    HTTP POST/GET Requests                            │
│                    (multipart/form-data)                             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (Express.js)                          │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Routes: /api/plagiarism/*                                     │ │
│  │  - POST /check-document                                        │ │
│  │  - POST /compare-documents                                     │ │
│  │  - GET  /stats                                                 │ │
│  └─────────────────────────┬─────────────────────────────────────┘ │
│                            │                                         │
│  ┌─────────────────────────▼─────────────────────────────────────┐ │
│  │  Middleware                                                    │ │
│  │  - Authentication (JWT)                                        │ │
│  │  - Multer (File Upload)                                        │ │
│  │  - Rate Limiting                                               │ │
│  │  - Error Handling                                              │ │
│  └─────────────────────────┬─────────────────────────────────────┘ │
│                            │                                         │
│  ┌─────────────────────────▼─────────────────────────────────────┐ │
│  │  Controllers: documentPlagiarismController.js                  │ │
│  │  - checkDocument()                                             │ │
│  │  - compareDocuments()                                          │ │
│  │  - getPlagiarismStats()                                        │ │
│  └─────────────────────────┬─────────────────────────────────────┘ │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER (Business Logic)                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  documentExtractor.js                                        │   │
│  │                                                              │   │
│  │  ┌──────────────┐        ┌──────────────┐                  │   │
│  │  │   PDF File   │───────▶│  pdf-parse   │──┐               │   │
│  │  └──────────────┘        └──────────────┘  │               │   │
│  │                                             ▼               │   │
│  │  ┌──────────────┐        ┌──────────────┐  │               │   │
│  │  │  DOCX File   │───────▶│   mammoth    │──┤               │   │
│  │  └──────────────┘        └──────────────┘  │               │   │
│  │                                             │               │   │
│  │                          ┌──────────────────▼─────────┐     │   │
│  │                          │   Extracted Raw Text       │     │   │
│  │                          └────────────────────────────┘     │   │
│  └──────────────────────────────────┬───────────────────────────   │
│                                     │                               │
│  ┌──────────────────────────────────▼───────────────────────────┐  │
│  │  plagiarismChecker.js                                        │  │
│  │                                                              │  │
│  │  Step 1: Text Cleaning                                      │  │
│  │  ┌────────────────────────────────────────────┐             │  │
│  │  │  • Convert to lowercase                    │             │  │
│  │  │  • Remove special characters               │             │  │
│  │  │  • Tokenize words                          │             │  │
│  │  │  • Remove stop words (a, the, is, etc.)   │             │  │
│  │  │  • Filter short words (< 3 chars)         │             │  │
│  │  └─────────────┬──────────────────────────────┘             │  │
│  │                │                                             │  │
│  │  Step 2: TF-IDF Vectorization                               │  │
│  │  ┌─────────────▼──────────────────────────────┐             │  │
│  │  │  Calculate Term Frequency (TF)             │             │  │
│  │  │  word_count / total_words                  │             │  │
│  │  ├────────────────────────────────────────────┤             │  │
│  │  │  Calculate Inverse Document Frequency      │             │  │
│  │  │  log(total_docs / docs_with_term)         │             │  │
│  │  ├────────────────────────────────────────────┤             │  │
│  │  │  TF-IDF = TF × IDF                        │             │  │
│  │  │  Create document vectors                   │             │  │
│  │  └─────────────┬──────────────────────────────┘             │  │
│  │                │                                             │  │
│  │  Step 3: Cosine Similarity                                  │  │
│  │  ┌─────────────▼──────────────────────────────┐             │  │
│  │  │  Vector A · Vector B                       │             │  │
│  │  │  similarity = ─────────────────────        │             │  │
│  │  │             ||Vector A|| × ||Vector B||    │             │  │
│  │  │                                            │             │  │
│  │  │  Result: 0.0 (different) to 1.0 (same)   │             │  │
│  │  └─────────────┬──────────────────────────────┘             │  │
│  │                │                                             │  │
│  │  Step 4: Result Interpretation                              │  │
│  │  ┌─────────────▼──────────────────────────────┐             │  │
│  │  │  75-100% → High Similarity (RED)           │             │  │
│  │  │  50-74%  → Moderate Similarity (YELLOW)    │             │  │
│  │  │  25-49%  → Low Similarity (BLUE)           │             │  │
│  │  │  0-24%   → Clear (GREEN)                   │             │  │
│  │  └────────────────────────────────────────────┘             │  │
│  └──────────────────────────────────────────────────────────────  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (MongoDB)                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Projects Collection                                          │  │
│  │  {                                                            │  │
│  │    title: "Research Paper",                                  │  │
│  │    description: "...",                                       │  │
│  │    attachments: [                                            │  │
│  │      {                                                       │  │
│  │        filename: "research.pdf",                            │  │
│  │        url: "/uploads/projects/123-research.pdf",          │  │
│  │        fileSize: 2456789,                                  │  │
│  │        mimeType: "application/pdf"                         │  │
│  │      }                                                      │  │
│  │    ]                                                        │  │
│  │  }                                                          │  │
│  └──────────────────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FILE SYSTEM (Uploads)                            │
│                                                                      │
│  server/uploads/projects/                                           │
│  ├── 1702345678-123456789-paper1.pdf                                │
│  ├── 1702345679-987654321-thesis.docx                               │
│  └── 1702345680-456789123-report.pdf                                │
│                                                                      │
│  (Temporary uploads cleaned after processing)                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

### Check Document Request Flow

```
1. USER ACTION
   │
   ├─→ Upload PDF/DOCX file
   │
   ▼

2. FRONTEND
   │
   ├─→ Create FormData with file
   ├─→ Add JWT token to headers
   ├─→ POST to /api/plagiarism/check-document
   │
   ▼

3. API LAYER
   │
   ├─→ Authenticate user (JWT middleware)
   ├─→ Validate file (Multer middleware)
   ├─→ Route to documentPlagiarismController.checkDocument()
   │
   ▼

4. CONTROLLER
   │
   ├─→ Validate file type and size
   ├─→ Call DocumentExtractor.extractText()
   │   │
   │   ▼
   │   PDF/DOCX → Raw Text (3-5 seconds)
   │
   ├─→ Fetch all projects with attachments from MongoDB
   ├─→ Extract text from each existing document
   │   │
   │   ▼
   │   Loop through 100+ documents (30-60 seconds)
   │
   ├─→ Call PlagiarismChecker.compareDocument()
   │   │
   │   ├─→ Clean text (remove stop words, punctuation)
   │   ├─→ Calculate TF-IDF vectors
   │   ├─→ Compute cosine similarity for each document
   │   ├─→ Rank by similarity percentage
   │   │
   │   ▼
   │   Return: {status, similarityPercentage, matches[]}
   │
   ├─→ Generate detailed report
   ├─→ Clean up temporary uploaded file
   │
   ▼

5. RESPONSE
   │
   └─→ Return JSON with:
       - Similarity percentage (0-100%)
       - Status (clear, low, moderate, high)
       - Top 10 matching documents
       - Detailed report with recommendations
   │
   ▼

6. FRONTEND
   │
   └─→ Display results to user
       - Show similarity badge (color-coded)
       - List matched documents
       - Display recommendations
```

---

## Component Interaction Diagram

```
┌──────────────────┐
│   React UI       │
│   Component      │
└────────┬─────────┘
         │ 1. Upload File
         │
         ▼
┌──────────────────┐      2. Validate & Route      ┌──────────────────┐
│   API Routes     │─────────────────────────────▶│   Controller     │
│   (Express)      │                               │                  │
└──────────────────┘                               └────────┬─────────┘
                                                            │ 3. Extract Text
                                                            ▼
         ┌──────────────────────────────────────────────────────────┐
         │                    Service Layer                          │
         │                                                           │
         │  ┌─────────────────┐         ┌──────────────────┐        │
         │  │ Document        │         │   Plagiarism     │        │
         │  │ Extractor       │◀───────▶│   Checker        │        │
         │  └─────────────────┘         └──────────────────┘        │
         │         │                              │                  │
         │         │ 4. Get Text                 │ 5. Compare       │
         │         ▼                              ▼                  │
         └─────────────────────────────────────────────────────────┘
                   │                              │
                   │ 6. Read Files                │ 7. Fetch Projects
                   ▼                              ▼
         ┌─────────────────┐         ┌──────────────────┐
         │  File System    │         │    MongoDB       │
         │  (Uploads)      │         │   (Projects)     │
         └─────────────────┘         └──────────────────┘
```

---

## Algorithm Flow: TF-IDF + Cosine Similarity

```
INPUT: Two documents (Doc A and Doc B)
│
├─→ STEP 1: Text Preprocessing
│   ├─→ Convert to lowercase
│   ├─→ Remove punctuation & special chars
│   ├─→ Tokenize into words
│   ├─→ Remove stop words (a, the, is, and, etc.)
│   └─→ Result: Clean word arrays
│
├─→ STEP 2: Calculate TF (Term Frequency)
│   │
│   │   For each word in document:
│   │   TF(word) = (# times word appears) / (total words)
│   │
│   │   Example Doc A: "cat cat dog"
│   │   TF(cat) = 2/3 = 0.67
│   │   TF(dog) = 1/3 = 0.33
│   │
│   └─→ Result: TF vectors for each document
│
├─→ STEP 3: Calculate IDF (Inverse Document Frequency)
│   │
│   │   For each unique word:
│   │   IDF(word) = log(total_docs / docs_containing_word)
│   │
│   │   Example (2 docs total):
│   │   IDF(cat) = log(2/2) = 0 (common word)
│   │   IDF(dog) = log(2/1) = 0.3 (unique word)
│   │
│   └─→ Result: IDF values for each word
│
├─→ STEP 4: Calculate TF-IDF
│   │
│   │   For each word:
│   │   TF-IDF(word) = TF(word) × IDF(word)
│   │
│   │   Creates weighted vectors:
│   │   Common words → Lower weight
│   │   Rare/unique words → Higher weight
│   │
│   └─→ Result: TF-IDF vectors for Doc A and Doc B
│
├─→ STEP 5: Calculate Cosine Similarity
│   │
│   │                Doc_A · Doc_B
│   │   Similarity = ─────────────────────
│   │                ||Doc_A|| × ||Doc_B||
│   │
│   │   Where:
│   │   • Dot product = sum of (A[i] × B[i])
│   │   • Magnitude = sqrt(sum of squares)
│   │
│   │   Example calculation:
│   │   Doc_A = [0.5, 0.3, 0.8]
│   │   Doc_B = [0.6, 0.4, 0.7]
│   │
│   │   Dot product = (0.5×0.6) + (0.3×0.4) + (0.8×0.7)
│   │               = 0.3 + 0.12 + 0.56 = 0.98
│   │
│   │   ||Doc_A|| = sqrt(0.5² + 0.3² + 0.8²) = 1.02
│   │   ||Doc_B|| = sqrt(0.6² + 0.4² + 0.7²) = 1.05
│   │
│   │   Similarity = 0.98 / (1.02 × 1.05) = 0.91 (91%)
│   │
│   └─→ Result: Similarity score (0.0 to 1.0)
│
└─→ STEP 6: Interpret Result
    │
    ├─→ 0.75-1.0 → High Similarity (75-100%)
    ├─→ 0.50-0.74 → Moderate Similarity (50-74%)
    ├─→ 0.25-0.49 → Low Similarity (25-49%)
    └─→ 0.0-0.24 → Clear (0-24%)

OUTPUT: Similarity percentage & status
```

---

## Data Model

### Project Document Schema

```javascript
{
  _id: ObjectId("..."),
  title: "Research Paper Title",
  description: "Project description...",
  abstract: "Research abstract...",
  owner: ObjectId("user_id"),
  
  // File attachments
  attachments: [
    {
      _id: ObjectId("..."),
      filename: "research_paper.pdf",
      url: "/uploads/projects/1702345678-123456789-research_paper.pdf",
      fileSize: 2456789,
      mimeType: "application/pdf",
      uploadedBy: ObjectId("user_id"),
      uploadedAt: ISODate("2025-12-15T10:30:00Z")
    }
  ],
  
  // Plagiarism detection results (for projects)
  plagiarism_flag: false,
  plagiarism_score: 0.0,
  matched_project_id: null,
  plagiarism_checked_at: null,
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### API Response Schema

```javascript
{
  status: "success",
  message: "Document plagiarism check completed",
  data: {
    uploadedFile: {
      originalName: "paper.pdf",
      size: 245678,
      type: "application/pdf",
      textLength: 5432
    },
    plagiarismCheck: {
      status: "moderate_similarity",
      similarityPercentage: 62,
      message: "Moderate similarity detected (62%). Manual review recommended.",
      totalDocumentsChecked: 45
    },
    matches: [
      {
        documentId: "507f1f77bcf86cd799439011",
        documentName: "similar_research.pdf",
        uploadedBy: { firstName: "John", lastName: "Doe" },
        similarityPercentage: 62,
        similarityScore: 0.62
      }
    ],
    mostSimilarDocument: {
      id: "507f1f77bcf86cd799439011",
      name: "similar_research.pdf",
      similarityPercentage: 62
    },
    report: {
      summary: {
        status: "moderate_similarity",
        similarityPercentage: "62%",
        interpretation: "Notable similarities found...",
        recommendation: "Manual review required..."
      },
      details: {
        totalMatches: 8,
        topMatches: [...],
        disclaimer: "This is a basic plagiarism check..."
      }
    }
  }
}
```

---

## File Organization

```
server/
│
├── services/                          # Business Logic
│   ├── documentExtractor.js          # PDF & DOCX text extraction
│   │   ├── extractText()             # Main extraction method
│   │   ├── extractFromPDF()          # PDF-specific extraction
│   │   ├── extractFromDOCX()         # DOCX-specific extraction
│   │   ├── isSupportedFileType()     # File type validation
│   │   └── validateDocument()        # Document validation
│   │
│   └── plagiarismChecker.js          # Similarity detection
│       ├── cleanText()               # Text preprocessing
│       ├── calculateSimilarity()     # TF-IDF + Cosine similarity
│       ├── compareDocument()         # Compare against database
│       ├── generateReport()          # Create detailed report
│       └── getStatusMessage()        # Interpret results
│
├── controllers/                       # Request Handlers
│   └── documentPlagiarismController.js
│       ├── checkDocument()           # Single document check
│       ├── compareDocuments()        # Compare two documents
│       └── getPlagiarismStats()      # System statistics
│
├── routes/                            # API Endpoints
│   └── documentPlagiarismRoutes.js
│       ├── POST /check-document
│       ├── POST /compare-documents
│       └── GET  /stats
│
├── config/                            # Configuration
│   └── multer.js                      # File upload config
│
├── utils/                             # Utilities & Tests
│   └── testPlagiarismDetection.js    # Automated test suite
│
└── uploads/projects/                  # Uploaded files storage
    └── [timestamp-random-filename]
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                              │
│  1. Authentication Layer                                     │
│     ├─→ JWT Token Verification                              │
│     ├─→ User Identity Validation                            │
│     └─→ Session Management                                  │
│                                                              │
│  2. Input Validation Layer                                  │
│     ├─→ File Type Check (PDF/DOCX only)                    │
│     ├─→ File Size Limit (10 MB max)                        │
│     ├─→ Extension Verification                              │
│     └─→ MIME Type Validation                                │
│                                                              │
│  3. Processing Layer                                         │
│     ├─→ Temporary File Storage                              │
│     ├─→ Isolated Processing Environment                     │
│     └─→ Resource Limits (CPU, Memory)                       │
│                                                              │
│  4. Cleanup Layer                                            │
│     ├─→ Automatic File Deletion                             │
│     ├─→ No Permanent Storage                                │
│     └─→ Error Recovery Cleanup                              │
│                                                              │
│  5. Rate Limiting Layer                                      │
│     ├─→ 100 requests per 15 minutes                         │
│     ├─→ Per-IP throttling                                   │
│     └─→ DDoS Protection                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Metrics

```
Operation Timeline:
─────────────────────────────────────────────────────────────

0s     ┌──────────┐
       │  Upload  │
       │   File   │
1s     └────┬─────┘
            │
2s          ▼
       ┌──────────┐
       │ Extract  │
       │   Text   │
3s     └────┬─────┘
            │
4s          ▼
       ┌──────────┐
       │  Clean   │
       │   Text   │
5s     └────┬─────┘
            │
            ▼
       ┌──────────────────────────────┐
       │  Compare Against Database    │
       │                              │
       │  Loop through documents:     │
       │  ├─ Doc 1 (0.5s)            │
       │  ├─ Doc 2 (0.5s)            │
       │  ├─ Doc 3 (0.5s)            │
       │  ├─ ...                     │
60s    │  └─ Doc 100 (0.5s)          │
       └────┬─────────────────────────┘
            │
            ▼
       ┌──────────┐
       │ Generate │
       │  Report  │
62s    └────┬─────┘
            │
            ▼
       ┌──────────┐
       │  Return  │
       │ Response │
63s    └──────────┘

Total: ~60 seconds for 100 documents
```

---

## Scalability Considerations

```
Current Implementation:
┌─────────────────────────────┐
│  Sequential Processing      │
│  One document at a time     │
│  Time = O(n) where n=docs   │
└─────────────────────────────┘

Optimized Implementation (Future):
┌─────────────────────────────┐
│  Parallel Processing        │
│  Worker Threads / Clusters  │
│  Time = O(n/k) where k=CPUs │
└─────────────────────────────┘

With Caching:
┌─────────────────────────────┐
│  Pre-extracted Text Cache   │
│  Skip extraction step       │
│  Time = O(n/2) average      │
└─────────────────────────────┘
```

---

This architecture provides a clear, maintainable, and scalable solution for document plagiarism detection in RESEARCH HUB. All components are modular and can be independently tested, maintained, and enhanced.
