// pages/api/debug/fix-all-roles.js - Fix all user roles in database
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { action, username, newRole } = req.body;

      if (action === 'fix_all') {
        // Fix all users with undefined/null roles
        const usersWithoutRoles = await Admin.find({
          $or: [
            { role: { $exists: false } },
            { role: null },
            { role: '' },
            { role: undefined }
          ]
        });

        console.log(`Found ${usersWithoutRoles.length} users without proper roles`);

        const updatePromises = usersWithoutRoles.map(user => 
          Admin.findByIdAndUpdate(user._id, {
            role: 'admin', // Set all to admin by default
            isActive: true,
            updatedAt: new Date()
          }, { new: true })
        );

        const updatedUsers = await Promise.all(updatePromises);

        return res.status(200).json({
          success: true,
          message: `✅ Fixed ${updatedUsers.length} users without roles`,
          updatedUsers: updatedUsers.map(u => ({
            username: u.username,
            role: u.role,
            isActive: u.isActive
          })),
          instructions: 'Now logout and login again to get new tokens'
        });
      }

      if (action === 'fix_specific' && username && newRole) {
        // Fix specific user
        const updatedUser = await Admin.findOneAndUpdate(
          { username },
          { 
            role: newRole,
            isActive: true,
            updatedAt: new Date()
          },
          { new: true }
        ).select('-password');

        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
          success: true,
          message: `✅ User "${username}" role updated to "${newRole}"`,
          user: updatedUser,
          instructions: 'User needs to logout and login again'
        });
      }

      return res.status(400).json({ 
        error: 'Invalid action',
        validActions: ['fix_all', 'fix_specific']
      });
    }

    // GET - Show current database state
    const allUsers = await Admin.find().select('-password');
    const usersWithoutRoles = allUsers.filter(user => 
      !user.role || user.role === '' || user.role === null
    );

    return res.status(200).json({
      message: 'Current database state',
      totalUsers: allUsers.length,
      usersWithoutRoles: usersWithoutRoles.length,
      allUsers: allUsers.map(u => ({
        _id: u._id,
        username: u.username,
        role: u.role || 'UNDEFINED',
        isActive: u.isActive,
        createdAt: u.createdAt
      })),
      problemUsers: usersWithoutRoles.map(u => ({
        username: u.username,
        role: u.role || 'UNDEFINED',
        problem: 'Missing or invalid role'
      })),
      actions: {
        fixAll: 'POST with {"action": "fix_all"}',
        fixSpecific: 'POST with {"action": "fix_specific", "username": "user", "newRole": "admin"}'
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fix roles',
      details: error.message 
    });
  }
}