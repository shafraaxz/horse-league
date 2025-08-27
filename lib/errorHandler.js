// lib/errorHandler.js - Enhanced error handling middleware
export function handleApiError(error, req, res) {
  console.error(`❌ API Error in ${req.method} ${req.url}:`, error);

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
      type: 'validation_error'
    });
  }

  // Mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists`,
      type: 'duplicate_error',
      field: field
    });
  }

  // MongoDB cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
      type: 'cast_error'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      type: 'auth_error'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      type: 'auth_error'
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    type: 'server_error'
  });
}

// API wrapper with consistent error handling
export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res);
    }
  };
}

// Client-side error handler for better UX
export function handleClientError(error, context = '') {
  console.error(`Client Error ${context}:`, error);
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}