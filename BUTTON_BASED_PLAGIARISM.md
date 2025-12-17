# 🔘 Manual Button-Based Plagiarism Detection

## Overview

Plagiarism checking is now **manual and on-demand**. Users click a button to check project metadata or uploaded files, and receive immediate results with warnings if plagiarism is detected.

---

## 🎯 How It Works

### Flow Diagram

```
User clicks "Check Plagiarism" button
        ↓
API request sent to server
        ↓
Server processes request (extracts text, compares, calculates)
        ↓
Results returned immediately with warning flag
        ↓
Frontend displays results
        ↓
If warning: Show alert/modal with similarity percentage
```

**Key Feature:** Results are returned **immediately** in the API response - no background processing, no notifications.

---

## 📡 API Endpoints

### 1. Check Project Metadata

Check title, description, abstract, methodology for plagiarism.

**Endpoint:**
```
POST /api/projects/:id/check-metadata-plagiarism
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/projects/507f1f77bcf86cd799439011/check-metadata-plagiarism \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response with Warning:**
```json
{
  "status": "success",
  "warning": true,
  "data": {
    "projectTitle": "AI in Healthcare",
    "plagiarismCheck": {
      "plagiarismDetected": true,
      "similarityPercentage": 78,
      "similarityScore": 0.78,
      "message": "High similarity detected (78%)",
      "totalProjectsChecked": 124
    },
    "matchedProject": {
      "id": "507f1f77bcf86cd799439012",
      "title": "Similar AI Healthcare Research",
      "owner": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@university.edu"
      }
    },
    "recommendation": "⚠️ High similarity detected (78%). Please review the project content for potential plagiarism."
  }
}
```

**Response without Warning:**
```json
{
  "status": "success",
  "warning": false,
  "data": {
    "projectTitle": "AI in Healthcare",
    "plagiarismCheck": {
      "plagiarismDetected": false,
      "similarityPercentage": 35,
      "similarityScore": 0.35,
      "message": "No significant plagiarism detected",
      "totalProjectsChecked": 124
    },
    "matchedProject": null,
    "recommendation": "✓ No significant plagiarism detected (35% similarity)."
  }
}
```

---

### 2. Check Single Document/File

Check a specific uploaded PDF or DOCX file.

**Endpoint:**
```
POST /api/projects/:id/attachments/:attachmentId/check-plagiarism
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/projects/507f1f77bcf86cd799439011/attachments/507f1f77bcf86cd799439013/check-plagiarism \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response with Warning:**
```json
{
  "status": "success",
  "warning": true,
  "data": {
    "filename": "research_paper.pdf",
    "plagiarismCheck": {
      "status": "high_similarity",
      "similarityPercentage": 82,
      "message": "High similarity detected (82%). This document may contain plagiarized content.",
      "totalDocumentsChecked": 156
    },
    "matches": [
      {
        "documentId": "507f1f77bcf86cd799439014",
        "documentName": "thesis.pdf",
        "similarityPercentage": 82,
        "projectTitle": "Previous Research Project"
      }
    ],
    "mostSimilarDocument": {
      "id": "507f1f77bcf86cd799439014",
      "name": "thesis.pdf",
      "similarityPercentage": 82
    },
    "report": {
      "summary": {
        "status": "high_similarity",
        "similarityPercentage": "82%",
        "interpretation": "Significant portions of this document match existing content.",
        "recommendation": "Do not approve this submission. Contact the author."
      }
    }
  }
}
```

---

### 3. Check All Documents in Project

Check all PDF/DOCX files in a project at once.

**Endpoint:**
```
POST /api/projects/:id/check-all-attachments
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/projects/507f1f77bcf86cd799439011/check-all-attachments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response with Warnings:**
```json
{
  "status": "success",
  "warning": true,
  "message": "⚠️ Plagiarism detected in one or more files! Please review the results.",
  "data": {
    "totalAttachments": 5,
    "checkedAttachments": 3,
    "filesWithWarnings": 2,
    "results": [
      {
        "filename": "research_paper.pdf",
        "checked": true,
        "warning": true,
        "status": "high_similarity",
        "similarityPercentage": 82,
        "message": "High similarity detected (82%)",
        "mostSimilarDocument": {
          "id": "507f...",
          "name": "thesis.pdf",
          "similarityPercentage": 82
        }
      },
      {
        "filename": "chapter1.docx",
        "checked": true,
        "warning": true,
        "status": "moderate_similarity",
        "similarityPercentage": 65,
        "message": "Moderate similarity detected (65%)"
      },
      {
        "filename": "references.pdf",
        "checked": true,
        "warning": false,
        "status": "clear",
        "similarityPercentage": 15,
        "message": "No significant plagiarism detected"
      },
      {
        "filename": "image.jpg",
        "checked": false,
        "reason": "Not a PDF or DOCX file"
      },
      {
        "filename": "data.csv",
        "checked": false,
        "reason": "Not a PDF or DOCX file"
      }
    ]
  }
}
```

---

## 💻 Frontend Integration

### Example 1: Check Project Metadata Button

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function ProjectPlagiarismCheck({ projectId }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkMetadata = async () => {
    setChecking(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/projects/${projectId}/check-metadata-plagiarism`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { warning, data } = response.data;
      setResult(data);

      // Show warning if plagiarism detected
      if (warning) {
        alert(
          `⚠️ PLAGIARISM WARNING!\n\n` +
          `Similarity: ${data.plagiarismCheck.similarityPercentage}%\n` +
          `${data.recommendation}\n\n` +
          (data.matchedProject ? `Similar to: "${data.matchedProject.title}"` : '')
        );
      } else {
        alert(`✓ No plagiarism detected!\n\n${data.recommendation}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check plagiarism. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <button 
        onClick={checkMetadata}
        disabled={checking}
        className="btn btn-warning"
      >
        {checking ? '⏳ Checking...' : '🔍 Check Project Plagiarism'}
      </button>

      {result && (
        <div className={`alert ${result.plagiarismCheck.plagiarismDetected ? 'alert-danger' : 'alert-success'} mt-3`}>
          <h5>Plagiarism Check Results</h5>
          <p><strong>Similarity:</strong> {result.plagiarismCheck.similarityPercentage}%</p>
          <p>{result.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default ProjectPlagiarismCheck;
```

---

### Example 2: Check Document Button

```javascript
function DocumentPlagiarismCheck({ projectId, attachment }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkDocument = async () => {
    setChecking(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/projects/${projectId}/attachments/${attachment._id}/check-plagiarism`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { warning, data } = response.data;
      setResult(data);

      if (warning) {
        // Show detailed warning modal
        showWarningModal(data);
      } else {
        alert(`✓ No plagiarism detected in ${attachment.filename}`);
      }
    } catch (error) {
      alert('Failed to check document');
    } finally {
      setChecking(false);
    }
  };

  const showWarningModal = (data) => {
    const message = 
      `⚠️ PLAGIARISM DETECTED!\n\n` +
      `File: ${data.filename}\n` +
      `Similarity: ${data.plagiarismCheck.similarityPercentage}%\n` +
      `Status: ${data.plagiarismCheck.status}\n\n` +
      `${data.plagiarismCheck.message}\n\n` +
      (data.mostSimilarDocument 
        ? `Most similar to: ${data.mostSimilarDocument.name} (${data.mostSimilarDocument.similarityPercentage}%)`
        : ''
      );
    
    alert(message);
  };

  return (
    <button 
      onClick={checkDocument}
      disabled={checking}
      className="btn btn-sm btn-outline-warning"
    >
      {checking ? '⏳' : '🔍'} Check
    </button>
  );
}
```

---

### Example 3: Check All Documents Button

```javascript
function CheckAllDocuments({ projectId }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const checkAll = async () => {
    setChecking(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/projects/${projectId}/check-all-attachments`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { warning, message, data } = response.data;
      setResults(data);

      // Show summary
      alert(
        `${message}\n\n` +
        `Total Attachments: ${data.totalAttachments}\n` +
        `Checked: ${data.checkedAttachments}\n` +
        `Files with Warnings: ${data.filesWithWarnings}`
      );

      // If warnings, show detailed results
      if (warning) {
        showDetailedResults(data.results);
      }
    } catch (error) {
      alert('Failed to check documents');
    } finally {
      setChecking(false);
    }
  };

  const showDetailedResults = (results) => {
    const warnings = results.filter(r => r.warning);
    console.log('Files with plagiarism:', warnings);
    // Render in UI or show modal
  };

  return (
    <div>
      <button 
        onClick={checkAll}
        disabled={checking}
        className="btn btn-warning"
      >
        {checking ? '⏳ Checking All Files...' : '🔍 Check All Documents'}
      </button>

      {results && (
        <div className="mt-3">
          <h5>Results Summary</h5>
          <ul>
            {results.results.map((file, idx) => (
              <li key={idx} className={file.warning ? 'text-danger' : 'text-success'}>
                {file.filename}: 
                {file.checked 
                  ? ` ${file.similarityPercentage}% ${file.warning ? '⚠️' : '✓'}`
                  : ` ${file.reason}`
                }
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

### Example 4: Complete UI Component

```jsx
import React, { useState } from 'react';
import { Alert, Button, Modal, Badge, Spinner } from 'react-bootstrap';

function PlagiarismChecker({ projectId, attachments }) {
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  const handleCheckMetadata = async () => {
    setChecking(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/check-metadata-plagiarism`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const result = await response.json();
      
      if (result.warning) {
        setModalData({
          type: 'metadata',
          title: 'Project Metadata Plagiarism Warning',
          data: result.data
        });
        setShowModal(true);
      } else {
        alert('✓ No plagiarism detected in project metadata');
      }
    } catch (error) {
      alert('Error checking plagiarism');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckDocument = async (attachmentId, filename) => {
    setChecking(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/attachments/${attachmentId}/check-plagiarism`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const result = await response.json();
      
      if (result.warning) {
        setModalData({
          type: 'document',
          title: `Plagiarism Warning: ${filename}`,
          data: result.data
        });
        setShowModal(true);
      } else {
        alert(`✓ No plagiarism detected in ${filename}`);
      }
    } catch (error) {
      alert('Error checking document');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="plagiarism-checker">
      <h4>Plagiarism Detection</h4>
      
      {/* Check Project Metadata */}
      <div className="mb-3">
        <Button 
          variant="warning" 
          onClick={handleCheckMetadata}
          disabled={checking}
        >
          {checking ? <Spinner size="sm" /> : '🔍'} Check Project Metadata
        </Button>
      </div>

      {/* Check Individual Documents */}
      <h5>Documents</h5>
      <ul className="list-group">
        {attachments?.filter(a => a.filename.match(/\.(pdf|docx)$/i)).map(attachment => (
          <li key={attachment._id} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{attachment.filename}</span>
            <div>
              {attachment.plagiarism_checked && (
                <Badge bg={getPlagiarismBadgeColor(attachment.plagiarism_status)}>
                  {Math.round(attachment.plagiarism_score * 100)}%
                </Badge>
              )}
              <Button 
                size="sm" 
                variant="outline-warning" 
                className="ms-2"
                onClick={() => handleCheckDocument(attachment._id, attachment.filename)}
                disabled={checking}
              >
                {checking ? <Spinner size="sm" /> : '🔍'} Check
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Warning Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>⚠️ {modalData?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalData?.type === 'metadata' && (
            <div>
              <Alert variant="danger">
                <h5>Similarity: {modalData.data.plagiarismCheck.similarityPercentage}%</h5>
                <p>{modalData.data.recommendation}</p>
              </Alert>
              {modalData.data.matchedProject && (
                <div>
                  <h6>Similar to:</h6>
                  <p><strong>{modalData.data.matchedProject.title}</strong></p>
                  <p>By: {modalData.data.matchedProject.owner.firstName} {modalData.data.matchedProject.owner.lastName}</p>
                </div>
              )}
            </div>
          )}
          {modalData?.type === 'document' && (
            <div>
              <Alert variant="danger">
                <h5>Similarity: {modalData.data.plagiarismCheck.similarityPercentage}%</h5>
                <p>{modalData.data.plagiarismCheck.message}</p>
              </Alert>
              {modalData.data.matches?.length > 0 && (
                <div>
                  <h6>Similar Documents:</h6>
                  <ul>
                    {modalData.data.matches.map((match, idx) => (
                      <li key={idx}>
                        {match.documentName} - {match.similarityPercentage}%
                        {match.projectTitle && ` (${match.projectTitle})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function getPlagiarismBadgeColor(status) {
  switch(status) {
    case 'high_similarity': return 'danger';
    case 'moderate_similarity': return 'warning';
    case 'low_similarity': return 'info';
    case 'clear': return 'success';
    default: return 'secondary';
  }
}

export default PlagiarismChecker;
```

---

## 🎨 UI Design Suggestions

### Button Placement

**Project Details Page:**
```
┌─────────────────────────────────────┐
│  Project Title                      │
│  Description...                     │
│                                     │
│  [🔍 Check Project Plagiarism]     │ ← Button for metadata
│                                     │
│  Files:                             │
│  📄 paper.pdf      [🔍 Check]      │ ← Button per file
│  📄 thesis.docx    [🔍 Check]      │
│                                     │
│  [🔍 Check All Documents]          │ ← Button for all files
└─────────────────────────────────────┘
```

### Warning Display

**Alert Box:**
```
┌─────────────────────────────────────┐
│  ⚠️ PLAGIARISM WARNING              │
│                                     │
│  Similarity: 82%                    │
│  Status: High Similarity            │
│                                     │
│  This document shows significant    │
│  similarity with existing content.  │
│                                     │
│  Similar to: "thesis.pdf" (82%)    │
│                                     │
│  [View Details] [Close]             │
└─────────────────────────────────────┘
```

---

## 📊 Response Status Guide

### Warning Flag

The `warning` field in the response indicates if user action is needed:

- `warning: true` → Show alert/modal, highlight in red
- `warning: false` → Show success message, continue normally

### Similarity Levels

| Percentage | Status | Warning | Color | Action |
|------------|--------|---------|-------|--------|
| 75-100% | `high_similarity` | ✓ Yes | 🔴 Red | Block/Review |
| 50-74% | `moderate_similarity` | ✓ Yes | 🟡 Yellow | Review |
| 25-49% | `low_similarity` | ✗ No | 🔵 Blue | Informational |
| 0-24% | `clear` | ✗ No | 🟢 Green | Approved |

---

## 🚀 Quick Implementation

### Step 1: Add Button to Project Page

```jsx
// In your ProjectDetails.jsx
<Button onClick={() => checkPlagiarism()}>
  🔍 Check Plagiarism
</Button>
```

### Step 2: Implement Check Function

```javascript
const checkPlagiarism = async () => {
  const response = await axios.post(`/api/projects/${projectId}/check-metadata-plagiarism`);
  
  if (response.data.warning) {
    alert(`⚠️ WARNING: ${response.data.data.plagiarismCheck.similarityPercentage}% similarity detected!`);
  } else {
    alert('✓ No plagiarism detected');
  }
};
```

### Step 3: Test

1. Click the button
2. Wait for results (5-30 seconds depending on database size)
3. See immediate warning or success message

---

## ⚡ Performance Notes

- **Metadata check:** ~2-5 seconds (checks ~100-200 projects)
- **Single document:** ~5-15 seconds (extracts text + compares)
- **All documents:** ~10-60 seconds (depends on number of files)

**Tip:** Show a loading spinner while checking!

---

## 🔒 Permissions

- **Owner** → Can check their own projects
- **Collaborators** → Can check projects they collaborate on
- **Professors/Admins** → Can check any project

---

**The system now uses manual button-based checking with immediate results and warnings!** 🎉
