
// pages/api/auth/test-login.js - Test route to check admin password
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Find the demo admin
    const admin = await Admin.findOne({ email: 'admin@demo.com' });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Test password
    const testPassword = 'demo123';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    
    // Also create a new hash to compare
    const newHash = await bcrypt.hash('demo123', 10);
    
    res.status(200).json({
      adminFound: true,
      email: admin.email,
      hasPassword: !!admin.password,
      passwordLength: admin.password?.length,
      passwordStartsWith: admin.password?.substring(0, 10),
      testPasswordValid: isValid,
      newHashSample: newHash.substring(0, 10),
      bcryptFormat: admin.password?.startsWith('$2'),
      role: admin.role,
      isActive: admin.isActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
