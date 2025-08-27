// pages/api/admins/index.js - Bulletproof admin API
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`🌐 Admin API: ${req.method} /api/admins`);
  console.log('📝 Request body:', req.method === 'POST' ? { ...req.body, password: '[HIDDEN]' } : 'N/A');

  // Step 1: Database Connection
  let dbConnect, Admin, bcrypt;
  try {
    console.log('📡 Connecting to database...');
    dbConnect = (await import('../../../lib/mongodb')).default;
    await dbConnect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      step: 'database_connection'
    });
  }

  // Step 2: Import Admin Model
  try {
    console.log('📦 Importing Admin model...');
    Admin = (await import('../../../models/Admin')).default;
    console.log('✅ Admin model imported');
  } catch (error) {
    console.error('❌ Admin model import failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin model import failed',
      error: error.message,
      step: 'model_import'
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      console.log('📋 Fetching admins...');
      const admins = await Admin.find({}).select('-password').lean();
      console.log(`✅ Found ${admins.length} admins`);

      return res.status(200).json({
        success: true,
        count: admins.length,
        data: admins,
        admins: admins // backward compatibility
      });
    } catch (error) {
      console.error('❌ Error fetching admins:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admins',
        error: error.message,
        step: 'fetch_admins'
      });
    }
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      // Step 3: Validate Input
      console.log('✅ Validating input...');
      const { name, email, password, role = 'super_admin', permissions, assignedLeagues } = req.body;

      if (!name || !email || !password) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required',
          step: 'input_validation'
        });
      }

      if (password.length < 6) {
        console.log('❌ Password too short');
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
          step: 'password_validation'
        });
      }

      console.log('✅ Input validation passed');

      // Step 4: Check Existing Admin
      console.log('🔍 Checking for existing admin...');
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        console.log('❌ Admin already exists');
        return res.status(400).json({
          success: false,
          message: 'An admin with this email already exists',
          step: 'duplicate_check'
        });
      }
      console.log('✅ No duplicate admin found');

      // Step 5: Import and Use Bcrypt
      try {
        console.log('🔐 Importing bcrypt...');
        bcrypt = await import('bcryptjs');
        console.log('✅ Bcrypt imported');
      } catch (error) {
        console.error('❌ Bcrypt import failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Password hashing library import failed',
          error: error.message,
          step: 'bcrypt_import'
        });
      }

      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('✅ Password hashed successfully');

      // Step 6: Set Default Permissions
      console.log('🔑 Setting permissions...');
      const defaultPermissions = {
        canCreateLeague: role === 'super_admin',
        canEditLeague: role === 'super_admin' || role === 'league_admin',
        canDeleteLeague: role === 'super_admin',
        canManageTeams: role !== 'viewer',
        canManageMatches: role !== 'viewer',
        canManagePlayers: role !== 'viewer',
        canViewReports: true,
        canManageAdmins: role === 'super_admin'
      };

      // Step 7: Create Admin Data
      const adminData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        permissions: permissions || defaultPermissions,
        assignedLeagues: assignedLeagues || [],
        isActive: true
      };

      console.log('👤 Admin data prepared:', {
        ...adminData,
        password: '[HIDDEN]'
      });

      // Step 8: Create and Save Admin
      console.log('💾 Creating admin...');
      const admin = new Admin(adminData);
      
      // Validate before saving
      const validationError = admin.validateSync();
      if (validationError) {
        console.error('❌ Validation error:', validationError);
        return res.status(400).json({
          success: false,
          message: 'Validation failed: ' + Object.values(validationError.errors).map(e => e.message).join(', '),
          step: 'validation'
        });
      }

      const savedAdmin = await admin.save();
      console.log('✅ Admin created successfully with ID:', savedAdmin._id);

      // Step 9: Prepare Response
      const responseAdmin = savedAdmin.toObject();
      delete responseAdmin.password;

      return res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: responseAdmin,
        admin: responseAdmin // backward compatibility
      });

    } catch (error) {
      console.error('❌ Error in POST request:', error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'An admin with this email already exists',
          step: 'duplicate_key_error'
        });
      }

      if (error.name === 'ValidationError') {
        const validationMessages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error: ' + validationMessages.join(', '),
          step: 'mongoose_validation'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create admin',
        error: error.message,
        step: 'admin_creation'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed`
  });
}