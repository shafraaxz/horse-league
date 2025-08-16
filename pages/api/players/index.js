// pages/api/players/index.js - QUICK FIX with simple auth
import connectDB from '../../../lib/mongodb';
import { Player, Team, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        return await getPlayers(req, res); // Public access
      case 'POST':
        return await authMiddleware(createPlayer)(req, res); // Simple auth
      case 'PUT':
        return await authMiddleware(updatePlayer)(req, res); // Simple auth
      case 'DELETE':
        return await authMiddleware(deletePlayer)(req, res); // Simple auth
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Players API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET players - Public access with league/team filtering
async function getPlayers(req, res) {
  try {
    const { leagueId, league, teamId, team, position } = req.query;
    
    let query = {};
    
    // Support both 'leagueId' and 'league' query parameters
    const leagueFilter = leagueId || league;
    if (leagueFilter) {
      query.league = leagueFilter;
      console.log('🔍 Filtering players by league:', leagueFilter);
    }
    
    // Support both 'teamId' and 'team' query parameters
    const teamFilter = teamId || team;
    if (teamFilter) {
      query.team = teamFilter;
      console.log('🔍 Filtering players by team:', teamFilter);
    }
    
    if (position) {
      query.position = position;
    }

    const players = await Player.find(query)
      .populate('team', 'name logo league')
      .populate('league', 'name season')
      .sort({ team: 1, number: 1 });

    console.log(`📋 Retrieved ${players.length} players${leagueFilter ? ` for league ${leagueFilter}` : ''}${teamFilter ? ` for team ${teamFilter}` : ''}`);
    return res.status(200).json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
}

// CREATE player - Simple auth
async function createPlayer(req, res) {
  try {
    const { 
      name, 
      number, 
      position, 
      team: teamId, 
      league: leagueId,
      photo,
      dateOfBirth,
      nationality,
      height,
      weight,
      preferredFoot,
      bio
    } = req.body;

    console.log('🏗️ Creating player:', name, 'for team:', teamId);
    console.log('👤 User creating player:', req.user?.username, 'Role:', req.user?.role);

    if (!name || !number || !position || !teamId || !leagueId) {
      return res.status(400).json({ 
        error: 'Name, number, position, team, and league are required' 
      });
    }

    // Verify team exists and belongs to the league
    const team = await Team.findOne({ _id: teamId, league: leagueId });
    if (!team) {
      return res.status(400).json({ error: 'Team not found or does not belong to this league' });
    }

    // Check if jersey number is already taken in this team
    const existingPlayer = await Player.findOne({ team: teamId, number: parseInt(number) });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Jersey number already taken in this team' });
    }

    const newPlayer = new Player({
      name: name.trim(),
      number: parseInt(number),
      position,
      team: teamId,
      league: leagueId,
      photo: photo || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || '',
      height: height ? parseInt(height) : null,
      weight: weight ? parseInt(weight) : null,
      preferredFoot: preferredFoot || '',
      bio: bio || '',
      stats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
        saves: 0,
        cleanSheets: 0
      },
      status: 'active',
      isActive: true
    });

    const savedPlayer = await newPlayer.save();

    // Update team player count
    await Team.findByIdAndUpdate(teamId, {
      $inc: { playersCount: 1 }
    });

    const populatedPlayer = await Player.findById(savedPlayer._id)
      .populate('team', 'name logo')
      .populate('league', 'name season');

    console.log('✅ Player created successfully:', savedPlayer._id);
    return res.status(201).json({
      message: 'Player created successfully',
      player: populatedPlayer
    });
  } catch (error) {
    console.error('❌ Error creating player:', error);
    return res.status(500).json({ 
      error: 'Failed to create player',
      details: error.message 
    });
  }
}

// UPDATE player - Simple auth
async function updatePlayer(req, res) {
  try {
    const { 
      id, 
      name, 
      number, 
      position, 
      team: teamId,
      photo,
      dateOfBirth,
      nationality,
      height,
      weight,
      preferredFoot,
      bio,
      stats,
      status
    } = req.body;

    console.log('🔄 Updating player:', id);
    console.log('👤 User updating player:', req.user?.username, 'Role:', req.user?.role);

    if (!id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const existingPlayer = await Player.findById(id);
    if (!existingPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check jersey number conflicts if number or team is being changed
    if ((number && number !== existingPlayer.number) || (teamId && teamId !== existingPlayer.team.toString())) {
      const conflictTeam = teamId || existingPlayer.team;
      const conflictNumber = number || existingPlayer.number;
      
      const numberConflict = await Player.findOne({
        team: conflictTeam,
        number: parseInt(conflictNumber),
        _id: { $ne: id }
      });
      
      if (numberConflict) {
        return res.status(400).json({ error: 'Jersey number already taken in this team' });
      }
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (number) updateData.number = parseInt(number);
    if (position) updateData.position = position;
    if (teamId) updateData.team = teamId;
    if (photo !== undefined) updateData.photo = photo;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (nationality !== undefined) updateData.nationality = nationality;
    if (height) updateData.height = parseInt(height);
    if (weight) updateData.weight = parseInt(weight);
    if (preferredFoot !== undefined) updateData.preferredFoot = preferredFoot;
    if (bio !== undefined) updateData.bio = bio;
    if (status) updateData.status = status;
    
    if (stats) {
      updateData.stats = { ...existingPlayer.stats, ...stats };
    }

    const updatedPlayer = await Player.findByIdAndUpdate(id, updateData, { new: true })
      .populate('team', 'name logo')
      .populate('league', 'name season');

    console.log('✅ Player updated successfully:', id);
    return res.status(200).json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });
  } catch (error) {
    console.error('❌ Error updating player:', error);
    return res.status(500).json({ 
      error: 'Failed to update player',
      details: error.message 
    });
  }
}

// DELETE player - Simple auth
async function deletePlayer(req, res) {
  try {
    const { id } = req.query;

    console.log('🗑️ Deleting player:', id);
    console.log('👤 User deleting player:', req.user?.username, 'Role:', req.user?.role);

    if (!id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await Player.findByIdAndDelete(id);

    // Update team player count
    await Team.findByIdAndUpdate(player.team, {
      $inc: { playersCount: -1 }
    });

    console.log('✅ Player deleted successfully:', player.name);
    return res.status(200).json({ 
      message: `Player "${player.name}" deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting player:', error);
    return res.status(500).json({ 
      error: 'Failed to delete player',
      details: error.message 
    });
  }
}