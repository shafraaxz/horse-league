// middleware/auth.js - Optimized version for better performance
import jwt from 'jsonwebtoken';
import dbConnect from '../lib/mongodb';
import Admin from '../models/Admin';

// In-memory cache for user data (use Redis in production)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached user
const getCachedUser = (userId) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  return null;
};

// Helper function to cache user
const cacheUser = (userId, user) => {
  userCache.set(userId, {
    user,
    timestamp: Date.now()
  });
};

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of userCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, 60000); // Clean every minute

export function authenticate(handler, options = {}) {
  return async (req, res) => {
    try {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Auth middleware:', req.method, req.url);
      }
      
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.'
        });
      }

      const userId = decoded.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload.'
        });
      }

      // Try to get user from cache first
      let user = getCachedUser(userId);
      
      if (!user) {
        // User not in cache, fetch from database
        await dbConnect();
        user = await Admin.findById(userId).select('-password').lean(); // .lean() for better performance
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Access denied. User not found.'
          });
        }

        // Cache the user for future requests
        cacheUser(userId, user);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('👤 User fetched from DB and cached:', user.email);
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('⚡ User retrieved from cache:', user.email);
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User account is inactive.'
        });
      }

      // Check role permissions if specified
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: `Access denied. Required roles: ${options.roles.join(', ')}`
          });
        }
      }

      // Add user to request object
      req.user = user;
      req.token = token;
      
      // Call the original handler
      return handler(req, res);

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  };
}

// Optimized optional authentication for public endpoints
export function authenticateOptional(handler, options = {}) {
  return async (req, res) => {
    // Allow public access for GET requests if specified
    if (req.method === 'GET' && options.allowPublicRead) {
      return handler(req, res);
    }

    // Otherwise require authentication
    return authenticate(handler, options)(req, res);
  };
}

// Clear user cache when needed (call this when user data changes)
export function clearUserCache(userId = null) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}