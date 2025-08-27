// pages/api/upload.js - Enhanced Cloudinary Upload API
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { promisify } from 'util';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadMiddleware = promisify(upload.single('image'));

export default async function handler(req, res) {
  const { method } = req;

  console.log(`📤 Upload API: ${method} /api/upload`);

  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration is missing'
      });
    }

    // Parse the multipart form data
    await uploadMiddleware(req, res);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { type = 'general' } = req.body;

    console.log(`📄 Processing upload:`, {
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadType: type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type: ${req.file.mimetype}. Only JPEG, PNG, and WebP are allowed`
      });
    }

    // Determine folder and transformation based on upload type
    let folder = 'horse-futsal-league';
    let transformation = [];
    const timestamp = Date.now();

    switch (type) {
      case 'league-logo':
        folder = 'horse-futsal-league/logos';
        transformation = [
          { width: 500, height: 500, crop: 'fill', gravity: 'center' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
        break;
        
      case 'team-logo':
        folder = 'horse-futsal-league/teams';
        transformation = [
          { width: 400, height: 400, crop: 'fill', gravity: 'center' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
        break;
        
      case 'player-photo':
        folder = 'horse-futsal-league/players';
        transformation = [
          { width: 300, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
        break;
        
      case 'league-banner':
        folder = 'horse-futsal-league/banners';
        transformation = [
          { width: 1200, height: 400, crop: 'fill', gravity: 'center' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
        break;
        
      case 'match-photo':
        folder = 'horse-futsal-league/matches';
        transformation = [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
        break;
        
      default:
        folder = 'horse-futsal-league/general';
        transformation = [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
    }

    console.log(`☁️ Uploading to Cloudinary...`);
    console.log(`📁 Folder: ${folder}`);
    console.log(`🏷️ Upload type: ${type}`);

    // Upload to Cloudinary using buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${type}-${timestamp}`,
          transformation: transformation,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result.public_id);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(req.file.buffer);
    });

    // Return successful response
    const response = {
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
        uploadType: type,
        folder: folder,
        createdAt: uploadResult.created_at
      }
    };

    console.log('📤 Upload response:', {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      size: uploadResult.bytes
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Upload handler error:', error);

    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }

    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
      });
    }

    // Handle Cloudinary errors
    if (error.error && error.error.message) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary upload failed',
        error: error.error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
}

// Disable the default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to delete image from Cloudinary
export async function deleteFromCloudinary(publicId) {
  try {
    console.log('🗑️ Deleting from Cloudinary:', publicId);
    
    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Cloudinary deletion result:', result);
    
    return {
      success: result.result === 'ok',
      result: result.result,
      publicId: publicId
    };
  } catch (error) {
    console.error('❌ Cloudinary deletion error:', error);
    throw error;
  }
}

// Helper function to get image info
export async function getImageInfo(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      success: true,
      data: {
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at,
        folder: result.folder
      }
    };
  } catch (error) {
    console.error('❌ Error getting image info:', error);
    return {
      success: false,
      error: error.message
    };
  }
}