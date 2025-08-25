// api/admins/[id].js - Individual Admin Management
import { ObjectId } from 'mongodb';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    authenticate,
    async (req, res) => {
      const { id } = req.query;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json(formatError('Invalid admin ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getAdmin(req, res, id);
        } else if (req.method === 'PUT') {
          return await compose(
            requirePermission('manage_admins'),
            async (req, res) => await updateAdmin(req, res, id)
          )(req, res);
        } else if (req.method === 'DELETE') {
          return await compose(
            requirePermission('manage_admins'),
            async (req, res) => await deleteAdmin(req, res, id)
          )(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/admins/[id] - Get Single Admin
async function getAdmin(req, res, id) {
  try {
    const admin = await req.db.collection('admins')
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { passwordHash: 0 } }
      );

    if (!admin) {
      return res.status(404).json(formatError('Admin not found'));
    }

    // Only allow viewing own profile or if user has manage_admins permission
    if (req.admin._id.toString() !== id && !req.admin.permissions.includes('manage_admins')) {
      return res.status(403).json(formatError('Access denied'));
    }

    // Get activity information
    const [activeTokens, recentActivity] = await Promise.all([
      req.db.collection('refresh_tokens')
        .countDocuments({ 
          adminId: admin._id,
          expiresAt: { $gt: new Date() }
        }),
      req.db.collection('admin_activity')
        .find({ adminId: admin._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
    ]);

    const response = {
      ...admin,
      isOnline: activeTokens > 0,
      activeTokens,
      recentActivity
    };

    res.status(200).json(formatResponse(response, 'Admin retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve admin: ${error.message}`);
  }
}

// PUT /api/admins/[id] - Update Admin
async function updateAdmin(req, res, id) {
  try {
    const existingAdmin = await req.db.collection('admins')
      .findOne({ _id: new ObjectId(id) });

    if (!existingAdmin) {
      return res.status(404).json(formatError('Admin not found'));
    }

    // Prevent non-super-admins from modifying super-admins
    if (existingAdmin.role === 'super-admin' && req.admin.role !== 'super-admin') {
      return res.status(403).json(formatError('Cannot modify super admin'));
    }

    // Prevent admins from changing their own role
    if (req.admin._id.toString() === id && req.body.role && req.body.role !== existingAdmin.role) {
      return res.status(403).json(formatError('Cannot change your own role'));
    }

    const updateData = {
      updatedAt: new Date(),
      updatedBy: req.admin._id
    };

    // Update allowed fields
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.phone !== undefined) updateData.phone = req.body.phone ? req.body.phone.trim() : null;
    if (req.body.role && req.body.role !== existingAdmin.role) {
      updateData.role = req.body.role;
      updateData.permissions = getDefaultPermissions(req.body.role);
    }
    if (req.body.permissions) updateData.permissions = req.body.permissions;
    if (req.body.status) updateData.status = req.body.status;

    // Hash new password if provided
    if (req.body.password) {
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(req.body.password, saltRounds);
      updateData.loginAttempts = 0;
      updateData.lockedUntil = null;

      // Invalidate all refresh tokens
      await req.db.collection('refresh_tokens')
        .deleteMany({ adminId: new ObjectId(id) });
    }

    const result = await req.db.collection('admins')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { 
          returnDocument: 'after',
          projection: { passwordHash: 0 }
        }
      );

    if (!result.value) {
      throw new Error('Failed to update admin');
    }

    res.status(200).json(formatResponse(result.value, 'Admin updated successfully'));
  } catch (error) {
    throw new Error(`Failed to update admin: ${error.message}`);
  }
}

// DELETE /api/admins/[id] - Delete Admin
async function deleteAdmin(req, res, id) {
  try {
    const admin = await req.db.collection('admins')
      .findOne({ _id: new ObjectId(id) });

    if (!admin) {
      return res.status(404).json(formatError('Admin not found'));
    }

    // Prevent deleting super-admin unless requester is also super-admin
    if (admin.role === 'super-admin' && req.admin.role !== 'super-admin') {
      return res.status(403).json(formatError('Cannot delete super admin'));
    }

    // Prevent deleting self
    if (req.admin._id.toString() === id) {
      return res.status(400).json(formatError('Cannot delete your own account'));
    }

    // Start transaction
    const session = req.db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete admin
        await req.db.collection('admins')
          .deleteOne({ _id: new ObjectId(id) }, { session });

        // Delete all refresh tokens
        await req.db.collection('refresh_tokens')
          .deleteMany({ adminId: new ObjectId(id) }, { session });

        // Archive admin activity
        await req.db.collection('admin_activity')
          .updateMany(
            { adminId: new ObjectId(id) },
            { $set: { adminDeleted: true } },
            { session }
          );
      });

      res.status(200).json(formatResponse(null, 'Admin deleted successfully'));
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to delete admin: ${error.message}`);
  }
}