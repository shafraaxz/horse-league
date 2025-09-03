// pages/api/admin/users/[id].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
// FIXED: Correct import paths (4 levels up instead of 3)
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  try {
    // Connect to database
    await dbConnect();

    const session = await getServerSession(req, res, authOptions);

    // Check if user is authenticated and is an admin
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const { id } = req.query;
    
    console.log('User ID from query:', id);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (req.method === 'GET') {
      try {
        const user = await User
          .findById(id)
          .select('-password') // Exclude password
          .populate('createdBy', 'name email')
          .lean();

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
          message: 'Failed to fetch user',
          error: error.message 
        });
      }
    } else if (req.method === 'PATCH') {
      try {
        const updateData = req.body;
        
        console.log('Updating user with data:', updateData);

        // Remove fields that shouldn't be updated via this endpoint
        delete updateData._id;
        delete updateData.password; // Password updates should go through a separate endpoint
        delete updateData.createdBy; // Don't allow changing who created the user

        // Validate role if being updated
        if (updateData.role && !['user', 'admin'].includes(updateData.role)) {
          return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
        }

        // Prevent admin from removing their own admin privileges
        if (updateData.role === 'user' && session.user.id === id) {
          return res.status(400).json({ 
            message: 'You cannot remove your own admin privileges' 
          });
        }

        // Update user
        const updatedUser = await User
          .findByIdAndUpdate(
            id,
            updateData,
            { 
              new: true, // Return updated document
              runValidators: true // Run schema validation
            }
          )
          .select('-password')
          .populate('createdBy', 'name email')
          .lean();

        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }

        console.log('User updated successfully:', updatedUser._id);

        res.status(200).json(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
          const errors = Object.values(error.errors).map(err => err.message);
          return res.status(400).json({ 
            message: 'Validation error',
            errors 
          });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
          return res.status(400).json({ 
            message: 'Email already exists' 
          });
        }

        res.status(500).json({ 
          message: 'Failed to update user',
          error: error.message 
        });
      }
    } else if (req.method === 'DELETE') {
      try {
        // Prevent admin from deleting themselves
        if (session.user.id === id) {
          return res.status(400).json({ 
            message: 'You cannot delete your own account' 
          });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
          return res.status(404).json({ message: 'User not found' });
        }

        console.log('User deleted successfully:', deletedUser._id);

        res.status(200).json({ 
          message: 'User deleted successfully',
          deletedUser: {
            id: deletedUser._id,
            name: deletedUser.name,
            email: deletedUser.email
          }
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
          message: 'Failed to delete user',
          error: error.message 
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
