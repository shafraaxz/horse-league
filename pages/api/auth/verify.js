// 8. pages/api/auth/verify.js - Verify token endpoint
// =====================================================

import { authenticate } from '../../../middleware/auth';

const verifyHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // If we reach here, the token is valid (middleware passed)
  res.status(200).json({
    success: true,
    user: req.user
  });
};

export default authenticate(verifyHandler);
