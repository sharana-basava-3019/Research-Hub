/**
 * Document Text Extractor Service
 * Extracts text content from PDF and DOCX files for plagiarism detection
 */

const fs = require('fs');
const path = require('path');

let pdfParseModule = null;
let mammothModule = null;

function getPdfParse() {
  if (!pdfParseModule) {
    pdfParseModule = require('pdf-parse');
  }
  return pdfParseModule;
}

function getMammoth() {
  if (!mammothModule) {
    mammothModule = require('mammoth');
  }
  return mammothModule;
}

class DocumentExtractor {
  /**
   * Extract text from a document file (PDF or DOCX)
   * @param {String} filePath - Absolute path to the document file
   * @returns {Promise<String>} - Extracted text content
   */
  static async extractText(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Determine file type from extension
      const fileExtension = path.extname(filePath).toLowerCase();

      switch (fileExtension) {
        case '.pdf':
          return await this.extractFromPDF(filePath);
        
        case '.docx':
          return await this.extractFromDOCX(filePath);
        
        default:
          throw new Error(`Unsupported file type: ${fileExtension}. Only PDF and DOCX files are supported.`);
      }
    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw error;
    }
  }

  /**
   * Extract text from PDF file
   * @param {String} filePath - Path to PDF file
   * @returns {Promise<String>} - Extracted text
   */
  static async extractFromPDF(filePath) {
    try {
      const pdfParse = getPdfParse();
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      // Return the extracted text
      return data.text || '';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Extract text from DOCX file
   * @param {String} filePath - Path to DOCX file
   * @returns {Promise<String>} - Extracted text
   */
  static async extractFromDOCX(filePath) {
    try {
      const mammoth = getMammoth();
      const result = await mammoth.extractRawText({ path: filePath });
      
      // Return the extracted text
      return result.value || '';
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  /**
   * Validate if file type is supported
   * @param {String} filename - Name of the file
   * @returns {Boolean} - True if supported, false otherwise
   */
  static isSupportedFileType(filename) {
    const supportedExtensions = ['.pdf', '.docx'];
    const fileExtension = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(fileExtension);
  }

  /**
   * Get file size in MB
   * @param {String} filePath - Path to file
   * @returns {Number} - File size in MB
   */
  static getFileSizeInMB(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
  }

  /**
   * Validate document file before processing
   * @param {String} filePath - Path to file
   * @param {Number} maxSizeMB - Maximum allowed file size in MB (default: 10)
   * @returns {Object} - {valid: Boolean, error: String}
   */
  static validateDocument(filePath, maxSizeMB = 10) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'File not found' };
      }

      // Check file type
      if (!this.isSupportedFileType(filePath)) {
        return { valid: false, error: 'Unsupported file type. Only PDF and DOCX files are accepted.' };
      }

      // Check file size
      const fileSizeMB = this.getFileSizeInMB(filePath);
      if (fileSizeMB > maxSizeMB) {
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
      }

      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = DocumentExtractor;
