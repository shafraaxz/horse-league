// pages/api/teams/index.js - FIXED to properly handle team updates
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Team, League, Player } from '../../../lib/models';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for teams');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    console.log(`🎯 Teams API: ${req.method} request`);
    console.log('📝 Query:', req.query);
    console.log('📝 Body keys:', req.body ? Object.keys(req.body) : 'none');
    
    await connectDB();

    switch (req.method) {
      case 'GET':
        return getTeams(req, res);
      case 'POST':
      case 'PUT':
      case 'DELETE':
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('✅ Authenticated user:', decoded.username);

        if (req.method === 'POST') {
          return createTeam(req, res, decoded);
        } else if (req.method === 'PUT') {
          return updateTeam(req, res);
        } else if (req.method === 'DELETE') {
          return deleteTeam(req, res);
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('💥 Teams API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function getTeams(req, res) {
  try {
    const { leagueId } = req.query;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    console.log('🔍 Fetching teams for league:', leagueId);

    const teams = await Team.find({ league: leagueId })
      .populate({
        path: 'league',
        select: 'name'
      })
      .sort({ name: 1 });

    // Get player counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const playersCount = await Player.countDocuments({ team: team._id });
        return {
          ...team.toObject(),
          playersCount
        };
      })
    );

    console.log(`📊 Found ${teamsWithCounts.length} teams`);
    res.status(200).json(teamsWithCounts);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

async function createTeam(req, res, decoded) {
  try {
    console.log('🆕 Creating new team');
    console.log('📝 Request body:', req.body);
    
    const { 
      name, 
      logo, 
      leagueId, 
      stadium, 
      coach, 
      founded,
      description,
      colors,
      website,
      email,
      phone,
      captain,
      homeVenue,
      awayVenue
    } = req.body;

    if (!name || !leagueId) {
      return res.status(400).json({ error: 'Team name and league are required' });
    }

    // Check if team name already exists in the league
    const existingTeam = await Team.findOne({ name, league: leagueId });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists in this league' });
    }

    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    console.log('✅ Creating team:', name, 'in league:', league.name);

    const teamData = {
      name,
      logo: logo || '',
      league: leagueId,
      stadium: stadium || '',
      coach: coach || '',
      founded: founded ? parseInt(founded) : undefined,
      description: description || '',
      colors: colors || '',
      website: website || '',
      email: email || '',
      phone: phone || '',
      captain: captain || '',
      homeVenue: homeVenue || stadium || '',
      awayVenue: awayVenue || '',
      playersCount: 0
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    // Update league teams count
    await League.findByIdAndUpdate(leagueId, {
      $inc: { teamsCount: 1 }
    });

    const populatedTeam = await Team.findById(savedTeam._id)
      .populate('league', 'name');

    console.log('✅ Team created successfully:', populatedTeam._id);

    res.status(201).json({
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
}

async function updateTeam(req, res) {
  try {
    console.log('✏️ Updating existing team');
    console.log('📝 Request body:', req.body);
    
    const { 
      id,           // ✅ CRITICAL: Team ID for update
      name, 
      logo, 
      stadium, 
      coach, 
      founded,
      description,
      colors,
      website,
      email,
      phone,
      captain,
      homeVenue,
      awayVenue
    } = req.body;

    if (!id) {
      console.log('❌ Missing team ID for update');
      return res.status(400).json({ error: 'Team ID is required for update' });
    }

    console.log('🔍 Finding team with ID:', id);

    // Find existing team
    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      console.log('❌ Team not found:', id);
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('✅ Found existing team:', existingTeam.name);

    // ✅ Prepare update data (only include provided fields)
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (stadium !== undefined) updateData.stadium = stadium;
    if (coach !== undefined) updateData.coach = coach;
    if (founded !== undefined) updateData.founded = founded ? parseInt(founded) : null;
    if (description !== undefined) updateData.description = description;
    if (colors !== undefined) updateData.colors = colors;
    if (website !== undefined) updateData.website = website;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (captain !== undefined) updateData.captain = captain;
    if (homeVenue !== undefined) updateData.homeVenue = homeVenue;
    if (awayVenue !== undefined) updateData.awayVenue = awayVenue;

    console.log('📝 Update data:', updateData);

    // ✅ Check for name conflicts (if name is being updated)
    if (name && name !== existingTeam.name) {
      const nameConflict = await Team.findOne({ 
        name, 
        league: existingTeam.league, 
        _id: { $ne: id } 
      });
      
      if (nameConflict) {
        return res.status(400).json({ 
          error: 'Team name already exists in this league' 
        });
      }
    }

    // ✅ Perform the update
    const updatedTeam = await Team.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('league', 'name');

    if (!updatedTeam) {
      return res.status(404).json({ error: 'Failed to update team' });
    }

    console.log('✅ Team updated successfully:', updatedTeam.name);

    res.status(200).json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
}

async function deleteTeam(req, res) {
  try {
    console.log('🗑️ Deleting team');
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    console.log('🔍 Finding team to delete:', id);

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('✅ Found team to delete:', team.name);

    // Delete all players in the team first
    const playersDeleted = await Player.deleteMany({ team: id });
    console.log(`🗑️ Deleted ${playersDeleted.deletedCount} players`);
    
    // Delete the team
    await Team.findByIdAndDelete(id);
    console.log('✅ Team deleted');

    // Update league teams count
    await League.findByIdAndUpdate(team.league, {
      $inc: { teamsCount: -1 }
    });
    console.log('✅ League count updated');

    res.status(200).json({ 
      message: 'Team deleted successfully',
      playersDeleted: playersDeleted.deletedCount
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
}