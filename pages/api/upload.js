// ===========================================
// FILE: pages/api/upload.js (UPDATED TO USE EXISTING CLOUDINARY HELPER)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import formidable from 'formidable';
import { uploadImage } from '../../lib/cloudinary'; // Use your existing helper
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    console.log('Upload - Session check:', { 
      hasSession: !!session, 
      userRole: session?.user?.role 
    });
    
    if (!session) {
      console.log('No session found for upload');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'admin') {
      console.log('User is not admin for upload:', session.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPEG, PNG, and GIF files are allowed.' 
      });
    }

    console.log('Uploading file to Cloudinary:', file.originalFilename);

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Determine folder based on upload type (from form fields)
    const uploadType = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const folder = uploadType === 'player' ? 'horse-futsal/players' : 
                  uploadType === 'team' ? 'horse-futsal/teams' : 
                  'horse-futsal/general';

    // Upload using your existing Cloudinary helper
    const result = await uploadImage(fileBuffer, folder);

    console.log('Cloudinary upload successful:', result.public_id);

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (cleanupError) {
      console.warn('Could not delete temp file:', cleanupError);
    }

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}