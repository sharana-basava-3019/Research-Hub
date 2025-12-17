# 🤖 Automatic Document Plagiarism Detection

## Overview

The system now **automatically checks PDF and DOCX files for plagiarism** when they are uploaded to projects! You don't need to manually trigger checks anymore.

---

## 🎯 How It Works Now

### When You Upload a File

```
1. User uploads PDF or DOCX file to project
        ↓
2. File is saved to project attachments
        ↓
3. System immediately queues plagiarism check (background)
        ↓
4. User receives response: "File uploaded successfully"
        ↓
5. System extracts text and compares against all existing documents
        ↓
6. Results saved to attachment record
        ↓
7. If high/moderate similarity → User receives notification
```

### What Gets Checked Automatically

✅ **PDF files** - Automatically checked  
✅ **DOCX files** - Automatically checked  
❌ **Other files** - Not checked (images, videos, etc.)

---

## 📊 Plagiarism Status in Attachments

Each attachment now has plagiarism detection fields:

```javascript
{
  filename: "research_paper.pdf",
  url: "/uploads/projects/123-research_paper.pdf",
  fileSize: 245678,
  mimeType: "application/pdf",
  
  // NEW: Plagiarism detection fields
  plagiarism_checked: true,
  plagiarism_score: 0.68,              // 0.0 to 1.0
  plagiarism_status: "moderate_similarity",  // Status level
  matched_document_id: ObjectId("..."), // Most similar document
  plagiarism_checked_at: Date("...")   // When checked
}
```

### Plagiarism Status Values

| Status | Similarity | Meaning | Color |
|--------|-----------|---------|-------|
| `not_checked` | - | File hasn't been checked yet | Gray |
| `clear` | 0-24% | No significant matches | 🟢 Green |
| `low_similarity` | 25-49% | Minor overlaps found | 🔵 Blue |
| `moderate_similarity` | 50-74% | Notable similarities | 🟡 Yellow |
| `high_similarity` | 75-100% | Likely plagiarism | 🔴 Red |

---

## 🔔 Notifications

You'll receive automatic notifications for:

- **High Similarity (75%+)** - Priority: High
- **Moderate Similarity (50-74%)** - Priority: Medium

**Notification includes:**
- File name
- Project title
- Similarity percentage
- Link to project

---

## 🛠️ Manual Checks

If you uploaded files before this feature was enabled, you can manually check them:

### Check a Single File

```bash
POST /api/projects/:projectId/attachments/:attachmentId/check-plagiarism
Authorization: Bearer YOUR_TOKEN
```

**Example Response:**
```json
{
  "status": "success",
  "message": "Plagiarism check started. You will receive a notification when complete.",
  "data": {
    "attachmentId": "507f1f77bcf86cd799439011",
    "filename": "research_paper.pdf",
    "checkQueued": true
  }
}
```

### Check All Files in a Project

```bash
POST /api/projects/:projectId/check-all-attachments
Authorization: Bearer YOUR_TOKEN
```

**Example Response:**
```json
{
  "status": "success",
  "message": "Plagiarism checks started for 3 file(s). You will receive notifications when complete.",
  "data": {
    "totalAttachments": 5,
    "checkableAttachments": 3,
    "filesQueued": [
      "research_paper.pdf",
      "thesis_chapter1.docx",
      "methodology.pdf"
    ]
  }
}
```

---

## 🎨 Frontend Integration

### Display Plagiarism Status

```javascript
// In your project details component
const getPlagiarismBadge = (attachment) => {
  if (!attachment.plagiarism_checked) {
    return <span className="badge badge-secondary">Not Checked</span>;
  }
  
  switch (attachment.plagiarism_status) {
    case 'high_similarity':
      return (
        <span className="badge badge-danger">
          ⚠️ {Math.round(attachment.plagiarism_score * 100)}% Similar
        </span>
      );
    case 'moderate_similarity':
      return (
        <span className="badge badge-warning">
          ⚡ {Math.round(attachment.plagiarism_score * 100)}% Similar
        </span>
      );
    case 'low_similarity':
      return (
        <span className="badge badge-info">
          ℹ️ {Math.round(attachment.plagiarism_score * 100)}% Similar
        </span>
      );
    case 'clear':
      return (
        <span className="badge badge-success">
          ✓ Original ({Math.round(attachment.plagiarism_score * 100)}%)
        </span>
      );
    default:
      return <span className="badge badge-secondary">Unknown</span>;
  }
};

// Use in your component
<div className="attachment-item">
  <span>{attachment.filename}</span>
  {getPlagiarismBadge(attachment)}
</div>
```

### Trigger Manual Check

```javascript
const checkAttachmentPlagiarism = async (projectId, attachmentId) => {
  try {
    const response = await axios.post(
      `/api/projects/${projectId}/attachments/${attachmentId}/check-plagiarism`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    alert(response.data.message);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to start plagiarism check');
  }
};

// Button in your UI
<button onClick={() => checkAttachmentPlagiarism(projectId, attachmentId)}>
  Check Plagiarism
</button>
```

### Check All Attachments

```javascript
const checkAllAttachments = async (projectId) => {
  try {
    const response = await axios.post(
      `/api/projects/${projectId}/check-all-attachments`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    alert(response.data.message);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to start plagiarism checks');
  }
};

// Button for project owner
<button onClick={() => checkAllAttachments(projectId)}>
  Check All Documents
</button>
```

---

## 🔍 Example Scenarios

### Scenario 1: New File Upload

```
User uploads "research_paper.pdf"
  ↓
System saves file and returns success immediately
  ↓
Background: System extracts text (3 seconds)
  ↓
Background: Compares against 100 existing documents (30 seconds)
  ↓
Background: Finds 65% similarity with existing paper
  ↓
Background: Updates attachment record
  ↓
User receives notification: "research_paper.pdf shows 65% similarity"
```

### Scenario 2: Checking Existing Files

```
User has 5 files uploaded before feature was enabled
  ↓
User clicks "Check All Documents" button
  ↓
System queues checks for 3 PDF/DOCX files
  ↓
Background: Processes each file sequentially
  ↓
User receives 3 notifications with results
```

---

## ⚙️ Technical Details

### Database Schema Updates

**Project.attachments now includes:**
```javascript
plagiarism_checked: Boolean        // Has it been checked?
plagiarism_score: Number           // 0.0 to 1.0 similarity score
plagiarism_status: String          // Status level
matched_document_id: ObjectId      // Most similar document
plagiarism_checked_at: Date        // When was it checked
```

### Processing Time

| Documents in Database | Average Check Time |
|----------------------|-------------------|
| 10 documents | ~5 seconds |
| 50 documents | ~20 seconds |
| 100 documents | ~40 seconds |
| 200 documents | ~80 seconds |

**Note:** Checks run in the background, so users don't wait!

---

## 🚨 Important Notes

### What This System Does

✅ Checks text similarity between documents  
✅ Detects direct copying and high overlap  
✅ Compares against YOUR database only  
✅ Works automatically on upload  
✅ Sends notifications for high similarity  

### What This System Does NOT Do

❌ Check against internet sources  
❌ Detect paraphrased content  
❌ Detect translated plagiarism  
❌ Check non-text content (images, tables)  
❌ Replace professional tools (Turnitin, etc.)  

### Best Practices

1. ✅ **Use as preliminary screening** - First line of defense
2. ✅ **Review flagged documents manually** - Don't auto-reject
3. ✅ **Check citations** - High similarity might be from proper citations
4. ✅ **Use professional tools for final decisions** - This is a basic check
5. ✅ **Educate users** - Explain what the system can and cannot detect

---

## 📊 Viewing Results

### In API Response (when fetching project)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Research Project",
  "attachments": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "filename": "research_paper.pdf",
      "url": "/uploads/projects/123-research_paper.pdf",
      "fileSize": 245678,
      "mimeType": "application/pdf",
      "plagiarism_checked": true,
      "plagiarism_score": 0.68,
      "plagiarism_status": "moderate_similarity",
      "matched_document_id": "507f1f77bcf86cd799439013",
      "plagiarism_checked_at": "2025-12-15T10:30:00.000Z"
    }
  ]
}
```

### In Notifications

```json
{
  "type": "SYSTEM_ANNOUNCEMENT",
  "title": "Document Plagiarism Alert",
  "message": "File \"research_paper.pdf\" in project \"My Research Project\" shows 68% similarity with existing documents. Please review.",
  "priority": "medium",
  "link": "/projects/507f1f77bcf86cd799439011"
}
```

---

## 🔧 Troubleshooting

### File Not Being Checked?

**Check:**
1. Is it a PDF or DOCX file?
2. Does the file have text content (not scanned images)?
3. Does the file have at least 100 characters of text?
4. Check server logs for errors

### Check Taking Too Long?

**Normal delays:**
- Text extraction: 1-5 seconds per file
- Comparison: 0.5 seconds per document in database
- Total: Can be 30-60 seconds with 100 documents

**If stuck:**
- Check server logs
- File might have extraction errors
- Status will show "not_checked" if failed

### No Notification Received?

**Possible reasons:**
1. Similarity is below 50% (no notification sent)
2. Check failed (see server logs)
3. Notifications are disabled for your account

---

## 🎯 Summary

### For Users

- **Upload files normally** - Plagiarism check happens automatically
- **Wait for notification** - You'll be alerted if similarity is found
- **Review results** - Check the plagiarism badge on each file
- **Manual check available** - For files uploaded before this feature

### For Developers

- **Auto-triggered on upload** - `uploadAttachment` controller
- **Background processing** - Non-blocking async checks
- **Database fields added** - Attachment schema updated
- **New endpoints** - Manual check options available
- **Notification system** - Integrated for alerts

---

**The plagiarism detection now works automatically - no manual intervention needed!** 🎉
