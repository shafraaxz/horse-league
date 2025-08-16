// pages/api/teams/index.js - SAFE VERSION without captain population
import connectDB from '../../../lib/mongodb';
import { Team, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        return await getTeams(req, res); // Public access
      case 'POST':
        return await authMiddleware(createTeam)(req, res); // Simple auth
      case 'PUT':
        return await authMiddleware(updateTeam)(req, res); // Simple auth
      case 'DELETE':
        return await authMiddleware(deleteTeam)(req, res); // Simple auth
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Teams API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET teams - SAFE VERSION without captain populate
async function getTeams(req, res) {
  try {
    const { leagueId, league } = req.query;
    
    const leagueFilter = leagueId || league;
    
    let query = {};
    if (leagueFilter) {
      query.league = leagueFilter;
      console.log('🔍 Filtering teams by league:', leagueFilter);
    }

    // ✅ SAFE: Only populate league, not captain (until schema is fixed)
    const teams = await Team.find(query)
      .populate('league', 'name season')
      .sort({ name: 1 });

    console.log(`📋 Retrieved ${teams.length} teams${leagueFilter ? ` for league ${leagueFilter}` : ''}`);
    return res.status(200).json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

// CREATE team
async function createTeam(req, res) {
  try {
    const { 
      name, 
      leagueId, 
      logo, 
      coach, 
      stadium, 
      founded, 
      description, 
      colors,
      website,
      email,
      phone
    } = req.body;

    console.log('🏗️ Creating team:', name, 'for league:', leagueId);
    console.log('👤 User creating team:', req.user?.username, 'Role:', req.user?.role);

    if (!name || !leagueId) {
      return res.status(400).json({ error: 'Team name and league ID are required' });
    }

    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(400).json({ error: 'League not found' });
    }

    // Check if team name already exists in this league
    const existingTeam = await Team.findOne({ name, league: leagueId });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists in this league' });
    }

    const newTeam = new Team({
      name: name.trim(),
      league: leagueId,
      logo: logo || '',
      coach: coach || '',
      stadium: stadium || '',
      founded: founded || '',
      description: description || '',
      colors: {
        primary: colors?.primary || '',
        secondary: colors?.secondary || ''
      },
      website: website || '',
      email: email || '',
      phone: phone || '',
      captain: null, // Will be set later when players are added
      playersCount: 0
    });

    const savedTeam = await newTeam.save();

    // Update league teams count
    await League.findByIdAndUpdate(leagueId, {
      $inc: { teamsCount: 1 }
    });

    // ✅ SAFE: Only populate league
    const populatedTeam = await Team.findById(savedTeam._id)
      .populate('league', 'name season');

    console.log('✅ Team created successfully:', savedTeam._id);
    return res.status(201).json({
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('❌ Error creating team:', error);
    return res.status(500).json({ 
      error: 'Failed to create team',
      details: error.message 
    });
  }
}

// UPDATE team
async function updateTeam(req, res) {
  try {
    const { id, name, logo, coach, stadium, founded, description, colors, website, email, phone, captain } = req.body;

    console.log('🔄 Updating team:', id);
    console.log('👤 User updating team:', req.user?.username, 'Role:', req.user?.role);

    if (!id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check for name conflicts in the same league
    if (name && name !== existingTeam.name) {
      const nameConflict = await Team.findOne({ 
        name, 
        league: existingTeam.league, 
        _id: { $ne: id } 
      });
      if (nameConflict) {
        return res.status(400).json({ error: 'Team name already exists in this league' });
      }
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (logo !== undefined) updateData.logo = logo;
    if (coach !== undefined) updateData.coach = coach;
    if (stadium !== undefined) updateData.stadium = stadium;
    if (founded !== undefined) updateData.founded = founded;
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (captain !== undefined) updateData.captain = captain;
    
    if (colors) {
      if (colors.primary !== undefined) updateData['colors.primary'] = colors.primary;
      if (colors.secondary !== undefined) updateData['colors.secondary'] = colors.secondary;
    }

    const updatedTeam = await Team.findByIdAndUpdate(id, updateData, { new: true })
      .populate('league', 'name season');

    console.log('✅ Team updated successfully:', id);
    return res.status(200).json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('❌ Error updating team:', error);
    return res.status(500).json({ 
      error: 'Failed to update team',
      details: error.message 
    });
  }
}

// DELETE team
async function deleteTeam(req, res) {
  try {
    const { id } = req.query;

    console.log('🗑️ Deleting team:', id);
    console.log('👤 User deleting team:', req.user?.username, 'Role:', req.user?.role);

    if (!id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Delete all players in this team first
    const { Player } = require('../../../lib/models');
    const deletedPlayers = await Player.deleteMany({ team: id });

    // Delete the team
    await Team.findByIdAndDelete(id);

    // Update league teams count
    await League.findByIdAndUpdate(team.league, {
      $inc: { teamsCount: -1 }
    });

    console.log(`✅ Team deleted: ${team.name}, ${deletedPlayers.deletedCount} players removed`);
    return res.status(200).json({ 
      message: `Team "${team.name}" and ${deletedPlayers.deletedCount} players deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting team:', error);
    return res.status(500).json({ 
      error: 'Failed to delete team',
      details: error.message 
    });
  }
}