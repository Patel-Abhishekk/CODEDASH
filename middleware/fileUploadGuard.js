const path = require('path');

/**
 * File Upload Security Guard
 * Protects against Item 12: Upload a non-photo (executable files disguised as images)
 */
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic bytes signature table
const MAGIC_NUMBERS = {
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46] // RIFF
};

/**
 * Validates a file's extension, mime type, size, and magic bytes.
 */
const validateUploadedFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  // 1. Check file size
  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, message: 'File size exceeds maximum allowed limit (5MB)' };
  }

  // 2. Validate filename and extension
  const originalName = file.originalname || file.name || '';
  // Check against path traversal (e.g. ../../)
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    return { valid: false, message: 'Invalid file name' };
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, message: `File extension '${ext}' is not permitted. Only images are allowed.` };
  }

  // Check against double extension attack (e.g., shell.php.jpg)
  const parts = originalName.split('.');
  if (parts.length > 2) {
    const dangerousExtensions = ['php', 'phtml', 'html', 'htm', 'js', 'sh', 'exe', 'bat', 'py', 'pl'];
    for (let i = 1; i < parts.length - 1; i++) {
      if (dangerousExtensions.includes(parts[i].toLowerCase())) {
        return { valid: false, message: 'Suspicious multi-extension file rejected' };
      }
    }
  }

  // 3. Validate MIME type
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return { valid: false, message: `Invalid MIME type '${file.mimetype}'. Only images are allowed.` };
  }

  // 4. Validate Magic Numbers if buffer is present
  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    const buffer = file.buffer;
    let magicMatch = false;

    if (ext === '.jpg' || ext === '.jpeg') {
      magicMatch = buffer.length >= 3 &&
        buffer[0] === MAGIC_NUMBERS.jpg[0] &&
        buffer[1] === MAGIC_NUMBERS.jpg[1] &&
        buffer[2] === MAGIC_NUMBERS.jpg[2];
    } else if (ext === '.png') {
      magicMatch = buffer.length >= 4 &&
        buffer[0] === MAGIC_NUMBERS.png[0] &&
        buffer[1] === MAGIC_NUMBERS.png[1] &&
        buffer[2] === MAGIC_NUMBERS.png[2] &&
        buffer[3] === MAGIC_NUMBERS.png[3];
    } else if (ext === '.gif') {
      magicMatch = buffer.length >= 4 &&
        buffer[0] === MAGIC_NUMBERS.gif[0] &&
        buffer[1] === MAGIC_NUMBERS.gif[1] &&
        buffer[2] === MAGIC_NUMBERS.gif[2] &&
        buffer[3] === MAGIC_NUMBERS.gif[3];
    } else if (ext === '.webp') {
      magicMatch = buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    }

    if (!magicMatch) {
      return { valid: false, message: 'File contents do not match image format signature (magic bytes mismatch)' };
    }
  }

  return { valid: true };
};

module.exports = {
  validateUploadedFile,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
};
