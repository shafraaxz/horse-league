// 5. pages/api/auth/register.js - Register first admin
// =====================================================

import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';
import { hashPassword, generateAccessToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Registration is disabled. Contact existing admin.' 
      });
    }

    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create first super admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      permissions: {
        canCreateLeague: true,
        canEditLeague: true,
        canDeleteLeague: true,
        canManageTeams: true,
        canManageMatches: true,
        canManagePlayers: true,
        canViewReports: true,
        canManageAdmins: true
      }
    });

    // Generate token
    const token = generateAccessToken({
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      token,
      admin: adminData
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
}