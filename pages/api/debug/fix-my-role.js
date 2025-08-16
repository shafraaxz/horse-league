// pages/api/debug/fix-role-quick.js - Quick fix for undefined role
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ 
          error: 'Username is required',
          example: { username: "admin" }
        });
      }

      // Find and update the user's role
      const updatedUser = await Admin.findOneAndUpdate(
        { username: username },
        { 
          role: 'admin',
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
        message: `✅ User "${username}" role updated to admin!`,
        user: updatedUser,
        instructions: 'Now logout and login again to get a new token with the correct role'
      });
    }

    // GET - Show all users and their roles
    const allUsers = await Admin.find().select('-password');
    
    return res.status(200).json({
      message: 'All admin users in database',
      users: allUsers,
      instructions: {
        toFix: 'POST to this endpoint with {"username": "your-username"}',
        example: { username: "admin" }
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fix role',
      details: error.message 
    });
  }
}