// lib/auth.js - Authentication Helper Functions
import jwt from 'jsonwebtoken';
import dbConnect from './mongodb';
import User from '../models/User';

/**
 * Verify JWT token and return user data
 * @param {Object} req - Request object
 * @returns {Object} - User object or throws error
 */
export async function verifyAuth(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Find user in database
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
      canModerate: user.canModerate
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Verify admin role
 * @param {Object} req - Request object
 * @returns {Object} - User object or throws error
 */
export async function verifyAdmin(req) {
  const user = await verifyAuth(req);
  
  if (!['super_admin', 'admin'].includes(user.role)) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Verify super admin role
 * @param {Object} req - Request object
 * @returns {Object} - User object or throws error
 */
export async function verifySuperAdmin(req) {
  const user = await verifyAuth(req);
  
  if (user.role !== 'super_admin') {
    throw new Error('Super admin access required');
  }
  
  return user;
}

/**
 * Verify user has specific permission
 * @param {Object} req - Request object
 * @param {string} permission - Required permission
 * @returns {Object} - User object or throws error
 */
export async function verifyPermission(req, permission) {
  const user = await verifyAuth(req);
  
  // Super admin has all permissions
  if (user.role === 'super_admin') {
    return user;
  }
  
  if (!user.permissions.includes(permission)) {
    throw new Error(`Permission '${permission}' required`);
  }
  
  return user;
}

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
}

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
export async function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, 12);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {boolean} - True if passwords match
 */
export async function comparePassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
}

/**
 * Middleware to protect API routes
 * @param {Function} handler - API route handler
 * @param {string} requiredRole - Required user role (optional)
 * @returns {Function} - Protected handler
 */
export function withAuth(handler, requiredRole = null) {
  return async (req, res) => {
    try {
      const user = await verifyAuth(req);
      
      if (requiredRole && !checkRole(user.role, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${requiredRole} role required.`
        });
      }
      
      // Attach user to request
      req.user = user;
      
      return handler(req, res);
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Authentication required'
      });
    }
  };
}

/**
 * Check if user role has sufficient privileges
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Required role
 * @returns {boolean} - True if user has sufficient privileges
 */
function checkRole(userRole, requiredRole) {
  const roleHierarchy = {
    'user': 0,
    'scorer': 1,
    'moderator': 2,
    'admin': 3,
    'super_admin': 4
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Get current user from request
 * @param {Object} req - Request object
 * @returns {Object|null} - User object or null
 */
export async function getCurrentUser(req) {
  try {
    return await verifyAuth(req);
  } catch (error) {
    return null;
  }
}

/**
 * Rate limiting helper (simple implementation)
 * @param {string} key - Unique identifier for rate limiting
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if request is allowed
 */
const rateLimitStore = new Map();

export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  
  // Reset if window has passed
  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + windowMs;
  }
  
  attempts.count++;
  rateLimitStore.set(key, attempts);
  
  return attempts.count <= maxAttempts;
}

/**
 * Clear rate limit for a key
 * @param {string} key - Rate limit key to clear
 */
export function clearRateLimit(key) {
  rateLimitStore.delete(key);
}