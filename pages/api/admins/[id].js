// pages/api/admins/[id].js - Fixed admin ID route with better validation
import dbConnect from '../../../lib/mongodb';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  console.log(`🌐 Admin ID API: ${method} /api/admins/${id}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Special handling for non-ObjectId routes
  if (id === 'check' || id === 'setup' || id === 'debug' || id === 'test') {
    return res.status(404).json({
      success: false,
      message: `Endpoint /api/admins/${id} not found. Use the correct endpoint.`,
      hint: `For ${id}, use /api/admins/${id} as a separate file, not as an ID parameter.`
    });
  }

  // Validate MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!id || !objectIdRegex.test(id)) {
    console.log('❌ Invalid ObjectId format:', id);
    return res.status(400).json({
      success: false,
      message: 'Invalid admin ID format. Must be a valid MongoDB ObjectId (24 hex characters).',
      received: id,
      expected: 'Example: 507f1f77bcf86cd799439011'
    });
  }

  try {
    await dbConnect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }

  let Admin;
  try {
    Admin = (await import('../../../models/Admin')).default;
    console.log('✅ Admin model imported');
  } catch (error) {
    console.error('❌ Admin model import failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin model import failed',
      error: error.message
    });
  }

  switch (method) {
    case 'GET':
      try {
        console.log(`🔍 Getting admin with ID: ${id}`);
        
        const admin = await Admin.findById(id)
          .select('-password')
          .populate('assignedLeagues', 'name type sport status');

        if (!admin) {
          console.log('❌ Admin not found');
          return res.status(404).json({
            success: false,
            message: 'Admin not found',
            id: id
          });
        }

        console.log('✅ Admin found:', admin.name);
        return res.status(200).json({
          success: true,
          data: admin,
          admin: admin // backward compatibility
        });
      } catch (error) {
        console.error('❌ Error fetching admin:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch admin',
          error: error.message
        });
      }

    case 'PUT':
      try {
        console.log(`✏️ Updating admin with ID: ${id}`);
        
        const updates = { ...req.body };
        
        // If password is being updated, hash it
        if (updates.password) {
          if (updates.password.length < 6) {
            return res.status(400).json({
              success: false,
              message: 'Password must be at least 6 characters'
            });
          }
          
          const bcrypt = await import('bcryptjs');
          updates.password = await bcrypt.hash(updates.password, 12);
          console.log('🔐 Password hashed for update');
        }

        const admin = await Admin.findByIdAndUpdate(
          id,
          updates,
          { new: true, runValidators: true }
        )
        .select('-password')
        .populate('assignedLeagues', 'name type sport status');

        if (!admin) {
          console.log('❌ Admin not found for update');
          return res.status(404).json({
            success: false,
            message: 'Admin not found',
            id: id
          });
        }

        console.log('✅ Admin updated successfully');
        return res.status(200).json({
          success: true,
          message: 'Admin updated successfully',
          data: admin,
          admin: admin // backward compatibility
        });
      } catch (error) {
        console.error('❌ Error updating admin:', error);
        
        if (error.name === 'ValidationError') {
          const validationMessages = Object.values(error.errors).map(err => err.message);
          return res.status(400).json({
            success: false,
            message: 'Validation error: ' + validationMessages.join(', ')
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to update admin',
          error: error.message
        });
      }

    case 'DELETE':
      try {
        console.log(`🗑️ Deleting admin with ID: ${id}`);
        
        const deletedAdmin = await Admin.findByIdAndDelete(id);

        if (!deletedAdmin) {
          console.log('❌ Admin not found for deletion');
          return res.status(404).json({
            success: false,
            message: 'Admin not found',
            id: id
          });
        }

        console.log('✅ Admin deleted successfully');
        return res.status(200).json({
          success: true,
          message: 'Admin deleted successfully',
          deletedId: id
        });
      } catch (error) {
        console.error('❌ Error deleting admin:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete admin',
          error: error.message
        });
      }

    default:
      return res.status(405).json({
        success: false,
        message: `Method ${method} not allowed for this endpoint`
      });
  }
}