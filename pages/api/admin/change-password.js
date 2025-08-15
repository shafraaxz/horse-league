import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { verifyPassword, hashPassword, authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectDB();

  try {
    const { currentPassword, newPassword, username } = req.body;

    if (!currentPassword || !newPassword || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Find the admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await Admin.findByIdAndUpdate(admin._id, {
      password: hashedNewPassword
    });

    res.status(200).json({
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

export default authMiddleware(handler);
