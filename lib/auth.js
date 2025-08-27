// =====================================================
// 1. lib/auth.js - Core JWT and Authentication utilities
// =====================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Validate JWT_SECRET exists and is strong
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('⚠️  JWT_SECRET must be at least 32 characters long');
  throw new Error('Invalid JWT_SECRET configuration');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Generate JWT access token
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'football-league-manager',
    audience: 'football-league-users'
  });
};

// Generate JWT refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'refresh' }, 
    JWT_SECRET, 
    { 
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'football-league-manager',
      audience: 'football-league-users'
    }
  );
};

// Verify JWT token
export const verifyToken = (token, type = 'access') => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'football-league-manager',
      audience: 'football-league-users'
    });
    
    if (type === 'refresh' && decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

// Decode token without verification (for client-side)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Extract token from request
export const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies as fallback
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
};
