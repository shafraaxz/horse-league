// pages/api/admin-fix.js - Quick fix for admin issues
import dbConnect from '../../lib/mongodb';
import Admin from '../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    await dbConnect();

    switch (action) {
      case 'check_nabaah':
        // Check if 'nabaah' email exists
        const nabaahAdmin = await Admin.findOne({ email: 'nabaah' });
        return res.status(200).json({
          success: true,
          exists: !!nabaahAdmin,
          admin: nabaahAdmin ? {
            id: nabaahAdmin._id,
            name: nabaahAdmin.name,
            email: nabaahAdmin.email,
            role: nabaahAdmin.role
          } : null
        });

      case 'delete_nabaah':
        // Delete any admin with email 'nabaah'
        const deleteResult = await Admin.deleteOne({ email: 'nabaah' });
        return res.status(200).json({
          success: true,
          deleted: deleteResult.deletedCount > 0,
          message: deleteResult.deletedCount > 0 ? 'Admin deleted' : 'No admin found with that email'
        });

      case 'list_all':
        // List all admins
        const allAdmins = await Admin.find({}).select('name email role createdAt');
        return res.status(200).json({
          success: true,
          count: allAdmins.length,
          admins: allAdmins
        });

      case 'clear_all':
        // Delete ALL admins (be careful!)
        const clearResult = await Admin.deleteMany({});
        return res.status(200).json({
          success: true,
          deleted: clearResult.deletedCount,
          message: `Deleted ${clearResult.deletedCount} admins`
        });

      case 'create_test':
        // Create a test admin with unique email
        const testEmail = `test-${Date.now()}@example.com`;
        const testAdmin = new Admin({
          name: 'Test Admin',
          email: testEmail,
          password: 'test123',
          role: 'super_admin'
        });
        await testAdmin.save();
        return res.status(200).json({
          success: true,
          message: 'Test admin created',
          admin: {
            id: testAdmin._id,
            name: testAdmin.name,
            email: testAdmin.email
          }
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: check_nabaah, delete_nabaah, list_all, clear_all, create_test'
        });
    }

  } catch (error) {
    console.error('Admin fix error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}