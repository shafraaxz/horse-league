// pages/api/auth/update-profile.js - Update admin profile
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, email } = req.body;
    const adminId = req.user.adminId;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Check if username or email already exists (exclude current user)
    const existingAdmin = await Admin.findOne({
      $and: [
        { _id: { $ne: adminId } },
        { $or: [{ username }, { email }] }
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      if (existingAdmin.email === email) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update admin profile
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { username, email },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedAdmin
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
}

export default requireAuth(handler);

// pages/api/auth/change-password.js - Change admin password
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { requireAuth, verifyPassword, hashPassword } from '../../../lib/auth';

async function changePasswordHandler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.adminId;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await Admin.findByIdAndUpdate(adminId, {
      password: hashedNewPassword,
      passwordChangedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      details: error.message 
    });
  }
}

export default requireAuth(changePasswordHandler);