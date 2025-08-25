// api/admins/index.js - Admin Management
import { 
  compose, 
  cors, 
  rateLimit, 
  authenticate,
  requirePermission 
} from '../_lib/middleware.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    authenticate,
    requirePermission('manage_admins'),
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getAdmins(req, res);
        } else if (req.method === 'POST') {
          return await createAdmin(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Admins API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/admins - Get All Admins
async function getAdmins(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    role,
    status,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  try {
    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [admins, total] = await Promise.all([
      req.db.collection('admins')
        .find(query, { projection: { passwordHash: 0 } })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      req.db.collection('admins').countDocuments(query)
    ]);

    // Add activity info for each admin
    const adminsWithActivity = await Promise.all(
      admins.map(async (admin) => {
        const activeTokens = await req.db.collection('refresh_tokens')
          .countDocuments({ 
            adminId: admin._id,
            expiresAt: { $gt: new Date() }
          });

        return {
          ...admin,
          isOnline: activeTokens > 0,
          activeTokens
        };
      })
    );

    const response = {
      admins: adminsWithActivity,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: { role, status, search }
    };

    res.status(200).json(formatResponse(response, 'Admins retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve admins: ${error.message}`);
  }
}

// POST /api/admins - Create New Admin
async function createAdmin(req, res) {
  const { name, email, phone, role = 'admin', permissions, password, sendInvite = false } = req.body;

  // Validation
  if (!name || !email) {
    return res.status(400).json(formatError('Name and email are required'));
  }

  if (!['super-admin', 'admin', 'moderator'].includes(role)) {
    return res.status(400).json(formatError('Invalid role'));
  }

  try {
    // Check if admin with email already exists
    const existingAdmin = await req.db.collection('admins')
      .findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return res.status(409).json(formatError('Admin with this email already exists'));
    }

    // Generate default password if not provided
    const defaultPassword = password || generateRandomPassword();
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    // Get default permissions for role
    const defaultPermissions = getDefaultPermissions(role);

    const adminData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      role,
      permissions: permissions || defaultPermissions,
      status: 'active',
      passwordHash,
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.admin._id
    };

    const result = await req.db.collection('admins')
      .insertOne(adminData);

    if (!result.insertedId) {
      throw new Error('Failed to create admin');
    }

    // Get created admin without password hash
    const newAdmin = await req.db.collection('admins')
      .findOne(
        { _id: result.insertedId },
        { projection: { passwordHash: 0 } }
      );

    // Send invitation email if requested
    if (sendInvite) {
      await sendAdminInvitation(email, name, defaultPassword);
    }

    const response = {
      ...newAdmin,
      temporaryPassword: sendInvite ? null : defaultPassword
    };

    res.status(201).json(formatResponse(response, 'Admin created successfully'));
  } catch (error) {
    throw new Error(`Failed to create admin: ${error.message}`);
  }
}

// Helper functions
function getDefaultPermissions(role) {
  const permissions = {
    'super-admin': [
      'manage_players', 'manage_teams', 'manage_schedules', 'manage_admins', 
      'view_statistics', 'export_data', 'manage_gallery', 'manage_seasons',
      'system_settings', 'view_logs'
    ],
    'admin': [
      'manage_players', 'manage_teams', 'manage_schedules', 
      'view_statistics', 'export_data', 'manage_gallery'
    ],
    'moderator': [
      'manage_players', 'manage_teams', 'view_statistics'
    ]
  };
  return permissions[role] || permissions.moderator;
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendAdminInvitation(email, name, password) {
  // TODO: Implement email sending logic
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`Admin invitation sent to ${email} with password: ${password}`);
}
