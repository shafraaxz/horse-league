// pages/api/debug/check-token.js - Debug token storage
export default async function handler(req, res) {
  try {
    // Check what token is being sent
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔍 Authorization header:', authHeader);
    console.log('🔍 Extracted token:', token ? `${token.substring(0, 20)}...` : 'NONE');
    
    return res.status(200).json({
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader || 'MISSING',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
      allHeaders: Object.keys(req.headers),
      instructions: {
        check: 'Look at browser localStorage for adminToken',
        fix: 'Make sure token is stored after login and sent with requests'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}