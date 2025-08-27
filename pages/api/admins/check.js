// pages/api/admins/check.js - Check if any admin exists
// =====================================================

import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const adminCount = await Admin.countDocuments();
    
    res.status(200).json({
      success: true,
      hasAdmin: adminCount > 0,
      count: adminCount
    });
  } catch (error) {
    console.error('Error checking admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check admin status',
      error: error.message
    });
  }
}
