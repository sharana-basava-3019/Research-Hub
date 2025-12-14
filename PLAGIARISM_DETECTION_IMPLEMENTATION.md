# Plagiarism Detection Feature Implementation

## Overview
A simple yet effective plagiarism detection system has been added to the University Research Hub project. The system automatically checks new and updated projects for content similarity against existing projects in the database.

## Implementation Details

### 1. Database Changes
**File**: `server/models/Project.js`

Added the following fields to the Project schema:
- `plagiarism_flag` (Boolean): Indicates if plagiarism was detected
- `plagiarism_score` (Number, 0-1): The similarity score with the matched project
- `matched_project_id` (ObjectId): Reference to the most similar project
- `plagiarism_checked_at` (Date): Timestamp of the last plagiarism check

### 2. Backend Implementation

#### PlagiarismChecker Service
**File**: `server/services/plagiarismChecker.js`

A new service class that uses the `natural` NPM library for NLP operations:

**Features**:
- **Text Cleaning**: Removes punctuation, converts to lowercase, removes stop words
- **Text Extraction**: Combines title, description, abstract, methodology, and keywords
- **TF-IDF Algorithm**: Calculates Term Frequency-Inverse Document Frequency vectors
- **Cosine Similarity**: Computes similarity score between 0 and 1
- **Threshold-based Detection**: Flags projects with similarity ≥ 75% (0.75)

**Key Methods**:
```javascript
- cleanText(text): Normalizes and cleans text
- extractProjectText(project): Extracts all text content from a project
- calculateSimilarity(text1, text2): Returns similarity score
- checkPlagiarism(newProject, existingProjects, threshold): Main checking function
```

#### Controller Integration
**File**: `server/controllers/projectController.js`

**Changes Made**:
1. Added import for PlagiarismChecker service
2. Modified `createProject()`: Runs plagiarism check asynchronously after project creation
3. Modified `updateProject()`: Runs check when title, description, abstract, or methodology changes
4. Added `runPlagiarismCheck()` helper function:
   - Fetches all other projects
   - Runs comparison using PlagiarismChecker
   - Updates project with results
   - Sends notification to owner if plagiarism detected

**Async Processing**:
```javascript
// Non-blocking async call
runPlagiarismCheck(project._id).catch(err => {
  console.error('Plagiarism check failed:', err);
});
```

### 3. Frontend Implementation

#### ProjectDetails Page
**File**: `FRONTEND/src/pages/ProjectDetails.js`

**Changes**:
1. Added plagiarism badge in project header (shows percentage)
2. Added prominent alert box with:
   - Warning icon and heading
   - Similarity score percentage
   - Link to similar project (for owners and professors)
   - Contextual help text based on user role
   - Information about potential false positives

#### Projects List Page
**File**: `FRONTEND/src/pages/Projects.js`

**Changes**:
- Added "Plagiarism Alert" badge next to status and verified badges
- Shows on hover: similarity percentage
- Red color for high visibility

#### Dashboard Page
**File**: `FRONTEND/src/pages/Dashboard.js`

**Changes**:
- Added compact "Plagiarism" badge in project cards
- Consistent styling with other badges

### 4. User Notifications

When plagiarism is detected:
- **Type**: System Announcement
- **Priority**: High
- **Recipient**: Project owner
- **Message**: Includes project title, similarity percentage, and matched project name
- **Link**: Direct link to the flagged project

### 5. Key Features

#### Performance Optimizations
- ✅ **Non-blocking**: Plagiarism check runs asynchronously, doesn't delay API response
- ✅ **Background processing**: Uses Promise with catch to prevent UI blocking
- ✅ **Selective checking**: Only runs when relevant content changes

#### Accuracy Features
- ✅ **Stop-word removal**: Filters out common English words (the, a, is, etc.)
- ✅ **TF-IDF weighting**: Gives more importance to unique terms
- ✅ **Minimum text requirement**: Requires at least 50 characters for meaningful check
- ✅ **Self-exclusion**: Project is never compared with itself

#### User Experience
- ✅ **Visual warnings**: Red badges and alert boxes
- ✅ **Contextual help**: Different messages for owners vs professors
- ✅ **Transparency**: Shows exact similarity percentage
- ✅ **Comparison access**: Link to view similar project
- ✅ **False positive disclaimer**: Acknowledges automated check limitations

### 6. Configuration

**Similarity Threshold**: 75% (0.75)
- Can be adjusted in `runPlagiarismCheck()` function
- Located in `server/controllers/projectController.js`

**Stop Words**: Configurable in `plagiarismChecker.js`
- Current list includes ~30 common English words
- Can be expanded as needed

### 7. Testing Recommendations

1. **Create Test Projects**:
   - Create project A with specific content
   - Create project B with 80%+ similar content
   - Verify plagiarism flag appears

2. **Check Notifications**:
   - Verify owner receives notification
   - Check notification contains correct info

3. **Frontend Display**:
   - Verify badges appear on all pages
   - Test link to similar project
   - Check alert box styling

4. **Edge Cases**:
   - Very short projects (< 50 chars)
   - Projects with no description
   - Projects with only keywords

### 8. Dependencies Added

**NPM Package**: `natural` (already installed)
- Purpose: Natural Language Processing
- Features used: Tokenization, TF-IDF, text analysis
- License: MIT

### 9. Future Enhancements (Optional)

1. **Manual Override**: Allow professors to dismiss false positives
2. **Detailed Report**: Show which specific sections are similar
3. **Historical Tracking**: Log all plagiarism checks with timestamps
4. **Batch Processing**: Check all existing projects on deployment
5. **Advanced Algorithms**: Consider Jaccard similarity, n-grams, or external APIs
6. **Whitelist**: Allow intentional duplicates (templates, examples)

## Usage

### For Students/Researchers
- Submit projects normally
- Check notifications for plagiarism alerts
- Review flagged content if notified
- Contact professor if false positive

### For Professors
- Red "Plagiarism Alert" badge appears on flagged projects
- Click "View similar project" to compare side-by-side
- Use similarity percentage to assess severity
- Remember automated checks may have false positives

### For Administrators
- Monitor plagiarism trends via database queries
- Adjust threshold if too many false positives/negatives
- Review edge cases and improve algorithm

## Technical Notes

- **Algorithm**: TF-IDF + Cosine Similarity
- **Performance**: O(n) where n = number of projects
- **Processing**: Asynchronous, non-blocking
- **Threshold**: 75% similarity triggers flag
- **Scope**: Compares title, description, abstract, methodology, keywords
- **Language**: English text processing with stop-word removal

## Files Modified/Created

### Backend
- ✅ `server/models/Project.js` (modified)
- ✅ `server/services/plagiarismChecker.js` (created)
- ✅ `server/controllers/projectController.js` (modified)

### Frontend
- ✅ `FRONTEND/src/pages/ProjectDetails.js` (modified)
- ✅ `FRONTEND/src/pages/Projects.js` (modified)
- ✅ `FRONTEND/src/pages/Dashboard.js` (modified)

### Dependencies
- ✅ `natural` NPM package (installed)

## Conclusion

The plagiarism detection feature is now fully integrated into the Research Hub platform. It provides automated, non-intrusive checking with clear visual indicators for both students and professors. The implementation is lightweight, fast, and maintains the existing coding style and architecture of the project.
