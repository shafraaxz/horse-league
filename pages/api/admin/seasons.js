// pages/api/admin/seasons.js - Season Management API
import dbConnect from '../../../lib/mongodb';
import Season from '../../../models/Season';
import League from '../../../models/League';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  console.log(`📅 Admin Seasons API: ${method}`);
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify admin authentication
  let user;
  try {
    user = await verifyAuth(req);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (method === 'GET') {
    try {
      // Get the main league
      const league = await League.findOne({ isDefault: true, isActive: true });
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found'
        });
      }

      const seasons = await Season.find({ league: league._id })
        .populate('teams.team', 'name shortName logo')
        .sort({ startDate: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: seasons
      });
    } catch (error) {
      console.error('Error fetching seasons:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch seasons'
      });
    }
  }

  if (method === 'POST') {
    try {
      const {
        name,
        displayName,
        startDate,
        endDate,
        registrationDeadline,
        transferWindowStart,
        transferWindowEnd,
        maxTeams,
        maxPlayersPerTeam,
        minPlayersPerTeam,
        format,
        status
      } = req.body;

      // Validate required fields
      if (!name || !startDate || !endDate || !registrationDeadline) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate season name format
      if (!/^\d{4}\/\d{2}$/.test(name)) {
        return res.status(400).json({
          success: false,
          message: 'Season name must be in format YYYY/YY (e.g., 2025/26)'
        });
      }

      // Get the main league
      const league = await League.findOne({ isDefault: true, isActive: true });
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found'
        });
      }

      // Check if season already exists
      const existingSeason = await Season.findOne({ 
        name: name, 
        league: league._id 
      });
      
      if (existingSeason) {
        return res.status(400).json({
          success: false,
          message: 'Season with this name already exists'
        });
      }

      const season = new Season({
        name,
        displayName,
        league: league._id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        transferWindowStart: transferWindowStart ? new Date(transferWindowStart) : new Date(startDate),
        transferWindowEnd: transferWindowEnd ? new Date(transferWindowEnd) : new Date(endDate),
        maxTeams: maxTeams || league.maxTeams || 16,
        maxPlayersPerTeam: maxPlayersPerTeam || league.maxPlayersPerTeam || 20,
        minPlayersPerTeam: minPlayersPerTeam || league.minPlayersPerTeam || 11,
        format: format || 'double_round_robin',
        status: status || 'draft',
        pointsForWin: league.pointsForWin || 3,
        pointsForDraw: league.pointsForDraw || 1,
        pointsForLoss: league.pointsForLoss || 0,
        createdBy: user.id
      });

      await season.save();

      return res.status(201).json({
        success: true,
        message: 'Season created successfully',
        data: season
      });
    } catch (error) {
      console.error('Error creating season:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create season',
        error: error.message
      });
    }
  }

  if (method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Season ID is required'
        });
      }

      const season = await Season.findById(id);
      if (!season) {
        return res.status(404).json({
          success: false,
          message: 'Season not found'
        });
      }

      // Check if season can be edited
      if (!season.canEdit()) {
        return res.status(400).json({
          success: false,
          message: 'Season cannot be edited in its current status'
        });
      }

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== '_id' && key !== 'league' && key !== 'createdBy') {
          season[key] = updates[key];
        }
      });

      await season.save();

      return res.status(200).json({
        success: true,
        message: 'Season updated successfully',
        data: season
      });
    } catch (error) {
      console.error('Error updating season:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update season',
        error: error.message
      });
    }
  }

  if (method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Season ID is required'
        });
      }

      const season = await Season.findById(id);
      if (!season) {
        return res.status(404).json({
          success: false,
          message: 'Season not found'
        });
      }

      // Check if season can be deleted
      if (season.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete active season'
        });
      }

      // Soft delete - mark as archived
      season.archived = true;
      season.isActive = false;
      await season.save();

      return res.status(200).json({
        success: true,
        message: 'Season archived successfully'
      });
    } catch (error) {
      console.error('Error deleting season:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete season',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${method} not allowed`
  });
}

// pages/api/admin/users.js - User Management API
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  console.log(`👥 Admin Users API: ${method}`);
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify super admin authentication
  let user;
  try {
    user = await verifyAuth(req);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (method === 'GET') {
    try {
      const users = await User.find({ isActive: true })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  if (method === 'POST') {
    try {
      const {
        name,
        email,
        password,
        role,
        permissions
      } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'moderator',
        permissions: permissions || [],
        isActive: true,
        emailVerified: true // Auto-verify admin created users
      });

      await newUser.save();

      // Return user without password
      const userResponse = newUser.toObject();
      delete userResponse.password;

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  if (method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent editing super admin users by other users
      if (targetUser.role === 'super_admin' && targetUser._id.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit other super admin users'
        });
      }

      // Update allowed fields
      const allowedUpdates = ['name', 'email', 'role', 'permissions', 'isActive'];
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key) && updates[key] !== undefined) {
          targetUser[key] = updates[key];
        }
      });

      // Hash new password if provided
      if (updates.password && updates.password.length > 0) {
        targetUser.password = await bcrypt.hash(updates.password, 12);
      }

      await targetUser.save();

      // Return user without password
      const userResponse = targetUser.toObject();
      delete userResponse.password;

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: userResponse
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  if (method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deleting super admin users
      if (targetUser.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete super admin users'
        });
      }

      // Soft delete - deactivate user
      targetUser.isActive = false;
      await targetUser.save();

      return res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${method} not allowed`
  });
}

// pages/api/admin/statistics.js - System Statistics API
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Season from '../../../models/Season';
import League from '../../../models/League';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }
  
  console.log(`📊 Admin Statistics API: ${method}`);
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify admin authentication
  try {
    const user = await verifyAuth(req);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    // Get main league
    const league = await League.findOne({ isDefault: true, isActive: true });
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Get statistics
    const [
      totalTeams,
      totalPlayers,
      totalMatches,
      totalSeasons,
      currentSeason,
      activeTransfers,
      completedMatches,
      totalGoals
    ] = await Promise.all([
      Team.countDocuments({ league: league._id, isActive: true }),
      Player.countDocuments({ league: league._id, isActive: true }),
      Match.countDocuments({ league: league._id }),
      Season.countDocuments({ league: league._id, isActive: true }),
      Season.findOne({ league: league._id, status: 'active' }),
      Player.countDocuments({ 
        league: league._id, 
        marketStatus: 'available',
        registrationStatus: 'registered'
      }),
      Match.countDocuments({ league: league._id, status: 'completed' }),
      Match.aggregate([
        { $match: { league: league._id, status: 'completed' } },
        { $group: { 
            _id: null, 
            totalGoals: { $sum: { $add: ['$homeScore', '$awayScore'] } } 
          }
        }
      ])
    ]);

    const stats = {
      totalTeams,
      totalPlayers,
      totalMatches,
      totalSeasons,
      currentSeason: currentSeason ? currentSeason.name : league.currentSeason,
      activeTransfers,
      completedMatches,
      totalGoals: totalGoals.length > 0 ? totalGoals[0].totalGoals : 0,
      matchProgress: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0
    };

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
}
