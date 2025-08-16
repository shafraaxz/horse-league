// pages/api/admin/index.js - Complete Admin API with proper role permissions
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { hashPassword, requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        return await requireAdmin(getAdmins)(req, res);
      case 'POST':
        return await requireAdmin(createAdmin)(req, res);
      case 'PUT':
        return await requireAdmin(updateAdmin)(req, res);
      case 'DELETE':
        return await requireAdmin(deleteAdmin)(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET all admins - Requires admin role
async function getAdmins(req, res) {
  try {
    console.log('🔍 Fetching all admin users...');
    console.log('👤 Requested by:', req.user.username, 'Role:', req.user.role);
    
    const admins = await Admin.find()
      .select('-password') // Don't return passwords
      .sort({ createdAt: -1 });

    console.log(`📋 Retrieved ${admins.length} admin users`);
    return res.status(200).json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.status(500).json({ error: 'Failed to fetch admin users' });
  }
}

// CREATE new admin - Requires admin role
async function createAdmin(req, res) {
  try {
    const { username, password, role, email, fullName, isActive = true } = req.body;

    console.log('🔨 Creating admin with data:', { username, role, email, fullName });
    console.log('👤 Created by:', req.user.username, 'Role:', req.user.role);

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ 
        error: 'Username, password, and role are required' 
      });
    }

    // Validate role
    if (!['admin', 'moderator', 'scorer', 'super_admin', 'viewer'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be: admin, moderator, scorer, super_admin, or viewer' 
      });
    }

    // Only super_admin can create other super_admins
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super administrators can create super admin users' 
      });
    }

    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Admin.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const newAdmin = new Admin({
      username: username.trim(),
      password: hashedPassword,
      role,
      email: email?.trim() || '',
      fullName: fullName?.trim() || '',
      isActive
    });

    const savedAdmin = await newAdmin.save();

    // Return admin without password
    const adminResponse = {
      _id: savedAdmin._id,
      username: savedAdmin.username,
      role: savedAdmin.role,
      email: savedAdmin.email,
      fullName: savedAdmin.fullName,
      isActive: savedAdmin.isActive,
      createdAt: savedAdmin.createdAt
    };

    console.log('✅ Admin created successfully:', savedAdmin.username);
    return res.status(201).json({
      message: 'Admin created successfully',
      admin: adminResponse
    });
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    return res.status(500).json({ 
      error: 'Failed to create admin',
      details: error.message 
    });
  }
}

// UPDATE existing admin - Requires admin role
async function updateAdmin(req, res) {
  try {
    const { _id, username, password, role, email, fullName, isActive } = req.body;

    if (!_id) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    console.log('🔄 Updating admin:', _id);
    console.log('👤 Updated by:', req.user.username, 'Role:', req.user.role);

    // Find existing admin
    const existingAdmin = await Admin.findById(_id);
    if (!existingAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent editing the default admin username
    if (existingAdmin.username === 'admin' && username && username !== 'admin') {
      return res.status(400).json({ error: 'Cannot change default admin username' });
    }

    // Prevent users from deactivating themselves
    if (_id === req.user.adminId && isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    // Prevent non-super-admins from modifying super-admin accounts
    if ((existingAdmin.role === 'super_admin' || role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super administrators can modify super admin accounts' 
      });
    }

    // Validate new role if provided
    if (role && !['admin', 'moderator', 'scorer', 'super_admin', 'viewer'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be: admin, moderator, scorer, super_admin, or viewer' 
      });
    }

    // Only super_admin can assign super_admin role
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super administrators can assign super admin role' 
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (username && username !== existingAdmin.username) {
      // Check if new username is taken
      const usernameExists = await Admin.findOne({ 
        username, 
        _id: { $ne: _id } 
      });
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      updateData.username = username.trim();
    }

    if (email !== undefined) {
      if (email && email !== existingAdmin.email) {
        // Check if new email is taken
        const emailExists = await Admin.findOne({ 
          email, 
          _id: { $ne: _id } 
        });
        if (emailExists) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
      updateData.email = email?.trim() || '';
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName?.trim() || '';
    }

    if (role) {
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Hash new password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    updateData.updatedAt = new Date();

    const updatedAdmin = await Admin.findByIdAndUpdate(_id, updateData, { 
      new: true 
    }).select('-password');

    console.log('✅ Admin updated successfully:', updatedAdmin.username);
    return res.status(200).json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    return res.status(500).json({ 
      error: 'Failed to update admin',
      details: error.message 
    });
  }
}

// DELETE admin - Requires admin role
async function deleteAdmin(req, res) {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    console.log('🗑️ Deleting admin:', username);
    console.log('👤 Deleted by:', req.user.username, 'Role:', req.user.role);

    // Find admin to delete
    const adminToDelete = await Admin.findOne({ username });
    if (!adminToDelete) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent deleting yourself
    if (adminToDelete._id.toString() === req.user.adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Prevent deleting the default admin
    if (username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the default admin account' });
    }

    // Only super_admin can delete super_admin accounts
    if (adminToDelete.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super administrators can delete super admin accounts' 
      });
    }

    await Admin.findByIdAndDelete(adminToDelete._id);

    console.log('✅ Admin deleted successfully:', username);
    return res.status(200).json({ 
      message: `Admin "${username}" deleted successfully` 
    });
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    return res.status(500).json({ 
      error: 'Failed to delete admin',
      details: error.message 
    });
  }
}