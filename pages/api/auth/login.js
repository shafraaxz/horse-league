// pages/api/auth/login.js - Enhanced login with proper role handling
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { verifyPassword, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('🔐 Login attempt for username:', username);

    // Find user in database
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!admin.isActive) {
      console.log('❌ User account inactive:', username);
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ ENHANCED: Check and fix role if needed
    let userRole = admin.role;
    if (!userRole || userRole === '' || userRole === null) {
      console.log('🔧 Fixing undefined role for user:', username);
      
      // Auto-fix role to 'admin' and update database
      userRole = 'admin';
      await Admin.findByIdAndUpdate(admin._id, {
        role: userRole,
        updatedAt: new Date()
      });
      
      console.log('✅ Auto-fixed role to admin for user:', username);
    }

    // Generate token with CORRECT role
    const token = generateToken(admin._id, admin.username, userRole);

    // Return success response
    const userResponse = {
      _id: admin._id,
      username: admin.username,
      role: userRole,
      email: admin.email || '',
      fullName: admin.fullName || '',
      isActive: admin.isActive
    };

    console.log('✅ Login successful for user:', username, 'Role:', userRole);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
      debug: {
        originalRole: admin.role,
        finalRole: userRole,
        roleWasFixed: admin.role !== userRole
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
}