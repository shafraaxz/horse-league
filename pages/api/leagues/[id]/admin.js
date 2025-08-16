// pages/api/leagues/[id]/admins.js - Manage league-specific admin assignments
import connectDB from '../../../../lib/mongodb';
import { Admin, League } from '../../../../lib/models';
import { authMiddleware } from '../../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();
    
    const { id: leagueId } = req.query;
    
    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    switch (req.method) {
      case 'GET':
        return await getLeagueAdmins(req, res, leagueId);
      case 'POST':
        return await authMiddleware(assignAdminToLeague)(req, res, leagueId);
      case 'DELETE':
        return await authMiddleware(removeAdminFromLeague)(req, res, leagueId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('League admin management error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET league admins - Show who has access to this league
async function getLeagueAdmins(req, res, leagueId) {
  try {
    console.log('🔍 Getting admins for league:', leagueId);

    // Get league info
    const league = await League.findById(leagueId);

    // Find all admins who have permissions for this league
    const admins = await Admin.find({
      $or: [
        { role: 'admin' }, // Global admins have access to all leagues
        { 'leaguePermissions.league': leagueId }
      ]
    }).select('-password');

    const leagueAdmins = admins.map(admin => {
      const leaguePermission = admin.leaguePermissions?.find(
        lp => lp.league?.toString() === leagueId
      );

      return {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        globalRole: admin.role,
        leagueRole: leaguePermission?.role || (admin.role === 'admin' ? 'admin' : null),
        permissions: leaguePermission?.permissions || (admin.role === 'admin' ? {
          canManageTeams: true,
          canManagePlayers: true,
          canManageMatches: true,
          canManageSchedule: true,
          canViewStats: true,
          canManageLive: true
        } : null),
        isGlobalAdmin: admin.role === 'admin',
        assignedAt: leaguePermission?.assignedAt || null
      };
    });

    return res.status(200).json({
      league: {
        _id: league._id,
        name: league.name,
        season: league.season
      },
      admins: leagueAdmins
    });
  } catch (error) {
    console.error('Error fetching league admins:', error);
    return res.status(500).json({ error: 'Failed to fetch league admins' });
  }
}

// POST - Assign admin to league with specific role
async function assignAdminToLeague(req, res, leagueId) {
  try {
    const { adminId, role, permissions } = req.body;

    console.log('👤 Assigning admin to league:', { adminId, leagueId, role });
    console.log('🔐 Assigned by:', req.user?.username);

    if (!adminId || !role) {
      return res.status(400).json({ 
        error: 'Admin ID and role are required' 
      });
    }

    // Validate role
    if (!['admin', 'moderator', 'scorer', 'viewer'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be: admin, moderator, scorer, or viewer' 
      });
    }

    // Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Default permissions based on role
    const defaultPermissions = {
      admin: {
        canManageTeams: true,
        canManagePlayers: true,
        canManageMatches: true,
        canManageSchedule: true,
        canViewStats: true,
        canManageLive: true
      },
      moderator: {
        canManageTeams: true,
        canManagePlayers: true,
        canManageMatches: true,
        canManageSchedule: false,
        canViewStats: true,
        canManageLive: true
      },
      scorer: {
        canManageTeams: false,
        canManagePlayers: false,
        canManageMatches: false,
        canManageSchedule: false,
        canViewStats: true,
        canManageLive: true
      },
      viewer: {
        canManageTeams: false,
        canManagePlayers: false,
        canManageMatches: false,
        canManageSchedule: false,
        canViewStats: true,
        canManageLive: false
      }
    };

    const finalPermissions = { ...defaultPermissions[role], ...permissions };

    // Initialize leaguePermissions array if it doesn't exist
    if (!admin.leaguePermissions) {
      admin.leaguePermissions = [];
    }

    // Remove existing permission for this league
    admin.leaguePermissions = admin.leaguePermissions.filter(
      lp => lp.league?.toString() !== leagueId
    );

    // Add new permission
    admin.leaguePermissions.push({
      league: leagueId,
      role: role,
      permissions: finalPermissions,
      assignedBy: req.user?.adminId,
      assignedAt: new Date()
    });

    // Update managed leagues
    if (!admin.managedLeagues) {
      admin.managedLeagues = [];
    }
    if (!admin.managedLeagues.includes(leagueId)) {
      admin.managedLeagues.push(leagueId);
    }

    await admin.save();

    console.log('✅ Admin assigned to league successfully');
    return res.status(200).json({
      message: `Admin "${admin.username}" assigned to league with role "${role}"`,
      assignment: {
        admin: admin.username,
        league: leagueId,
        role: role,
        permissions: finalPermissions
      }
    });
  } catch (error) {
    console.error('❌ Error assigning admin to league:', error);
    return res.status(500).json({ 
      error: 'Failed to assign admin to league',
      details: error.message 
    });
  }
}

// DELETE - Remove admin from league
async function removeAdminFromLeague(req, res, leagueId) {
  try {
    const { adminId } = req.query;

    console.log('🗑️ Removing admin from league:', { adminId, leagueId });
    console.log('🔐 Removed by:', req.user?.username);

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Remove league permission
    if (admin.leaguePermissions) {
      admin.leaguePermissions = admin.leaguePermissions.filter(
        lp => lp.league?.toString() !== leagueId
      );
    }

    // Remove from managed leagues
    if (admin.managedLeagues) {
      admin.managedLeagues = admin.managedLeagues.filter(
        id => id.toString() !== leagueId
      );
    }

    await admin.save();

    console.log('✅ Admin removed from league successfully');
    return res.status(200).json({
      message: `Admin "${admin.username}" removed from league`
    });
  } catch (error) {
    console.error('❌ Error removing admin from league:', error);
    return res.status(500).json({ 
      error: 'Failed to remove admin from league',
      details: error.message 
    });
  }
}