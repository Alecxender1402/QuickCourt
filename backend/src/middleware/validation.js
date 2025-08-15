import { body, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// User validation rules
export const userValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),

    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('password').notEmpty().withMessage('Password is required'),
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),

    body('avatar').optional().isString().withMessage('Avatar must be a string'),
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  ],

  verifyOTP: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

    body('otpCode')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP code must be 6 digits')
      .isNumeric()
      .withMessage('OTP code must contain only numbers'),
  ],

  resendOTP: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  ],

  resetPassword: [
    body('token').notEmpty().withMessage('Reset token is required'),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  ],
};

export const validateId = (paramName = 'id') => [
  body(paramName).isInt({ min: 1 }).withMessage(`${paramName} must be a valid positive integer`),
];

// Custom validation middleware for JSON strings in FormData
export const validateJsonField = (fieldName, message) => {
  return body(fieldName).custom((value) => {
    if (!value) return true; // Optional field
    
    // If it's already an array, it's valid
    if (Array.isArray(value)) return true;
    
    // If it's a string, try to parse it as JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return true;
        throw new Error(`${message} - must be an array`);
      } catch (error) {
        throw new Error(`${message} - invalid JSON format`);
      }
    }
    
    throw new Error(message);
  });
};

// Custom validation for nested array elements
export const validateNestedArrayField = (fieldName, subField, options = {}) => {
  return body(fieldName).custom((value) => {
    if (!value) return true; // Optional field
    
    let arrayValue = value;
    
    // Parse JSON string if needed
    if (typeof value === 'string') {
      try {
        arrayValue = JSON.parse(value);
      } catch (error) {
        throw new Error(`${fieldName} must be valid JSON`);
      }
    }
    
    if (!Array.isArray(arrayValue)) {
      throw new Error(`${fieldName} must be an array`);
    }
    
    // Validate each item in the array
    arrayValue.forEach((item, index) => {
      if (subField && !item[subField]) {
        throw new Error(`${fieldName}[${index}].${subField} is required`);
      }
      
      if (options.minLength && typeof item[subField] === 'string' && item[subField].length < options.minLength) {
        throw new Error(`${fieldName}[${index}].${subField} must be at least ${options.minLength} characters`);
      }
      
      if (options.maxLength && typeof item[subField] === 'string' && item[subField].length > options.maxLength) {
        throw new Error(`${fieldName}[${index}].${subField} must not exceed ${options.maxLength} characters`);
      }
    });
    
    return true;
  });
};
