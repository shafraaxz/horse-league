// pages/api/admin/assign-league.js - Quick assignment for testing
import connectDB from '../../../lib/mongodb';
import { Admin, League } from '../../../lib/models';

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { username, leagueName, role = 'moderator' } = req.body;

      console.log('🔧 Quick assignment:', { username, leagueName, role });

      if (!username || !leagueName) {
        return res.status(400).json({ 
          error: 'Username and league name are required',
          example: {
            username: "mod1",
            leagueName: "League 1", 
            role: "moderator"
          }
        });
      }

      // Find admin by username
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(404).json({ error: `Admin "${username}" not found` });
      }

      // Find league by name
      const league = await League.findOne({ name: leagueName });
      if (!league) {
        return res.status(404).json({ error: `League "${leagueName}" not found` });
      }

      // Default permissions based on role
      const permissions = {
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
        }
      };

      // Initialize arrays if they don't exist
      if (!admin.leaguePermissions) {
        admin.leaguePermissions = [];
      }
      if (!admin.managedLeagues) {
        admin.managedLeagues = [];
      }

      // Remove existing permission for this league
      admin.leaguePermissions = admin.leaguePermissions.filter(
        lp => lp.league?.toString() !== league._id.toString()
      );

      // Add new permission
      admin.leaguePermissions.push({
        league: league._id,
        role: role,
        permissions: permissions[role],
        assignedAt: new Date()
      });

      // Add to managed leagues if not already there
      if (!admin.managedLeagues.some(id => id.toString() === league._id.toString())) {
        admin.managedLeagues.push(league._id);
      }

      await admin.save();

      return res.status(200).json({
        success: true,
        message: `✅ Admin "${username}" assigned to "${leagueName}" as ${role}`,
        assignment: {
          admin: admin.username,
          league: league.name,
          role: role,
          permissions: permissions[role]
        }
      });
    }

    // GET - Show current assignments
    if (req.method === 'GET') {
      const admins = await Admin.find()
        .populate('leaguePermissions.league', 'name season')
        .select('-password');

      const assignments = [];
      
      admins.forEach(admin => {
        if (admin.leaguePermissions && admin.leaguePermissions.length > 0) {
          admin.leaguePermissions.forEach(lp => {
            assignments.push({
              admin: admin.username,
              league: lp.league?.name || 'Unknown League',
              role: lp.role,
              assignedAt: lp.assignedAt
            });
          });
        }
      });

      return res.status(200).json({
        assignments,
        totalAssignments: assignments.length,
        instructions: {
          assign: 'POST with {"username": "mod1", "leagueName": "League 1", "role": "moderator"}'
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Quick assignment error:', error);
    return res.status(500).json({ 
      error: 'Assignment failed',
      details: error.message 
    });
  }
}