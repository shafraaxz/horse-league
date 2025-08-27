// pages/api/auth/reset-admin.js - Reset admin password
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Find and update the demo admin
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const admin = await Admin.findOneAndUpdate(
      { email: 'admin@demo.com' },
      { 
        password: hashedPassword,
        isActive: true,
        role: 'super_admin'
      },
      { new: true }
    );
    
    if (!admin) {
      // Create new admin if not exists
      const newAdmin = new Admin({
        name: 'Demo Admin',
        email: 'admin@demo.com',
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
          canViewReports: true
        }
      });
      
      await newAdmin.save();
      
      return res.status(201).json({
        success: true,
        message: 'Admin created with reset password',
        email: 'admin@demo.com'
      });
    }
    
    // Test the password works
    const testValid = await bcrypt.compare('demo123', hashedPassword);
    
    res.status(200).json({
      success: true,
      message: 'Admin password reset successfully',
      email: admin.email,
      testValid: testValid
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}