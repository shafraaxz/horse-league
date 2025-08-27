// pages/api/admins/debug.js - Debug endpoint for troubleshooting
export default async function handler(req, res) {
  console.log('🐛 Debug endpoint called');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const { default: dbConnect } = await import('../../../lib/mongodb');
    await dbConnect();
    console.log('✅ Database connected successfully');

    // Test Admin model import
    console.log('📦 Testing Admin model import...');
    const { default: Admin } = await import('../../../models/Admin');
    console.log('✅ Admin model imported successfully');

    // Test bcrypt import
    console.log('🔐 Testing bcrypt import...');
    const bcrypt = await import('bcryptjs');
    const testHash = await bcrypt.hash('test123', 12);
    console.log('✅ Bcrypt working, test hash length:', testHash.length);

    // Get admin count
    console.log('📊 Checking existing admins...');
    const adminCount = await Admin.countDocuments();
    console.log('✅ Admin count:', adminCount);

    // Test admin creation with minimal data
    if (req.method === 'POST') {
      console.log('🧪 Testing admin creation...');
      
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = await bcrypt.hash('test123', 12);
      
      const testAdmin = new Admin({
        name: 'Test Admin',
        email: testEmail,
        password: testPassword,
        role: 'super_admin',
        permissions: {
          canCreateLeague: true,
          canEditLeague: true,
          canDeleteLeague: true,
          canManageTeams: true,
          canManageMatches: true,
          canManagePlayers: true,
          canViewReports: true,
          canManageAdmins: true
        }
      });

      const savedAdmin = await testAdmin.save();
      console.log('✅ Test admin created with ID:', savedAdmin._id);

      // Clean up test admin
      await Admin.findByIdAndDelete(savedAdmin._id);
      console.log('🧹 Test admin cleaned up');
    }

    return res.status(200).json({
      success: true,
      message: 'Debug check completed successfully',
      data: {
        databaseConnected: true,
        adminModelLoaded: true,
        bcryptWorking: true,
        existingAdminCount: adminCount,
        testCompleted: req.method === 'POST'
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Debug check failed',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }
    });
  }
}