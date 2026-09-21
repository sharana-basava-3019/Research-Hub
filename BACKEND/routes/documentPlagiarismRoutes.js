/**
 * Document Plagiarism Routes
 * API routes for document plagiarism checking
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  checkDocument,
  compareDocuments,
  getPlagiarismStats
} = require('../controllers/documentPlagiarismController');

// Dedicated in-memory multer for plagiarism routes.
// Files are kept as Buffers in RAM for text extraction and NEVER persisted —
// no disk, no Cloudinary. 10 MB limit covers typical academic documents.
const plagiarismUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are supported for plagiarism checking'), false);
    }
  },
});

/**
 * @route   POST /api/plagiarism/check-document
 * @desc    Upload a document and check it for plagiarism against existing documents
 * @access  Private
 * @body    file (PDF or DOCX)
 */
router.post('/check-document', protect, plagiarismUpload.single('document'), checkDocument);

/**
 * @route   POST /api/plagiarism/compare-documents
 * @desc    Upload two documents and compare them for similarity
 * @access  Private
 * @body    files (2 documents: PDF or DOCX)
 */
router.post('/compare-documents', protect, plagiarismUpload.array('documents', 2), compareDocuments);

/**
 * @route   GET /api/plagiarism/stats
 * @desc    Get statistics about documents available for plagiarism checking
 * @access  Private
 */
router.get('/stats', protect, getPlagiarismStats);

module.exports = router;
