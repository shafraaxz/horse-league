// pages/api/admin/seasons.js - Season Management API
import dbConnect from '../../../lib/mongodb';
import Season from '../../../models/Season';
import League from '../../../models/League';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  console.log(`Admin Seasons API: ${method}`);
  
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
      const league = await League.findOne({ 
        $or: [
          { isDefault: true }, 
          { slug: 'the-horse-futsal-league' }
        ],
        isActive: true 
      });
      
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
          message: 'Missing required fields: name, startDate, endDate, registrationDeadline'
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
      const league = await League.findOne({ 
        $or: [
          { isDefault: true }, 
          { slug: 'the-horse-futsal-league' }
        ],
        isActive: true 
      });
      
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
        displayName: displayName || `${name.split('/')[0]}-20${name.split('/')[1]} Season`,
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
        createdBy: user.id,
        teams: []
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
      if (!['draft', 'upcoming'].includes(season.status)) {
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