// pages/api/admin/users/index.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { role } = req.query;
      
      // Build query filter
      const filter = {};
      if (role) {
        filter.role = role;
      }

      // Fetch users (exclude password field)
      const users = await db
        .collection('users')
        .find(filter)
        .project({ password: 0 }) // Exclude password from results
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  } else if (req.method === 'POST') {
    // Create new user (if you want to handle user creation here too)
    try {
      const { name, email, password, role = 'user' } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const newUser = {
        name,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('users').insertOne(newUser);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      userWithoutPassword._id = result.insertedId;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}