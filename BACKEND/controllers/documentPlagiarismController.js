/**
 * Document Plagiarism Controller
 * Handles document upload and plagiarism checking for PDF and DOCX files
 */

const Project = require('../models/Project');
const User = require('../models/User');
const DocumentExtractor = require('../services/documentExtractor');
const PlagiarismChecker = require('../services/plagiarismChecker');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Check document for plagiarism
 * @route   POST /api/plagiarism/check-document
 * @access  Private
 */
exports.checkDocument = asyncHandler(async (req, res, next) => {
  // Check if file was uploaded
  if (!req.file) {
    return next(new ErrorResponse('Please upload a PDF or DOCX file', 400));
  }

  const uploadedFilePath = req.file.path;

  try {
    // Validate document
    const validation = DocumentExtractor.validateDocument(uploadedFilePath, 10);
    if (!validation.valid) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFilePath);
      return next(new ErrorResponse(validation.error, 400));
    }

    // Extract text from uploaded document
    const uploadedText = await DocumentExtractor.extractText(uploadedFilePath);

    if (!uploadedText || uploadedText.trim().length < 100) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFilePath);
      return next(new ErrorResponse('Unable to extract sufficient text from document. Minimum 100 characters required.', 400));
    }

    // Get all projects with attachments to compare against
    const projects = await Project.find({ 'attachments.0': { $exists: true } })
      .select('title attachments owner')
      .populate('owner', 'firstName lastName username email')
      .lean();

    // Prepare existing documents for comparison
    const existingDocuments = [];
    
    for (const project of projects) {
      if (!project.attachments || project.attachments.length === 0) continue;

      for (const attachment of project.attachments) {
        // Only process PDF and DOCX files
        if (!attachment.filename.match(/\.(pdf|docx)$/i)) continue;

        const attachmentPath = path.join(__dirname, '..', attachment.url);
        
        if (fs.existsSync(attachmentPath)) {
          try {
            const attachmentText = await DocumentExtractor.extractText(attachmentPath);
            
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
    }

    // Perform plagiarism check
    const comparisonResult = await PlagiarismChecker.compareDocument(
      uploadedText,
      existingDocuments
    );

    // Generate detailed report
    const report = PlagiarismChecker.generateReport(comparisonResult);

    // Clean up uploaded file after processing
    fs.unlinkSync(uploadedFilePath);

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
    // Clean up uploaded file in case of error
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    
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
  // Check if two files were uploaded
  if (!req.files || req.files.length !== 2) {
    return next(new ErrorResponse('Please upload exactly 2 documents (PDF or DOCX)', 400));
  }

  const file1Path = req.files[0].path;
  const file2Path = req.files[1].path;

  try {
    // Validate both documents
    const validation1 = DocumentExtractor.validateDocument(file1Path, 10);
    const validation2 = DocumentExtractor.validateDocument(file2Path, 10);

    if (!validation1.valid) {
      fs.unlinkSync(file1Path);
      fs.unlinkSync(file2Path);
      return next(new ErrorResponse(`Document 1: ${validation1.error}`, 400));
    }

    if (!validation2.valid) {
      fs.unlinkSync(file1Path);
      fs.unlinkSync(file2Path);
      return next(new ErrorResponse(`Document 2: ${validation2.error}`, 400));
    }

    // Extract text from both documents
    const text1 = await DocumentExtractor.extractText(file1Path);
    const text2 = await DocumentExtractor.extractText(file2Path);

    // Validate extracted text
    if (!text1 || text1.trim().length < 100) {
      fs.unlinkSync(file1Path);
      fs.unlinkSync(file2Path);
      return next(new ErrorResponse('Document 1: Unable to extract sufficient text', 400));
    }

    if (!text2 || text2.trim().length < 100) {
      fs.unlinkSync(file1Path);
      fs.unlinkSync(file2Path);
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

    // Clean up uploaded files
    fs.unlinkSync(file1Path);
    fs.unlinkSync(file2Path);

    // Return results
    res.status(200).json({
      status: 'success',
      message: 'Documents compared successfully',
      data: {
        document1: {
          originalName: req.files[0].originalname,
          size: req.files[0].size,
          textLength: text1.length
        },
        document2: {
          originalName: req.files[1].originalname,
          size: req.files[1].size,
          textLength: text2.length
        },
        comparison: {
          status,
          similarityPercentage: similarityPercentage,
          similarityScore: similarity,
          message: PlagiarismChecker.getStatusMessage(status, similarityPercentage),
          interpretation: PlagiarismChecker.getInterpretation(status)
        },
        disclaimer: 'This is a BASIC text similarity check. It does NOT detect paraphrasing, translated content, or sophisticated plagiarism techniques.'
      }
    });

  } catch (error) {
    // Clean up uploaded files in case of error
    if (fs.existsSync(file1Path)) fs.unlinkSync(file1Path);
    if (fs.existsSync(file2Path)) fs.unlinkSync(file2Path);
    
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
