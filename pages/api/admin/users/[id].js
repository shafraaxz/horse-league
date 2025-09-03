// pages/api/admin/users/[id].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  const { id } = req.query;
  
  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const user = await db
        .collection('users')
        .findOne(
          { _id: new ObjectId(id) },
          { projection: { password: 0 } } // Exclude password
        );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated via this endpoint
      delete updateData._id;
      delete updateData.password; // Password updates should go through a separate endpoint
      
      // Add updated timestamp
      updateData.updatedAt = new Date();

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

      const result = await db
        .collection('users')
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return updated user (without password)
      const updatedUser = await db
        .collection('users')
        .findOne(
          { _id: new ObjectId(id) },
          { projection: { password: 0 } }
        );

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Prevent admin from deleting themselves
      if (session.user.id === id) {
        return res.status(400).json({ 
          message: 'You cannot delete your own account' 
        });
      }

      const result = await db
        .collection('users')
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
