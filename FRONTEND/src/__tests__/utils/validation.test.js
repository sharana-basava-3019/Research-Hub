/**
 * Unit Tests — Frontend Validation Utilities
 * Tests: isValidUrl, validatePassword, validateUsername, validateFileType, isValidEmail
 */

const {
  isValidUrl,
  validatePassword,
  validateUsername,
  validateFileType,
  isValidEmail
} = require('../../utils/validation');

// ─── isValidUrl() ───────────────────────────────────────────────────────────
describe('isValidUrl()', () => {
  test('returns false for null or undefined', () => {
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
  });

  test('returns true for empty string (optional field)', () => {
    expect(isValidUrl('')).toBe(true);
    expect(isValidUrl('   ')).toBe(true);
  });

  test('returns true for valid https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://scholar.google.com/citations?user=abc')).toBe(true);
  });

  test('returns true for valid http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  test('returns false for javascript: protocol (XSS prevention)', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  test('returns false for data: protocol (XSS prevention)', () => {
    expect(isValidUrl('data:text/html,<h1>XSS</h1>')).toBe(false);
    expect(isValidUrl('DATA:text/html,<h1>XSS</h1>')).toBe(false);
  });

  test('returns false for vbscript: protocol', () => {
    expect(isValidUrl('vbscript:msgbox("XSS")')).toBe(false);
  });

  test('returns false for file: protocol', () => {
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
  });

  test('returns true for relative paths starting with /', () => {
    expect(isValidUrl('/some/path')).toBe(true);
  });
});

// ─── validatePassword() ─────────────────────────────────────────────────────
describe('validatePassword()', () => {
  test('returns invalid for password shorter than 8 characters', () => {
    const result = validatePassword('Abc1!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('8 characters');
  });

  test('returns invalid for null/undefined', () => {
    expect(validatePassword(null).isValid).toBe(false);
    expect(validatePassword(undefined).isValid).toBe(false);
  });

  test('returns invalid when missing uppercase letter', () => {
    const result = validatePassword('alllower123!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  test('returns invalid when missing lowercase letter', () => {
    const result = validatePassword('ALLUPPER123!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('lowercase');
  });

  test('returns invalid when missing number', () => {
    const result = validatePassword('NoNumbers!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('number');
  });

  test('returns invalid when missing special character', () => {
    const result = validatePassword('NoSpecial1');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('special');
  });

  test('returns valid for strong password', () => {
    const result = validatePassword('SecurePass1!');
    expect(result.isValid).toBe(true);
    expect(result.message).toContain('strong');
  });

  test('accepts various special characters', () => {
    const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '='];
    specials.forEach(char => {
      const result = validatePassword(`Uppercase1${char}`);
      expect(result.isValid).toBe(true);
    });
  });
});

// ─── validateUsername() ─────────────────────────────────────────────────────
describe('validateUsername()', () => {
  test('returns invalid for username shorter than 3 characters', () => {
    expect(validateUsername('ab').isValid).toBe(false);
    expect(validateUsername('ab').message).toContain('3 characters');
  });

  test('returns invalid for null/undefined/empty', () => {
    expect(validateUsername(null).isValid).toBe(false);
    expect(validateUsername('').isValid).toBe(false);
  });

  test('returns invalid for username longer than 30 characters', () => {
    const longName = 'a'.repeat(31);
    expect(validateUsername(longName).isValid).toBe(false);
    expect(validateUsername(longName).message).toContain('30 characters');
  });

  test('returns invalid for username with uppercase letters', () => {
    expect(validateUsername('Alice').isValid).toBe(false);
    expect(validateUsername('ALICE').isValid).toBe(false);
  });

  test('returns invalid for username with spaces', () => {
    expect(validateUsername('user name').isValid).toBe(false);
  });

  test('returns invalid for username with special chars other than . and _', () => {
    expect(validateUsername('user-name').isValid).toBe(false);
    expect(validateUsername('user@name').isValid).toBe(false);
    expect(validateUsername('user#name').isValid).toBe(false);
  });

  test('returns valid for lowercase letters, numbers, underscores, dots', () => {
    expect(validateUsername('alice').isValid).toBe(true);
    expect(validateUsername('alice.smith').isValid).toBe(true);
    expect(validateUsername('alice_smith_123').isValid).toBe(true);
    expect(validateUsername('researcher.2024').isValid).toBe(true);
  });

  test('returns valid for exactly 3 characters', () => {
    expect(validateUsername('abc').isValid).toBe(true);
  });

  test('returns valid for exactly 30 characters', () => {
    expect(validateUsername('a'.repeat(30)).isValid).toBe(true);
  });
});

// ─── isValidEmail() ─────────────────────────────────────────────────────────
describe('isValidEmail()', () => {
  test('returns false for null/undefined/empty', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('returns true for valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('alice.smith@university.edu')).toBe(true);
    expect(isValidEmail('test+tag@domain.co.uk')).toBe(true);
  });

  test('returns false for missing @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  test('returns false for missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  test('returns false for missing TLD', () => {
    expect(isValidEmail('user@example')).toBe(false);
  });

  test('returns false for email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

// ─── validateFileType() ─────────────────────────────────────────────────────
describe('validateFileType()', () => {
  const makeFile = (name, type = 'application/pdf') => ({
    name,
    type
  });

  test('returns invalid when no file provided', () => {
    expect(validateFileType(null).isValid).toBe(false);
    expect(validateFileType(undefined).isValid).toBe(false);
  });

  test('returns valid for PDF files with default allowed types', () => {
    const result = validateFileType(makeFile('thesis.pdf'));
    expect(result.isValid).toBe(true);
  });

  test('returns valid for DOCX files', () => {
    const result = validateFileType(makeFile('report.docx', 'application/vnd.openxmlformats'));
    expect(result.isValid).toBe(true);
  });

  test('returns valid for image files', () => {
    expect(validateFileType(makeFile('photo.jpg', 'image/jpeg')).isValid).toBe(true);
    expect(validateFileType(makeFile('chart.png', 'image/png')).isValid).toBe(true);
  });

  test('returns invalid for .exe files', () => {
    const result = validateFileType(makeFile('malware.exe', 'application/x-msdownload'));
    expect(result.isValid).toBe(false);
  });

  test('returns invalid for .sh files', () => {
    const result = validateFileType(makeFile('script.sh', 'application/x-sh'));
    expect(result.isValid).toBe(false);
  });

  test('uses custom allowedTypes when provided', () => {
    const pdfOnly = validateFileType(makeFile('doc.pdf', 'application/pdf'), ['.pdf']);
    expect(pdfOnly.isValid).toBe(true);

    const docxRejected = validateFileType(makeFile('doc.docx', 'application/vnd.openxmlformats'), ['.pdf']);
    expect(docxRejected.isValid).toBe(false);
  });

  test('checks by MIME type when allowedTypes contains MIME strings', () => {
    const result = validateFileType(makeFile('doc.pdf', 'application/pdf'), ['application/pdf']);
    expect(result.isValid).toBe(true);
  });
});
