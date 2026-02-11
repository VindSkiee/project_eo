export const MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    RETRIEVED: 'Resource retrieved successfully',
  },

  // Error messages
  ERROR: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Bad request',
    INTERNAL_SERVER: 'Internal server error',
  },

  // Auth messages
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTER_SUCCESS: 'Registration successful',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
  },

  // Validation messages
  VALIDATION: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone number',
    MIN_LENGTH: 'Minimum length not met',
    MAX_LENGTH: 'Maximum length exceeded',
  },
};
