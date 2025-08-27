// pages/api/upload.js - Cloudinary Upload Handler
import { IncomingForm } from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('📤 Cloudinary upload endpoint hit!', req.method, req.headers['content-type']);

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      message: 'Cloudinary upload endpoint is working!',
      info: 'Use POST with multipart/form-data to upload files',
      cloudinary: {
        configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Not configured'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary not configured properly');
    return res.status(500).json({
      success: false,
      error: 'Cloudinary configuration missing',
      message: 'Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
    });
  }

  try {
    console.log('📋 Parsing form data...');

    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB for Cloudinary
      multiples: false,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('❌ Form parse error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to parse form',
          details: err.message
        });
      }

      console.log('📋 Fields received:', Object.keys(fields));
      console.log('📋 Files received:', Object.keys(files));

      const file = files.image;
      if (!file) {
        console.log('❌ No image file found in upload');
        return res.status(400).json({ 
          success: false, 
          error: 'No image file provided',
          debug: {
            fields: Object.keys(fields),
            files: Object.keys(files)
          }
        });
      }

      // Get the uploaded file (handle both array and single file)
      const uploadedFile = Array.isArray(file) ? file[0] : file;
      
      console.log('📄 Processing file:', {
        originalName: uploadedFile.originalFilename,
        size: uploadedFile.size,
        type: uploadedFile.mimetype,
        path: uploadedFile.filepath
      });

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(uploadedFile.mimetype)) {
        console.log('❌ Invalid file type:', uploadedFile.mimetype);
        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up temp file:', cleanupError.message);
        }
        return res.status(400).json({ 
          success: false, 
          error: `Invalid file type: ${uploadedFile.mimetype}. Only JPEG, PNG, and WebP are allowed` 
        });
      }

      // Validate file size (additional check)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        console.log('❌ File too large:', uploadedFile.size);
        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up temp file:', cleanupError.message);
        }
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 10MB'
        });
      }

      try {
        // Determine upload type and folder
        const uploadType = fields.type ? (Array.isArray(fields.type) ? fields.type[0] : fields.type) : 'general';
        const timestamp = Date.now();
        
        // Create folder structure in Cloudinary
        let folder = 'sports-league';
        switch (uploadType) {
          case 'league-logo':
            folder = 'sports-league/leagues';
            break;
          case 'team-logo':
            folder = 'sports-league/teams';
            break;
          case 'player-photo':
            folder = 'sports-league/players';
            break;
          case 'match-photo':
            folder = 'sports-league/matches';
            break;
          default:
            folder = 'sports-league/general';
        }

        console.log('☁️ Uploading to Cloudinary...');
        console.log('📁 Folder:', folder);
        console.log('🏷️ Upload type:', uploadType);

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(uploadedFile.filepath, {
          folder: folder,
          public_id: `${uploadType}-${timestamp}`,
          transformation: [
            {
              quality: 'auto:good',
              fetch_format: 'auto'
            },
            // Resize based on upload type
            ...(uploadType.includes('logo') ? [
              { width: 500, height: 500, crop: 'fill', gravity: 'center' }
            ] : uploadType === 'player-photo' ? [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' }
            ] : [
              { width: 1200, height: 800, crop: 'limit' }
            ])
          ],
          eager: [
            // Create thumbnail versions
            { width: 150, height: 150, crop: 'fill', gravity: 'center', format: 'webp' },
            { width: 300, height: 300, crop: 'fill', gravity: 'center', format: 'webp' }
          ],
          tags: [uploadType, 'sports-league']
        });

        console.log('✅ Cloudinary upload successful:', {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
          size: uploadResult.bytes,
          format: uploadResult.format
        });

        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
          console.log('🗑️ Temp file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up temp file:', cleanupError.message);
        }

        // Return the result
        return res.status(200).json({
          success: true,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          thumbnails: {
            small: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
            medium: uploadResult.eager?.[1]?.secure_url || uploadResult.secure_url
          },
          metadata: {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            size: uploadResult.bytes,
            uploadType: uploadType,
            folder: folder
          },
          message: 'Image uploaded successfully to Cloudinary'
        });

      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        
        // Clean up temp file
        try {
          fs.unlinkSync(uploadedFile.filepath);
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up temp file:', cleanupError.message);
        }

        return res.status(500).json({
          success: false,
          error: 'Failed to upload to Cloudinary',
          details: uploadError.message,
          cloudinaryError: uploadError.error?.message || 'Unknown Cloudinary error'
        });
      }
    });

  } catch (error) {
    console.error('❌ Upload handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
}

// Optional: Add a helper function to delete images from Cloudinary
export async function deleteFromCloudinary(publicId) {
  try {
    console.log('🗑️ Deleting from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Cloudinary deletion result:', result);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary deletion error:', error);
    throw error;
  }
}