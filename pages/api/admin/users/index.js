// pages/api/admin/users/index.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
// Use the exact import paths from your working files
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

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

    if (req.method === 'GET') {
      try {
        const { role } = req.query;
        
        // Build query filter
        const filter = {};
        if (role) {
          filter.role = role;
        }

        console.log('Fetching users with filter:', filter);

        // Fetch users (exclude password field) and populate createdBy
        const users = await User
          .find(filter)
          .select('-password') // Exclude password from results
          .populate('createdBy', 'name email') // Populate who created this user
          .sort({ createdAt: -1 })
          .lean(); // Convert to plain JavaScript objects

        console.log('Found users:', users.length);

        res.status(200).json(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
          message: 'Failed to fetch users',
          error: error.message 
        });
      }
    } else if (req.method === 'POST') {
      // Create new user
      try {
        const { name, email, password, role = 'user' } = req.body;

        console.log('Creating user:', { name, email, role });

        // Validate required fields
        if (!name || !email || !password) {
          return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role,
          createdBy: session.user.id || null, // Track who created this user
        });

        const savedUser = await newUser.save();

        // Populate createdBy and remove password before sending response
        const userResponse = await User
          .findById(savedUser._id)
          .select('-password')
          .populate('createdBy', 'name email')
          .lean();

        console.log('User created successfully:', userResponse._id);

        res.status(201).json(userResponse);
      } catch (error) {
        console.error('Error creating user:', error);
        
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
            message: 'User with this email already exists' 
          });
        }

        res.status(500).json({ 
          message: 'Failed to create user',
          error: error.message 
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
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
