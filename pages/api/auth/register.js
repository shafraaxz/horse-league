// FILE: pages/api/auth/register.js (COMPLETELY FIXED)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { hashPassword } from '../../../lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await dbConnect();

    // Check if ANY user exists at all (first time setup)
    const userCount = await User.countDocuments({});
    
    if (userCount === 0) {
      // This is the very first user - make them admin automatically
      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin', // First user is always admin
      });

      return res.status(201).json({
        message: 'First admin user created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // For subsequent users, check if we have a valid admin session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Authentication required. Please login first.' });
    }
    
    if (session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required to create new users' });
    }

    // Create the new user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      createdBy: session.user.id,
    });

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}