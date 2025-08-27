// pages/api/admins/create.js
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { name, email, password, role = 'super_admin' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and password are required' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    // Create new admin (password will be hashed automatically by the model)
    const newAdmin = new Admin({
      name,
      email,
      password: password, // Don't hash here - the model does it automatically
      role,
      isActive: true,
      permissions: {
        canCreateLeague: role === 'super_admin' || role === 'league_admin',
        canEditLeague: role === 'super_admin' || role === 'league_admin',
        canDeleteLeague: role === 'super_admin',
        canManageTeams: role !== 'viewer',
        canManageMatches: role !== 'viewer',
        canManagePlayers: role !== 'viewer',
        canViewReports: true
      },
      createdAt: new Date()
    });

    await newAdmin.save();

    // Remove password from response
    const adminData = newAdmin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: adminData
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}