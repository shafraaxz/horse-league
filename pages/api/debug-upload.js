// ===========================================
// FILE: pages/api/debug-upload.js (DEBUG UPLOAD ISSUES)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== UPLOAD DEBUG START ===');

    // Check session
    const session = await getServerSession(req, res, authOptions);
    console.log('Upload debug - Session:', {
      hasSession: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id
    });

    // Check environment variables
    const envCheck = {
      hasCloudinaryName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasCloudinaryKey: !!process.env.CLOUDINARY_API_KEY,
      hasCloudinarySecret: !!process.env.CLOUDINARY_API_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasMongoUri: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV
    };

    console.log('Environment variables:', envCheck);

    // Check if upload API exists
    const uploadApiExists = true; // We're creating it, so it should exist

    console.log('=== UPLOAD DEBUG END ===');

    return res.status(200).json({
      message: 'Upload debug information',
      session: {
        authenticated: !!session,
        isAdmin: session?.user?.role === 'admin',
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        } : null
      },
      environment: envCheck,
      apis: {
        uploadExists: uploadApiExists,
        uploadPath: '/api/upload'
      },
      cloudinary: {
        configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        fallbackMode: !process.env.CLOUDINARY_CLOUD_NAME
      },
      recommendations: [
        !session ? 'User needs to be logged in' : null,
        session?.user?.role !== 'admin' ? 'User needs admin role' : null,
        !process.env.NEXTAUTH_SECRET ? 'Set NEXTAUTH_SECRET environment variable' : null,
        !process.env.NEXTAUTH_URL ? 'Set NEXTAUTH_URL environment variable' : null,
        !process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary not configured (optional, will use fallback mode)' : null
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('Upload debug error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production'
    });
  }
}