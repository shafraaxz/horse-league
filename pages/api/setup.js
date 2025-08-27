// pages/api/setup.js
import dbConnect from '../../lib/mongodb';
import Admin from '../../models/Admin';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      // If admin exists, just return the existing one for demo
      const existingAdmin = await Admin.findOne({ email: 'admin@demo.com' });
      if (existingAdmin) {
        return res.status(200).json({ 
          success: true, 
          message: 'Admin already exists',
          email: 'admin@demo.com'
        });
      }
    }

    // Create demo admin
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const demoAdmin = new Admin({
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

    await demoAdmin.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Demo admin created successfully!',
      credentials: {
        email: 'admin@demo.com',
        password: 'demo123'
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to create admin user'
    });
  }
}