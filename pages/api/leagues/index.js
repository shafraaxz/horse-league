// pages/api/leagues/index.js - Complete Leagues API with role-based permissions
import connectDB from '../../../lib/mongodb';
import { League, Team, Player, Match } from '../../../lib/models';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        return await getLeagues(req, res); // Public access
      case 'POST':
        return await requireAdmin(createLeague)(req, res); // Requires admin
      case 'PUT':
        return await requireAdmin(updateLeague)(req, res); // Requires admin
      case 'DELETE':
        return await requireAdmin(deleteLeague)(req, res); // Requires admin (very destructive)
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leagues API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET leagues - Public access
async function getLeagues(req, res) {
  try {
    console.log('Fetching leagues from database...');
    const leagues = await League.find().sort({ createdAt: -1 });
    console.log('Found leagues:', leagues.length);
    return res.status(200).json(leagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return res.status(500).json({ error: 'Failed to fetch leagues' });
  }
}

// CREATE league - Requires admin role
async function createLeague(req, res) {
  try {
    const { name, logo, description, season, startDate, endDate } = req.body;
    
    console.log('Creating league:', name);
    console.log('👤 User creating league:', req.user.username, 'Role:', req.user.role);
    
    if (!name) {
      return res.status(400).json({ error: 'League name is required' });
    }

    // Check if league name already exists
    const existingLeague = await League.findOne({ name });
    if (existingLeague) {
      return res.status(400).json({ error: 'League name already exists' });
    }

    const newLeague = new League({
      name,
      logo: logo || '',
      description: description || '',
      season: season || new Date().getFullYear().toString(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user.adminId,
      teamsCount: 0,
      matchesCount: 0,
      status: 'active'
    });

    const savedLeague = await newLeague.save();
    console.log('League created:', savedLeague._id);
    
    return res.status(201).json({
      message: 'League created successfully',
      league: savedLeague
    });
  } catch (error) {
    console.error('Error creating league:', error);
    return res.status(500).json({ 
      error: 'Failed to create league',
      details: error.message 
    });
  }
}

// UPDATE league - Requires admin role
async function updateLeague(req, res) {
  try {
    const { id, name, logo, description, season, startDate, endDate, status } = req.body;
    
    console.log('Updating league:', id);
    console.log('👤 User updating league:', req.user.username, 'Role:', req.user.role);

    if (!id) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'League name is required' });
    }

    // Check if league exists
    const existingLeague = await League.findById(id);
    if (!existingLeague) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Check if name is taken by another league
    if (name !== existingLeague.name) {
      const nameConflict = await League.findOne({ name, _id: { $ne: id } });
      if (nameConflict) {
        return res.status(400).json({ error: 'League name already exists' });
      }
    }

    const updateData = {
      name,
      logo: logo || '',
      description: description || '',
      season: season || existingLeague.season,
      startDate: startDate ? new Date(startDate) : existingLeague.startDate,
      endDate: endDate ? new Date(endDate) : existingLeague.endDate,
      status: status || existingLeague.status,
      updatedAt: new Date()
    };

    const updatedLeague = await League.findByIdAndUpdate(id, updateData, { new: true });
    console.log('League updated:', updatedLeague._id);

    return res.status(200).json({
      message: 'League updated successfully',
      league: updatedLeague
    });
  } catch (error) {
    console.error('Error updating league:', error);
    return res.status(500).json({ 
      error: 'Failed to update league',
      details: error.message 
    });
  }
}

// DELETE league - Requires admin role (cascade delete)
async function deleteLeague(req, res) {
  try {
    const { id } = req.query;
    
    console.log('🗑️ Starting cascade delete for league:', id);
    console.log('👤 User deleting league:', req.user.username, 'Role:', req.user.role);

    if (!id) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    // Check if league exists
    const league = await League.findById(id);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    console.log(`📊 Found league: ${league.name}`);

    // Start cascade deletion process
    const deletionResults = {
      league: league.name,
      matches: 0,
      players: 0,
      teams: 0
    };

    // Step 1: Delete all matches in this league
    console.log('🗑️ Deleting matches...');
    const matchDeleteResult = await Match.deleteMany({ league: id });
    deletionResults.matches = matchDeleteResult.deletedCount;
    console.log(`✅ Deleted ${deletionResults.matches} matches`);

    // Step 2: Delete all players in this league
    console.log('🗑️ Deleting players...');
    const playerDeleteResult = await Player.deleteMany({ league: id });
    deletionResults.players = playerDeleteResult.deletedCount;
    console.log(`✅ Deleted ${deletionResults.players} players`);

    // Step 3: Delete all teams in this league
    console.log('🗑️ Deleting teams...');
    const teamDeleteResult = await Team.deleteMany({ league: id });
    deletionResults.teams = teamDeleteResult.deletedCount;
    console.log(`✅ Deleted ${deletionResults.teams} teams`);

    // Step 4: Finally delete the league itself
    console.log('🗑️ Deleting league...');
    await League.findByIdAndDelete(id);
    console.log('✅ League deleted successfully');

    console.log('🎉 Cascade deletion completed:', deletionResults);

    return res.status(200).json({
      message: `League "${league.name}" and all associated data deleted successfully`,
      deletedData: deletionResults,
      summary: `Removed ${deletionResults.teams} teams, ${deletionResults.players} players, and ${deletionResults.matches} matches`
    });

  } catch (error) {
    console.error('💥 Error during league deletion:', error);
    return res.status(500).json({ 
      error: 'Failed to delete league',
      details: error.message 
    });
  }
}