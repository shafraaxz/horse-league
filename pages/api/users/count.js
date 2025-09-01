// FILE: pages/api/users/count.js (NEW - Helper endpoint)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const totalUsers = await User.countDocuments({});
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    res.status(200).json({
      totalUsers,
      adminCount,
      hasUsers: totalUsers > 0,
      hasAdmins: adminCount > 0,
    });
  } catch (error) {
    console.error('Count users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
