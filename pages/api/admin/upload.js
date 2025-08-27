// pages/api/admin/upload.js - Admin-specific upload endpoint
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';
import { verifyAuth } from '../../../lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { method } = req;

  console.log(`Admin Upload API: ${method} /api/admin/upload`);

  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  // Verify admin authentication
  try {
    const user = await verifyAuth(req);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration is missing. Please check your environment variables.'
      });
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(400).json({
          success: false,
          message: 'Failed to parse upload form',
          error: err.message
        });
      }

      const uploadedFile = Array.isArray(files.image) ? files.image[0] : files.image;
      
      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      console.log('Processing file:', {
        originalName: uploadedFile.originalFilename,
        size: uploadedFile.size,
        type: uploadedFile.mimetype,
        path: uploadedFile.filepath
      });

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(uploadedFile.mimetype)) {
        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError.message);
        }
        return res.status(400).json({ 
          success: false, 
          message: `Invalid file type: ${uploadedFile.mimetype}. Only JPEG, PNG, and WebP are allowed` 
        });
      }

      // Validate file size
      if (uploadedFile.size > 10 * 1024 * 1024) {
        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError.message);
        }
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB'
        });
      }

      try {
        // Determine upload type and folder
        const uploadType = Array.isArray(fields.type) ? fields.type[0] : fields.type || 'general';
        const timestamp = Date.now();
        
        // Create folder structure in Cloudinary
        let folder = 'horse-futsal-league';
        let transformation = [];

        switch (uploadType) {
          case 'league-logo':
            folder = 'horse-futsal-league/logos';
            transformation = [
              { width: 500, height: 500, crop: 'fill', gravity: 'center' },
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
          default:
            folder = 'horse-futsal-league/general';
            transformation = [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ];
        }

        console.log('Uploading to Cloudinary...');
        console.log('Folder:', folder);
        console.log('Upload type:', uploadType);

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(uploadedFile.filepath, {
          folder: folder,
          public_id: `${uploadType}-${timestamp}`,
          transformation: transformation,
          resource_type: 'image'
        });

        console.log('Cloudinary upload success:', uploadResult.public_id);

        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError.message);
        }

        // Return successful response
        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully to Cloudinary',
          data: {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            size: uploadResult.bytes,
            uploadType: uploadType,
            folder: folder
          }
        });

      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        
        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError.message);
        }

        return res.status(500).json({
          success: false,
          message: 'Failed to upload to Cloudinary',
          error: uploadError.message,
          details: uploadError.error?.message || 'Unknown Cloudinary error'
        });
      }
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
}