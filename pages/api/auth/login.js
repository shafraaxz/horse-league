// 4. pages/api/auth/login.js - Login endpoint
// =====================================================

import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';
import { generateAccessToken, generateRefreshToken, comparePassword } from '../../../lib/auth';
import { rateLimiter } from '../../../middleware/rateLimiter';

const loginHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find admin with password field
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      // Don't reveal if email exists
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if active
    if (!admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    
    if (!isPasswordValid) {
      // Track failed login attempts
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (admin.failedLoginAttempts >= 5) {
        admin.isActive = false;
        admin.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await admin.save();
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Reset failed login attempts
    admin.failedLoginAttempts = 0;
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const tokenPayload = {
      id: admin._id,
      email: admin.email,
      role: admin.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`
    ]);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      admin: adminData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

// Apply rate limiting: max 5 login attempts per 15 minutes
export default rateLimiter({ 
  maxRequests: 5, 
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts. Please try again later.'
})(loginHandler);