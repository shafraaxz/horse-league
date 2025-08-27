// pages/api/admins/reset.js
// This will delete all admins and create a fresh one
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Delete all existing admins
    await Admin.deleteMany({});
    
    // Create a new admin with default credentials
    const newAdmin = new Admin({
      name: 'Admin User',
      email: 'shafraaxz@gmail.com',
      password: 'Sudden123', // Will be hashed automatically by the model
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

    // Remove password from response
    const adminData = newAdmin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Admin reset successful! You can now login.',
      admin: adminData,
      credentials: {
        email: 'shafraaxz@gmail.com',
        password: 'Sudden123'
      }
    });

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}