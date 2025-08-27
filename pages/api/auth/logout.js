// 7. pages/api/auth/logout.js - Logout endpoint
// =====================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Clear cookies
  res.setHeader('Set-Cookie', [
    'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  ]);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}
