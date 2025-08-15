// pages/api/auth/change-password.js - Password Change API
import { connectToDatabase } from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Verify authentication token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    const adminsCollection = db.collection('admins');
    
    // Find the user
    const user = await adminsCollection.findOne({ username: decoded.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password in database
    await adminsCollection.updateOne(
      { username: decoded.username },
      { 
        $set: { 
          password: hashedNewPassword, 
          updatedAt: new Date(),
          passwordChangedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Password changed successfully for user: ${decoded.username}`);
    
    return res.status(200).json({ 
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}