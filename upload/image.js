// pages/api/upload/image.js - Cloudinary image upload endpoint
import { uploadImage } from '../../../lib/cloudinary';
import { authMiddleware } from '../../../lib/auth';
import formidable from 'formidable';

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
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.image?.[0];
    const uploadType = fields.type?.[0] || 'general'; // team, player, league, general
    
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      });
    }

    // Convert file to base64 for Cloudinary upload
    const fs = require('fs');
    const fileData = fs.readFileSync(file.filepath);
    const base64String = `data:${file.mimetype};base64,${fileData.toString('base64')}`;

    // Upload to Cloudinary with specific folder based on type
    const folderMap = {
      team: 'football-manager/teams',
      player: 'football-manager/players', 
      league: 'football-manager/leagues',
      general: 'football-manager/general'
    };

    const imageUrl = await uploadImage(base64String, folderMap[uploadType]);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
      type: uploadType
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
}

export default authMiddleware(handler);