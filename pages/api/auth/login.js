import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { verifyPassword, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Login attempt...');
    await connectDB();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      console.log('Admin not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await verifyPassword(password, admin.password);
    
    if (!isValidPassword) {
      console.log('Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(admin._id.toString(), admin.username, admin.role);

    console.log('Login successful for:', username);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: admin._id.toString(),
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
