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

// ✅ FIXED: Smart authentication middleware
export const authMiddleware = (handler) => {
  return async (req, res) => {
    try {
      console.log(`🌐 ${req.method} ${req.url}`);
      
      // ✅ ALLOW: GET requests without authentication (public read access)
      if (req.method === 'GET') {
        console.log('✅ Public GET request - no auth required');
        return handler(req, res);
      }
      
      // 🔒 REQUIRE AUTH: POST, PUT, DELETE operations (admin only)
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        console.log('🔒 Write operation - authentication required');
        
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

        console.log('✅ Authentication successful:', decoded.username);
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

// ✅ OPTIONAL: Strict auth middleware for admin-only endpoints
export const requireAuth = (handler) => {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
};