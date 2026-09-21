/**
 * Validation Utilities
 * Client-side validation functions for forms and user input
 */

/**
 * Validates a URL to prevent XSS attacks via javascript: or data: protocols
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL is safe, false otherwise
 */
export const isValidUrl = (url) => {
  if (url === null || url === undefined || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim();
  if (trimmedUrl === '') return true; // Empty URLs are acceptable (optional fields)
  
  try {
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmedUrl.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return false;
      }
    }
    
    // Try to parse as URL (accepts http, https, ftp, etc.)
    const urlObj = new URL(trimmedUrl);
    
    // Only allow http, https, ftp protocols
    const allowedProtocols = ['http:', 'https:', 'ftp:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    return true;
  } catch (e) {
    // If URL parsing fails, check if it's a relative URL or missing protocol
    // Allow URLs that start with / or don't have a protocol
    if (trimmedUrl.startsWith('/') || !trimmedUrl.includes(':')) {
      return true;
    }
    return false;
  }
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {object} - Object with isValid boolean and message string
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*...)'
    };
  }
  
  return {
    isValid: true,
    message: 'Password is strong'
  };
};

/**
 * Validates username format
 * @param {string} username - The username to validate
 * @returns {object} - Object with isValid boolean and message string
 */
export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return {
      isValid: false,
      message: 'Username must be at least 3 characters long'
    };
  }
  
  if (username.length > 30) {
    return {
      isValid: false,
      message: 'Username must be no more than 30 characters'
    };
  }
  
  const usernameRegex = /^[a-z0-9_.]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Username can only contain lowercase letters, numbers, dots, and underscores'
    };
  }
  
  return {
    isValid: true,
    message: 'Username is valid'
  };
};

/**
 * Validates file types for upload
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Array of allowed MIME types or extensions
 * @returns {object} - Object with isValid boolean and message string
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file) {
    return {
      isValid: false,
      message: 'No file provided'
    };
  }
  
  // If no specific types are allowed, allow common document/image types
  if (allowedTypes.length === 0) {
    const commonAllowedExtensions = [
      '.pdf', '.doc', '.docx', '.txt', '.md',
      '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.zip', '.rar', '.7z',
      '.csv', '.xls', '.xlsx',
      '.ppt', '.pptx',
      '.json', '.xml', '.yaml', '.yml',
      '.py', '.js', '.java', '.cpp', '.c', '.h',
      '.html', '.css', '.scss'
    ];
    
    const fileName = file.name.toLowerCase();
    const isAllowed = commonAllowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isAllowed) {
      return {
        isValid: false,
        message: `File type not allowed. Allowed types: ${commonAllowedExtensions.join(', ')}`
      };
    }
  } else {
    // Check against provided allowed types
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type.toLowerCase());
      }
      return fileType === type.toLowerCase();
    });
    
    if (!isAllowed) {
      return {
        isValid: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }
  }
  
  return {
    isValid: true,
    message: 'File type is valid'
  };
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
