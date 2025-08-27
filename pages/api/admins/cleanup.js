// pages/api/admins/cleanup.js - Helper to clean up duplicate admins
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { email, action } = req.body;

    if (action === 'delete_by_email') {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for deletion'
        });
      }

      const deletedAdmin = await Admin.findOneAndDelete({ email: email.toLowerCase() });
      
      if (!deletedAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Admin with this email not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Admin with email ${email} deleted successfully`,
        deletedAdmin: {
          id: deletedAdmin._id,
          name: deletedAdmin.name,
          email: deletedAdmin.email
        }
      });
    }

    if (action === 'list_all') {
      const admins = await Admin.find({}).select('name email role isActive createdAt');
      
      return res.status(200).json({
        success: true,
        count: admins.length,
        admins: admins
      });
    }

    if (action === 'delete_all_except_super') {
      const deletedAdmins = await Admin.deleteMany({ role: { $ne: 'super_admin' } });
      
      return res.status(200).json({
        success: true,
        message: `Deleted ${deletedAdmins.deletedCount} non-super-admin accounts`
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use: delete_by_email, list_all, or delete_all_except_super'
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cleanup operation failed',
      error: error.message
    });
  }
}