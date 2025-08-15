// pages/api/upload/image.js - Fixed Cloudinary image upload endpoint
import { uploadImage } from '../../../lib/cloudinary';
import { authMiddleware } from '../../../lib/auth';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📤 Image upload request received');

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.image?.[0];
    const uploadType = fields.type?.[0] || 'general'; // team, player, league, general
    
    console.log('📁 Upload type:', uploadType);
    console.log('📄 File info:', file ? file.originalFilename : 'No file');
    
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.log('❌ Invalid file type:', file.mimetype);
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      });
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      return res.status(400).json({
        error: 'File size must be less than 5MB'
      });
    }

    console.log('✅ File validation passed');

    // Read file and convert to base64 for Cloudinary upload
    const fileData = fs.readFileSync(file.filepath);
    const base64String = `data:${file.mimetype};base64,${fileData.toString('base64')}`;

    // Upload to Cloudinary with specific folder based on type
    const folderMap = {
      team: 'football-manager/teams',
      player: 'football-manager/players', 
      league: 'football-manager/leagues',
      general: 'football-manager/general'
    };

    const folder = folderMap[uploadType] || folderMap.general;
    console.log('☁️ Uploading to Cloudinary folder:', folder);

    const imageUrl = await uploadImage(base64String, folder);
    console.log('✅ Upload successful:', imageUrl);

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
      console.log('🗑️ Temp file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temp file:', cleanupError.message);
    }

    res.status(200).json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
      type: uploadType,
      originalName: file.originalFilename,
      size: file.size
    });

  } catch (error) {
    console.error('💥 Image upload error:', error);
    
    // Return appropriate error message
    let errorMessage = 'Failed to upload image';
    let statusCode = 500;

    if (error.message.includes('Invalid image')) {
      errorMessage = 'Invalid image file format';
      statusCode = 400;
    } else if (error.message.includes('File too large')) {
      errorMessage = 'File size exceeds 5MB limit';
      statusCode = 400;
    } else if (error.message.includes('Cloudinary')) {
      errorMessage = 'Cloud storage service unavailable';
      statusCode = 503;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Single export default
export default authMiddleware(handler);