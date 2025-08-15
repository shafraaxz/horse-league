import connectDB from '../../../lib/mongodb';
import { Admin } from '../../../lib/models';
import { hashPassword, authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      return getAdmins(req, res);
    case 'POST':
      return createAdmin(req, res);
    case 'DELETE':
      return deleteAdmin(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAdmins(req, res) {
  try {
    const admins = await Admin.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
}

async function createAdmin(req, res) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const admin = new Admin({
      username,
      password: hashedPassword,
      role
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
}

async function deleteAdmin(req, res) {
  try {
    const { username } = req.query;

    if (username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete default admin' });
    }

    const deletedAdmin = await Admin.findOneAndDelete({ username });
    if (!deletedAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete admin' });
  }
}

export default authMiddleware(handler);