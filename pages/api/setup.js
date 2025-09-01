// ===========================================
// FILE: pages/api/setup.js
// ===========================================
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import Season from '../../models/Season';
import { hashPassword } from '../../lib/auth';

export default async function handler(req, res) {
  // Allow both GET and POST methods for easy browser access
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      });
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@horsefutsal.com',
      password: hashedPassword,
      role: 'admin',
    });

    // Create initial season if none exists
    const existingSeason = await Season.findOne({});
    
    if (!existingSeason) {
      const currentYear = new Date().getFullYear();
      await Season.create({
        name: `${currentYear} Season`,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`),
        isActive: true,
        maxTeams: 16,
        registrationDeadline: new Date(`${currentYear}-03-31`),
        description: 'Inaugural Horse Futsal Tournament Season',
      });
    }

    res.status(201).json({
      message: 'Setup completed successfully!',
      admin: {
        email: adminUser.email,
        name: adminUser.name,
      },
      credentials: {
        email: 'admin@horsefutsal.com',
        password: 'admin123',
        note: 'Please change password after first login!'
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      message: 'Setup failed', 
      error: error.message 
    });
  }
}