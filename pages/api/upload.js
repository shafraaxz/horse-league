import formidable from 'formidable';
import { uploadImage } from '../../lib/cloudinary';
import { getSession } from 'next-auth/react';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    const [fields, files] = await form.parse(req);
    const file = files.file[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read file buffer
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(file.filepath);

    const folder = fields.folder?.[0] || 'horse-futsal';
    const result = await uploadImage(fileBuffer, folder);

    res.status(200).json({
      message: 'Upload successful',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
}
