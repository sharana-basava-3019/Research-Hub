/**
 * Document Plagiarism Controller
 * Handles document upload and plagiarism checking for PDF and DOCX files.
 * Files are handled as in-memory Buffers (memoryStorage multer) — no disk I/O.
 * Existing project attachments are downloaded from Cloudinary for comparison.
 */

const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Project = require('../models/Project');
const DocumentExtractor = require('../services/documentExtractor');
const PlagiarismChecker = require('../services/plagiarismChecker');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * Download a Cloudinary (or any HTTPS) URL to a temporary local file.
 * Returns the temp file path on success, or null if download fails.
 * Caller is responsible for deleting the temp file after use.
 * @param {String} url - Remote file URL
 * @param {String} filename - Original filename (used to derive extension)
 * @returns {Promise<String|null>}
 */
async function downloadToTemp(url, filename) {
  try {
    if (!url) return null;
    const ext = path.extname(filename) || '.tmp';
    const tmpFile = path.join(os.tmpdir(), `rh-${crypto.randomBytes(8).toString('hex')}${ext}`);
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      fs.writeFileSync(tmpFile, response.data);
      return tmpFile;
    } else {
      const localPath = path.join(__dirname, '..', url);
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, tmpFile);
        return tmpFile;
      }
      return null;
    }
  } catch (err) {
    console.warn(`Could not download attachment for plagiarism check (${filename}): ${err.message}`);
    return null;
  }
}

/**
 * @desc    Check document for plagiarism
 * @route   POST /api/plagiarism/check-document
 * @access  Private
 */
exports.checkDocument = asyncHandler(async (req, res, next) => {
  // File arrives as a Buffer via memoryStorage multer
  if (!req.file || !req.file.buffer) {
    return next(new ErrorResponse('Please upload a PDF or DOCX file', 400));
  }

  const fileBuffer = req.file.buffer;
  const fileMime  = req.file.mimetype;

  // Validate buffer (size + MIME type)
  const validation = DocumentExtractor.validateBuffer(fileBuffer, fileMime, 10);
  if (!validation.valid) {
    return next(new ErrorResponse(validation.error, 400));
  }

  try {
    // Extract text from the uploaded buffer
    const uploadedText = await DocumentExtractor.extractTextFromBuffer(fileBuffer, fileMime);

    if (!uploadedText || uploadedText.trim().length < 100) {
      return next(new ErrorResponse('Unable to extract sufficient text from document. Minimum 100 characters required.', 400));
    }

    // Get all projects with attachments to compare against
    const projects = await Project.find({ 'attachments.0': { $exists: true } })
      .select('title attachments owner')
      .populate('owner', 'firstName lastName username email')
      .lean();

    // Prepare existing documents for comparison — download each from Cloudinary
    const existingDocuments = [];
    const tempFiles = [];

    for (const project of projects) {
      if (!project.attachments || project.attachments.length === 0) continue;

      for (const attachment of project.attachments) {
        // Only process PDF and DOCX files
        if (!attachment.filename.match(/\.(pdf|docx)$/i)) continue;

        const tempPath = await downloadToTemp(attachment.url, attachment.filename);
        if (!tempPath) continue;
        tempFiles.push(tempPath);

        try {
          const attachmentText = await DocumentExtractor.extractText(tempPath);
          if (attachmentText && attachmentText.trim().length >= 100) {
            existingDocuments.push({
              _id: attachment._id,
              filename: attachment.filename,
              text: attachmentText,
              projectTitle: project.title,
              projectId: project._id,
              uploadedBy: project.owner
            });
          }
        } catch (error) {
          console.error(`Error extracting text from ${attachment.filename}:`, error.message);
          // Continue with other documents
        }
      }
    }

    // Perform plagiarism check
    const comparisonResult = await PlagiarismChecker.compareDocument(uploadedText, existingDocuments);

    // Generate detailed report
    const report = PlagiarismChecker.generateReport(comparisonResult);

    // Clean up all temp files
    tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });

    // Return results
    res.status(200).json({
      status: 'success',
      message: 'Document plagiarism check completed',
      data: {
        uploadedFile: {
          originalName: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          textLength: uploadedText.length
        },
        plagiarismCheck: {
          status: comparisonResult.status,
          similarityPercentage: comparisonResult.similarityPercentage,
          message: comparisonResult.message,
          totalDocumentsChecked: comparisonResult.totalDocumentsChecked
        },
        matches: comparisonResult.matches,
        mostSimilarDocument: comparisonResult.mostSimilarDocument,
        report: report,
        disclaimer: 'This is a BASIC plagiarism check using text similarity algorithms. It is NOT a replacement for professional plagiarism detection tools like Turnitin or iThenticate. Results may include false positives from common phrases, properly cited content, or standard terminology.'
      }
    });

  } catch (error) {
    console.error('Error in document plagiarism check:', error);
    return next(new ErrorResponse('Failed to process document for plagiarism check', 500));
  }
});

/**
 * @desc    Compare two uploaded documents
 * @route   POST /api/plagiarism/compare-documents
 * @access  Private
 */
exports.compareDocuments = asyncHandler(async (req, res, next) => {
  // Files arrive as Buffers via memoryStorage multer
  if (!req.files || req.files.length !== 2) {
    return next(new ErrorResponse('Please upload exactly 2 documents (PDF or DOCX)', 400));
  }

  const file1 = req.files[0];
  const file2 = req.files[1];

  // Validate both buffers
  const validation1 = DocumentExtractor.validateBuffer(file1.buffer, file1.mimetype, 10);
  const validation2 = DocumentExtractor.validateBuffer(file2.buffer, file2.mimetype, 10);

  if (!validation1.valid) {
    return next(new ErrorResponse(`Document 1: ${validation1.error}`, 400));
  }
  if (!validation2.valid) {
    return next(new ErrorResponse(`Document 2: ${validation2.error}`, 400));
  }

  try {
    // Extract text from both buffers
    const text1 = await DocumentExtractor.extractTextFromBuffer(file1.buffer, file1.mimetype);
    const text2 = await DocumentExtractor.extractTextFromBuffer(file2.buffer, file2.mimetype);

    if (!text1 || text1.trim().length < 100) {
      return next(new ErrorResponse('Document 1: Unable to extract sufficient text', 400));
    }
    if (!text2 || text2.trim().length < 100) {
      return next(new ErrorResponse('Document 2: Unable to extract sufficient text', 400));
    }

    // Calculate similarity
    const similarity = PlagiarismChecker.calculateSimilarity(text1, text2);
    const similarityPercentage = Math.round(similarity * 100);

    // Determine status
    let status = 'clear';
    if (similarity >= 0.75) status = 'high_similarity';
    else if (similarity >= 0.50) status = 'moderate_similarity';
    else if (similarity >= 0.25) status = 'low_similarity';

    res.status(200).json({
      status: 'success',
      message: 'Documents compared successfully',
      data: {
        document1: {
          originalName: file1.originalname,
          size: file1.size,
          textLength: text1.length
        },
        document2: {
          originalName: file2.originalname,
          size: file2.size,
          textLength: text2.length
        },
        comparison: {
          status,
          similarityPercentage,
          similarityScore: similarity,
          message: PlagiarismChecker.getStatusMessage(status, similarityPercentage),
          interpretation: PlagiarismChecker.getInterpretation(status)
        },
        disclaimer: 'This is a BASIC text similarity check. It does NOT detect paraphrasing, translated content, or sophisticated plagiarism techniques.'
      }
    });

  } catch (error) {
    console.error('Error comparing documents:', error);
    return next(new ErrorResponse('Failed to compare documents', 500));
  }
});

/**
 * @desc    Get statistics about documents available for plagiarism checking
 * @route   GET /api/plagiarism/stats
 * @access  Private
 */
exports.getPlagiarismStats = asyncHandler(async (req, res, next) => {
  // Get all projects with attachments
  const projects = await Project.find({ 'attachments.0': { $exists: true } })
    .select('title attachments')
    .lean();

  let totalDocuments = 0;
  let pdfCount = 0;
  let docxCount = 0;
  let processableDocuments = 0;

  for (const project of projects) {
    if (!project.attachments) continue;

    for (const attachment of project.attachments) {
      totalDocuments++;

      const ext = path.extname(attachment.filename).toLowerCase();
      if (ext === '.pdf') {
        pdfCount++;
        processableDocuments++;
      } else if (ext === '.docx') {
        docxCount++;
        processableDocuments++;
      }
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      totalProjects: projects.length,
      totalDocuments,
      processableDocuments,
      documentTypes: {
        pdf: pdfCount,
        docx: docxCount,
        other: totalDocuments - pdfCount - docxCount
      },
      supportedFormats: ['PDF', 'DOCX'],
      maxFileSize: '10 MB',
      minTextLength: '100 characters'
    }
  });
});

module.exports = exports;
