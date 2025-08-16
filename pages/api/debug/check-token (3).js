// pages/api/debug/check-role.js - Check your current user role
import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Get token from authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(200).json({ 
        error: 'No token found',
        message: 'Please login first',
        hasToken: false
      });
    }

    // Decode token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(200).json({ 
        error: 'Invalid token',
        message: 'Please login again',
        hasToken: true,
        tokenValid: false
      });
    }

    // Get user from database
    const userInDb = await Admin.findById(decoded.adminId).select('-password');
    
    return res.status(200).json({
      status: 'SUCCESS',
      currentUser: {
        fromToken: {
          adminId: decoded.adminId,
          username: decoded.username,
          role: decoded.role
        },
        fromDatabase: userInDb ? {
          _id: userInDb._id,
          username: userInDb.username,
          role: userInDb.role,
          isActive: userInDb.isActive,
          email: userInDb.email
        } : null
      },
      analysis: {
        hasToken: true,
        tokenValid: true,
        userExistsInDb: !!userInDb,
        rolesMatch: decoded.role === userInDb?.role,
        canCreateAdmins: userInDb?.role === 'admin' || userInDb?.role === 'super_admin',
        problem: !userInDb ? 'USER NOT IN DATABASE' : 
                userInDb.role !== 'admin' && userInDb.role !== 'super_admin' ? `WRONG ROLE: ${userInDb.role}` :
                !userInDb.isActive ? 'USER INACTIVE' : 'NO PROBLEM'
      },
      recommendation: !userInDb ? 'User deleted from database' :
                     userInDb.role !== 'admin' && userInDb.role !== 'super_admin' ? 'Update user role to admin' :
                     !userInDb.isActive ? 'Activate user account' : 'Everything looks good!'
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
}