// lib/auth.js - Proper role-based authentication system
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (adminId, username, role) => {
  return jwt.sign(
    { adminId, username, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyAuth = (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { error: 'No token provided' };
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return { error: 'Invalid token' };
    }
    
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token' };
  }
};

// ✅ ROLE HIERARCHY SYSTEM
const ROLE_HIERARCHY = {
  'super_admin': 100,
  'admin': 50,
  'moderator': 30,
  'scorer': 20,
  'viewer': 10
};

// ✅ PERMISSION FUNCTIONS
export const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

export const hasGlobalPermission = (user, requiredRole) => {
  return hasMinimumRole(user.role, requiredRole);
};

export const canManageAdmins = (user) => {
  return hasMinimumRole(user.role, 'admin');
};

export const canManageLeagues = (user) => {
  return hasMinimumRole(user.role, 'admin');
};

export const canManageTeams = (user) => {
  return hasMinimumRole(user.role, 'moderator');
};

export const canManagePlayers = (user) => {
  return hasMinimumRole(user.role, 'moderator');
};

export const canManageMatches = (user) => {
  return hasMinimumRole(user.role, 'moderator');
};

export const canManageLive = (user) => {
  return hasMinimumRole(user.role, 'scorer');
};

export const canViewStats = (user) => {
  return hasMinimumRole(user.role, 'viewer');
};

// ✅ ENHANCED AUTH MIDDLEWARE with proper role checking
export const authMiddleware = (handler, options = {}) => {
  return async (req, res) => {
    try {
      console.log(`🌐 ${req.method} ${req.url}`);
      
      // ✅ ALLOW: GET requests without authentication (unless specified)
      if (req.method === 'GET' && !options.requireAuth) {
        console.log('✅ Public GET request - no auth required');
        return handler(req, res);
      }
      
      // 🔒 REQUIRE AUTH: POST, PUT, DELETE operations (or forced auth)
      if (['POST', 'PUT', 'DELETE'].includes(req.method) || options.requireAuth) {
        console.log('🔒 Authentication required');
        
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          console.log('❌ No token provided');
          return res.status(401).json({ error: 'Authentication required for this operation' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          console.log('❌ Invalid token');
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        console.log('✅ Authentication successful:', decoded.username, 'Role:', decoded.role);

        // ✅ ROLE VALIDATION
        if (!decoded.role) {
          console.log('❌ User has no role defined');
          return res.status(403).json({ 
            error: 'Account has no role assigned. Please contact administrator.',
            username: decoded.username
          });
        }

        // ✅ CHECK SPECIFIC PERMISSIONS
        if (options.requireRole) {
          if (!hasMinimumRole(decoded.role, options.requireRole)) {
            console.log('❌ Insufficient role:', decoded.role, 'Required:', options.requireRole);
            return res.status(403).json({ 
              error: `Insufficient permissions. Required: ${options.requireRole}, You have: ${decoded.role}`,
              userRole: decoded.role,
              required: options.requireRole
            });
          }
          console.log('✅ Role check passed:', decoded.role, '>=', options.requireRole);
        }

        req.user = decoded;
        return handler(req, res);
      }
      
      // For any other HTTP methods, proceed without auth
      console.log('✅ Other method - no auth required');
      return handler(req, res);
      
    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Authentication error',
        details: error.message 
      });
    }
  };
};

// ✅ CONVENIENCE MIDDLEWARE FUNCTIONS
export const requireAuth = (handler) => {
  return authMiddleware(handler, { requireAuth: true });
};

export const requireAdmin = (handler) => {
  return authMiddleware(handler, { requireAuth: true, requireRole: 'admin' });
};

export const requireModerator = (handler) => {
  return authMiddleware(handler, { requireAuth: true, requireRole: 'moderator' });
};

export const requireScorer = (handler) => {
  return authMiddleware(handler, { requireAuth: true, requireRole: 'scorer' });
};