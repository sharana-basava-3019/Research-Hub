# Quick Start Guide - Document Plagiarism Detection

## 🚀 Quick Setup (5 Minutes)

### 1. Installation Complete ✓

All required packages are already installed:
- ✅ `pdf-parse` - PDF text extraction
- ✅ `mammoth` - DOCX text extraction
- ✅ `natural` - TF-IDF & NLP algorithms
- ✅ `multer` - File upload handling

### 2. File Structure ✓

All necessary files have been created:
```
server/
├── services/
│   ├── documentExtractor.js          ✓ Created
│   └── plagiarismChecker.js          ✓ Enhanced
├── controllers/
│   └── documentPlagiarismController.js   ✓ Created
├── routes/
│   └── documentPlagiarismRoutes.js       ✓ Created
└── utils/
    └── testPlagiarismDetection.js        ✓ Created
```

### 3. Server Configuration ✓

Routes are registered in `server/server.js`:
```javascript
app.use('/api/plagiarism', require('./routes/documentPlagiarismRoutes'));
```

---

## 📝 Testing the Implementation

### Option 1: Run Unit Tests

```bash
cd server
node utils/testPlagiarismDetection.js
```

This will test:
- Text cleaning and normalization
- Similarity calculations
- Document comparison logic
- Report generation
- File validation

### Option 2: Start Server & Test API

```bash
# Start the server
cd server
npm start

# Server should be running on http://localhost:5000
```

### Option 3: Test with cURL

#### A. Check Document for Plagiarism

```bash
# First, login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Copy the token from response, then:
curl -X POST http://localhost:5000/api/plagiarism/check-document \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "document=@path/to/your/document.pdf"
```

#### B. Compare Two Documents

```bash
curl -X POST http://localhost:5000/api/plagiarism/compare-documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "documents=@path/to/doc1.pdf" \
  -F "documents=@path/to/doc2.docx"
```

#### C. Get Statistics

```bash
curl -X GET http://localhost:5000/api/plagiarism/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/plagiarism/check-document` | POST | Check one document against all existing documents | ✓ Yes |
| `/api/plagiarism/compare-documents` | POST | Compare two uploaded documents | ✓ Yes |
| `/api/plagiarism/stats` | GET | Get statistics about available documents | ✓ Yes |

---

## 💡 Quick Integration Examples

### Frontend (React)

Create a simple upload form:

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function PlagiarismChecker() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', file);

      const token = localStorage.getItem('token');
      
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

      setResult(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check document');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Plagiarism Checker</h2>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept=".pdf,.docx"
          onChange={handleFileChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Check for Plagiarism'}
        </button>
      </form>

      {result && (
        <div className="results">
          <h3>Results</h3>
          <p>Status: {result.plagiarismCheck.status}</p>
          <p>Similarity: {result.plagiarismCheck.similarityPercentage}%</p>
          <p>Message: {result.plagiarismCheck.message}</p>
          
          {result.matches.length > 0 && (
            <div>
              <h4>Matches Found:</h4>
              <ul>
                {result.matches.map((match, index) => (
                  <li key={index}>
                    {match.documentName} - {match.similarityPercentage}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlagiarismChecker;
```

---

## 📊 Understanding Results

### Similarity Levels

| Percentage | Status | What It Means | Action Required |
|------------|--------|---------------|-----------------|
| **75-100%** | 🔴 High Similarity | Potential plagiarism detected | ⚠️ Immediate review needed |
| **50-74%** | 🟡 Moderate Similarity | Notable similarities found | ⚡ Manual review recommended |
| **25-49%** | 🔵 Low Similarity | Minor overlaps detected | ℹ️ Standard review process |
| **0-24%** | 🟢 Clear | No significant matches | ✅ Appears original |

### Sample Response

```json
{
  "status": "success",
  "data": {
    "plagiarismCheck": {
      "status": "moderate_similarity",
      "similarityPercentage": 62,
      "message": "Moderate similarity detected (62%). Manual review recommended.",
      "totalDocumentsChecked": 45
    },
    "matches": [
      {
        "documentName": "similar_research.pdf",
        "similarityPercentage": 62
      }
    ],
    "report": {
      "summary": {
        "interpretation": "Notable similarities found...",
        "recommendation": "Manual review required..."
      }
    }
  }
}
```

---

## ⚠️ Important Notes

### This is a BASIC plagiarism checker

**Can Detect:**
- ✅ Direct text copying
- ✅ High word-level similarity
- ✅ Internal database matches

**Cannot Detect:**
- ❌ Paraphrased content
- ❌ Translated plagiarism
- ❌ Synonym replacements
- ❌ External sources (internet)

**Use Cases:**
- ✅ Initial screening
- ✅ Self-checking before submission
- ✅ Internal duplicate detection
- ❌ Official academic decisions (use Turnitin/iThenticate)

---

## 🔧 Configuration

### File Size Limit

Current: **10 MB** per file

To change, edit `server/config/multer.js`:
```javascript
limits: {
  fileSize: 20 * 1024 * 1024 // Change to 20MB
}
```

### Similarity Threshold

Default thresholds in `plagiarismChecker.js`:
- High: 75%
- Moderate: 50%
- Low: 25%

To adjust, modify the `compareDocument` method.

### Minimum Text Length

Current: **100 characters**

To change, edit checks in `documentPlagiarismController.js`.

---

## 🐛 Troubleshooting

### Problem: "Please upload a PDF or DOCX file"
**Solution:** Only PDF and DOCX formats are supported. Convert other formats first.

### Problem: "Unable to extract sufficient text"
**Solution:** 
- Ensure PDF is text-based (not scanned images)
- DOCX must contain actual text content
- Minimum 100 characters required

### Problem: "File size exceeds 10MB limit"
**Solution:** Compress document or increase limit in multer config

### Problem: "Not authorized"
**Solution:** Login first and include valid JWT token in Authorization header

---

## 📚 Full Documentation

For complete details, see: [DOCUMENT_PLAGIARISM_DETECTION.md](./DOCUMENT_PLAGIARISM_DETECTION.md)

Includes:
- Detailed API documentation
- Code examples (Frontend & Backend)
- Testing with Postman
- Architecture diagrams
- Performance optimization
- Security considerations

---

## ✅ Checklist

Before using in production:

- [ ] Test with sample PDF files
- [ ] Test with sample DOCX files
- [ ] Verify authentication works
- [ ] Check file upload limits
- [ ] Test error handling
- [ ] Review security settings
- [ ] Add rate limiting
- [ ] Set up logging
- [ ] Configure backups
- [ ] Add usage analytics

---

## 🎓 Next Steps

1. **Test the functionality**
   ```bash
   node utils/testPlagiarismDetection.js
   ```

2. **Start your server**
   ```bash
   npm start
   ```

3. **Try the API endpoints**
   - Use Postman, cURL, or your frontend

4. **Integrate with frontend**
   - Add upload form to your React app
   - Display similarity results
   - Show matched documents

5. **Customize for your needs**
   - Adjust thresholds
   - Modify file size limits
   - Add custom reporting

---

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Verify MongoDB connection
3. Test with sample files first
4. Review the full documentation

---

**Happy coding! 🚀**
