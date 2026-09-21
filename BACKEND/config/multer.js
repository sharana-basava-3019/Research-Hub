/**
 * Multer Configuration — Cloudinary Storage
 * Files are uploaded directly to Cloudinary; no local disk storage required.
 * All file-type validation logic is preserved unchanged.
 */

const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// Cloudinary storage — files land at res.cloudinary.com, not on disk
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Derive extension without the leading dot (Cloudinary format param)
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    return {
      folder: 'research-hub/projects',
      resource_type: 'raw',   // 'raw' handles PDFs, DOCXs, ZIPs, images, etc.
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      format: ext,
    };
  },
});

// ── File type whitelist ──────────────────────────────────────────────────────
// Strict allowlist prevents stored XSS via uploaded HTML/SVG/JS files.
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

// Multer upload instance (Cloudinary storage)
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB maximum file size
  },
  fileFilter,
});

module.exports = upload;
