// pages/api/debug/database.js - Complete database inspector
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../models/Admin';
import League from '../../../models/League';
import Team from '../../../models/Team';

export default async function handler(req, res) {
  console.log('🔍 Database Inspector called');

  try {
    await dbConnect();
    console.log('✅ Database connected');

    // Get all collections data
    const debug = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // Check Admins
    try {
      const admins = await Admin.find({}).lean();
      debug.collections.admins = {
        count: admins.length,
        data: admins.map(admin => ({
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt
        }))
      };
      console.log(`📊 Found ${admins.length} admins`);
    } catch (error) {
      debug.collections.admins = { error: error.message };
    }

    // Check Leagues
    try {
      const leagues = await League.find({}).lean();
      debug.collections.leagues = {
        count: leagues.length,
        data: leagues.map(league => ({
          id: league._id,
          name: league.name,
          type: league.type,
          sport: league.sport,
          status: league.status,
          teams: league.teams || []
        }))
      };
      console.log(`📊 Found ${leagues.length} leagues`);
    } catch (error) {
      debug.collections.leagues = { error: error.message };
    }

    // Check Teams
    try {
      const teams = await Team.find({}).lean();
      debug.collections.teams = {
        count: teams.length,
        data: teams.map(team => ({
          id: team._id,
          name: team.name,
          leagues: team.leagues || [],
          players: team.players || []
        }))
      };
      console.log(`📊 Found ${teams.length} teams`);
    } catch (error) {
      debug.collections.teams = { error: error.message };
    }

    // Check specific email if provided
    if (req.method === 'POST' && req.body.checkEmail) {
      const email = req.body.checkEmail.toLowerCase();
      console.log(`🔍 Checking for email: ${email}`);
      
      const existingAdmin = await Admin.findOne({ email });
      debug.emailCheck = {
        email: email,
        exists: !!existingAdmin,
        adminData: existingAdmin ? {
          id: existingAdmin._id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: existingAdmin.role
        } : null
      };
    }

    // Database cleanup actions
    if (req.method === 'POST' && req.body.action) {
      const { action, email } = req.body;
      
      switch (action) {
        case 'delete_email':
          if (email) {
            const result = await Admin.deleteOne({ email: email.toLowerCase() });
            debug.action = {
              type: 'delete_email',
              email: email,
              deleted: result.deletedCount > 0,
              count: result.deletedCount
            };
          }
          break;

        case 'clear_all_admins':
          const deleteResult = await Admin.deleteMany({});
          debug.action = {
            type: 'clear_all_admins',
            deleted: deleteResult.deletedCount
          };
          break;

        case 'drop_admin_indexes':
          // Drop all indexes on admins collection except _id
          const db = mongoose.connection.db;
          const adminIndexes = await db.collection('admins').indexes();
          
          for (const index of adminIndexes) {
            if (index.name !== '_id_') {
              await db.collection('admins').dropIndex(index.name);
            }
          }
          
          // Recreate the email index
          await db.collection('admins').createIndex(
            { email: 1 }, 
            { unique: true, name: 'email_unique' }
          );
          
          debug.action = {
            type: 'drop_admin_indexes',
            droppedIndexes: adminIndexes.filter(i => i.name !== '_id_').map(i => i.name),
            recreated: 'email_unique'
          };
          break;

        case 'nuclear_reset':
          // Complete nuclear reset - drop collection and recreate
          const mongodb = mongoose.connection.db;
          await mongodb.collection('admins').drop().catch(() => {}); // Ignore if doesn't exist
          
          // Recreate with fresh schema
          const newAdmin = new Admin({
            name: 'Super Admin',
            email: 'admin@example.com',
            password: 'password123',
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
          
          await newAdmin.save();
          
          debug.action = {
            type: 'nuclear_reset',
            collectionDropped: true,
            adminCreated: {
              id: newAdmin._id,
              email: newAdmin.email,
              name: newAdmin.name
            }
          };
          break;

        case 'create_fresh_admin':
          // Delete all existing admins first
          await Admin.deleteMany({});
          
          // Create a fresh admin
          const freshAdmin = new Admin({
            name: 'Super Admin',
            email: 'admin@example.com',
            password: 'password123',
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
          
          await freshAdmin.save();
          
          debug.action = {
            type: 'create_fresh_admin',
            created: true,
            admin: {
              id: freshAdmin._id,
              email: freshAdmin.email,
              name: freshAdmin.name
            }
          };
          break;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Database inspection completed',
      debug: debug
    });

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database inspection failed',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}