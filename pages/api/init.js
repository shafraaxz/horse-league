import connectDB from '../../lib/mongodb';
import { Admin } from '../../lib/models';
import { hashPassword } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Initializing database...');
    
    await connectDB();
    
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Default admin already exists',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        admin: {
          username: 'admin',
          note: 'Default admin account ready'
        }
      });
    }

    const hashedPassword = await hashPassword('admin123');
    const defaultAdmin = new Admin({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    await defaultAdmin.save();
    console.log('Default admin created');

    res.status(201).json({ 
      message: 'Default admin created successfully',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      admin: {
        username: 'admin',
        password: 'admin123',
        note: 'Default admin account created'
      }
    });
  } catch (error) {
    console.error('Database init error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize database',
      details: error.message,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    });
  }
}
