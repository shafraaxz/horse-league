// pages/api/admin/index.js - Admin Management API
import { connectToDatabase } from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin authentication
const verifyAdminAuth = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export default async function handler(req, res) {
  const { method } = req;

  try {
    const { db } = await connectToDatabase();
    const adminsCollection = db.collection('admins');

    switch (method) {
      case 'GET':
        return await getAdmins(req, res, adminsCollection);
      case 'POST':
        return await createAdmin(req, res, adminsCollection);
      case 'PUT':
        return await updateAdmin(req, res, adminsCollection);
      case 'DELETE':
        return await deleteAdmin(req, res, adminsCollection);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

// Get all admins (requires admin auth)
async function getAdmins(req, res, adminsCollection) {
  try {
    verifyAdminAuth(req);
    
    const admins = await adminsCollection.find({})
      .project({ password: 0 }) // Don't return passwords
      .toArray();
    
    return res.status(200).json(admins);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

// Create new admin
async function createAdmin(req, res, adminsCollection) {
  try {
    verifyAdminAuth(req);
    
    const { username, password, email, role = 'admin', isActive = true } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if username already exists
    const existingAdmin = await adminsCollection.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin object
    const newAdmin = {
      username,
      password: hashedPassword,
      email: email || null,
      role,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert into database
    const result = await adminsCollection.insertOne(newAdmin);
    
    // Return without password
    const { password: _, ...adminResponse } = newAdmin;
    adminResponse._id = result.insertedId;
    
    return res.status(201).json({
      message: 'Admin created successfully',
      admin: adminResponse
    });
    
  } catch (error) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}

// Update admin (including password change)
async function updateAdmin(req, res, adminsCollection) {
  try {
    verifyAdminAuth(req);
    
    const { username, password, email, role, isActive, _id } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Find existing admin
    const existingAdmin = await adminsCollection.findOne({ 
      $or: [
        { _id: require('mongodb').ObjectId(_id) },
        { username }
      ]
    });
    
    if (!existingAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Prepare update object
    const updateData = {
      email: email || null,
      role: role || 'admin',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    };
    
    // If password is provided, hash and update it
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    // Update in database
    await adminsCollection.updateOne(
      { _id: require('mongodb').ObjectId(_id) },
      { $set: updateData }
    );
    
    // Get updated admin (without password)
    const updatedAdmin = await adminsCollection.findOne(
      { _id: require('mongodb').ObjectId(_id) },
      { projection: { password: 0 } }
    );
    
    return res.status(200).json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
    
  } catch (error) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}

// Delete admin
async function deleteAdmin(req, res, adminsCollection) {
  try {
    verifyAdminAuth(req);
    
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Don't allow deleting the last admin
    const adminCount = await adminsCollection.countDocuments({});
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }
    
    const result = await adminsCollection.deleteOne({ username });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    return res.status(200).json({ message: 'Admin deleted successfully' });
    
  } catch (error) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}