/**
 * Document Plagiarism Routes
 * API routes for document plagiarism checking
 */

const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  checkDocument,
  compareDocuments,
  getPlagiarismStats
} = require('../controllers/documentPlagiarismController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/plagiarism/check-document
 * @desc    Upload a document and check it for plagiarism against existing documents
 * @access  Private
 * @body    file (PDF or DOCX)
 */
router.post('/check-document', protect, upload.single('document'), checkDocument);

/**
 * @route   POST /api/plagiarism/compare-documents
 * @desc    Upload two documents and compare them for similarity
 * @access  Private
 * @body    files (2 documents: PDF or DOCX)
 */
router.post('/compare-documents', protect, upload.array('documents', 2), compareDocuments);

/**
 * @route   GET /api/plagiarism/stats
 * @desc    Get statistics about documents available for plagiarism checking
 * @access  Private
 */
router.get('/stats', protect, getPlagiarismStats);

module.exports = router;
