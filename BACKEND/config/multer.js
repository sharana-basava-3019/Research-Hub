/**
 * Multer Configuration
 * File upload configuration with validation
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'projects');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedFilename);
  }
});

// Strict file type whitelist — prevents stored XSS via uploaded HTML/SVG/JS files.
// Each entry maps an allowed MIME type to its acceptable file extensions.
const ALLOWED_TYPES = {
  // Documents
  'application/pdf':                             ['.pdf'],
  'application/msword':                          ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel':                    ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint':               ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  // Plain data (NOT html/svg)
  'text/plain':                                  ['.txt'],
  'text/csv':                                    ['.csv'],
  'application/json':                            ['.json'],
  // Images (raster only — SVG excluded due to script injection risk)
  'image/jpeg':                                  ['.jpg', '.jpeg'],
  'image/png':                                   ['.png'],
  'image/gif':                                   ['.gif'],
  'image/webp':                                  ['.webp'],
  // Archives
  'application/zip':                             ['.zip'],
  'application/x-zip-compressed':               ['.zip'],
  'application/x-tar':                           ['.tar'],
  'application/gzip':                            ['.gz'],
};

// File filter — reject anything not in the whitelist
const fileFilter = (req, file, cb) => {
  const mimeAllowed = ALLOWED_TYPES[file.mimetype];
  if (!mimeAllowed) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }

  // Also validate the extension to guard against MIME-type spoofing
  const ext = path.extname(file.originalname).toLowerCase();
  if (!mimeAllowed.includes(ext)) {
    return cb(new Error(`File extension '${ext}' does not match declared type '${file.mimetype}'`), false);
  }

  cb(null, true);
};

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB maximum file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
