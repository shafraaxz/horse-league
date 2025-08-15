import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Player, Team, League } from '../../../lib/models';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Database connection
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for players');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    console.log(`🎯 Players API: ${req.method} request received`);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 Auth header present:', !!req.headers.authorization);
    
    await connectDB();

    switch (req.method) {
      case 'GET':
        return getPlayers(req, res);
      case 'POST':
      case 'PUT':
      case 'DELETE':
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          console.log('❌ No token provided');
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          console.log('❌ Invalid token');
          return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('✅ Authenticated user:', decoded.username);

        if (req.method === 'POST') {
          return createPlayer(req, res);
        } else if (req.method === 'PUT') {
          return updatePlayer(req, res);
        } else if (req.method === 'DELETE') {
          return deletePlayer(req, res);
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('💥 Players API error:', error);
    console.error('📍 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

async function getPlayers(req, res) {
  try {
    const { teamId, leagueId, team, league } = req.query;
    
    let filter = {};
    // Support both teamId/leagueId and team/league query params
    if (teamId || team) filter.team = teamId || team;
    if (leagueId || league) filter.league = leagueId || league;

    console.log('📋 Players filter:', filter);

    const players = await Player.find(filter)
      .populate('team', 'name logo')
      .populate('league', 'name')
      .sort({ number: 1 });

    console.log(`📊 Found ${players.length} players`);
    res.status(200).json(players);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
}

async function createPlayer(req, res) {
  try {
    console.log('🏗️ === CREATING PLAYER ===');
    console.log('📥 Raw request body:', req.body);
    
    // Extract data from request body with comprehensive logging
    const {
      name,
      number,
      position,
      photo,
      team,
      league,
      dateOfBirth,
      nationality,
      height,
      weight,
      preferredFoot,
      bio,
      previousClubs
    } = req.body;

    console.log('📋 Extracted fields:');
    console.log('  - name:', name, typeof name);
    console.log('  - number:', number, typeof number);
    console.log('  - position:', position, typeof position);
    console.log('  - team:', team, typeof team);
    console.log('  - league:', league, typeof league);
    console.log('  - photo:', photo ? 'provided' : 'empty');

    // Validate required fields with detailed logging
    const missing = [];
    if (!name || name.trim() === '') missing.push('name');
    if (!number && number !== 0) missing.push('number');
    if (!position || position.trim() === '') missing.push('position');
    if (!team || team.trim() === '') missing.push('team');
    if (!league || league.trim() === '') missing.push('league');

    if (missing.length > 0) {
      console.log('❌ Missing required fields:', missing);
      return res.status(400).json({ 
        error: `Missing required fields: ${missing.join(', ')}`,
        received: { name, number, position, team, league },
        missing
      });
    }

    console.log('✅ All required fields present');

    // Convert number to integer
    const playerNumber = parseInt(number);
    if (isNaN(playerNumber) || playerNumber < 1 || playerNumber > 99) {
      console.log('❌ Invalid player number:', number);
      return res.status(400).json({ 
        error: 'Player number must be between 1 and 99' 
      });
    }

    console.log('✅ Player number is valid:', playerNumber);

    // Check if jersey number is already taken in the team
    console.log('🔍 Checking for duplicate jersey number...');
    const existingPlayer = await Player.findOne({ team, number: playerNumber });
    if (existingPlayer) {
      console.log('❌ Jersey number taken:', playerNumber, 'by player:', existingPlayer.name);
      return res.status(400).json({ 
        error: `Jersey number ${playerNumber} is already taken by ${existingPlayer.name}` 
      });
    }

    console.log('✅ Jersey number is available');

    // Verify team exists and belongs to the league
    console.log('🔍 Verifying team exists in league...');
    const teamDoc = await Team.findOne({ _id: team, league });
    if (!teamDoc) {
      console.log('❌ Team not found in league');
      console.log('  - Team ID:', team);
      console.log('  - League ID:', league);
      
      // Check if team exists at all
      const teamExists = await Team.findById(team);
      if (!teamExists) {
        return res.status(404).json({ error: 'Team not found' });
      } else {
        return res.status(404).json({ 
          error: 'Team does not belong to the specified league',
          teamLeague: teamExists.league,
          requestedLeague: league
        });
      }
    }

    console.log('✅ Team verification passed:', teamDoc.name);

    // Create player object
    const playerData = {
      name: name.trim(),
      number: playerNumber,
      position: position.trim(),
      photo: photo?.trim() || '',
      team,
      league,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      nationality: nationality?.trim() || '',
      height: height ? parseInt(height) : undefined,
      weight: weight ? parseInt(weight) : undefined,
      preferredFoot: preferredFoot?.trim() || '',
      bio: bio?.trim() || '',
      previousClubs: previousClubs?.trim() || '',
      stats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
        saves: 0,
        cleanSheets: 0
      }
    };

    console.log('💾 Creating player with data:', JSON.stringify(playerData, null, 2));

    const player = new Player(playerData);
    const savedPlayer = await player.save();
    
    console.log('✅ Player saved with ID:', savedPlayer._id);

    // Update team players count
    await Team.findByIdAndUpdate(team, {
      $inc: { playersCount: 1 }
    });

    console.log('✅ Team player count updated');

    // Get populated player data
    const populatedPlayer = await Player.findById(savedPlayer._id)
      .populate('team', 'name logo')
      .populate('league', 'name');

    console.log('🎉 Player creation successful:', populatedPlayer.name);

    res.status(201).json({
      message: 'Player created successfully',
      player: populatedPlayer
    });

  } catch (error) {
    console.error('💥 Create player error:', error);
    console.error('📍 Error stack:', error.stack);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Player with this number already exists in the team',
        details: error.message 
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create player',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function updatePlayer(req, res) {
  try {
    const { 
      id, 
      name, 
      number, 
      position, 
      photo,
      dateOfBirth,
      nationality,
      height,
      weight,
      preferredFoot,
      bio,
      previousClubs,
      stats,
      isActive
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // If updating jersey number, check if it's available
    if (number && parseInt(number) !== player.number) {
      const existingPlayer = await Player.findOne({ 
        team: player.team, 
        number: parseInt(number), 
        _id: { $ne: id } 
      });
      if (existingPlayer) {
        return res.status(400).json({ error: 'Jersey number already taken in this team' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (number) updateData.number = parseInt(number);
    if (position) updateData.position = position;
    if (photo !== undefined) updateData.photo = photo;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (height !== undefined) updateData.height = height ? parseInt(height) : null;
    if (weight !== undefined) updateData.weight = weight ? parseInt(weight) : null;
    if (preferredFoot !== undefined) updateData.preferredFoot = preferredFoot;
    if (bio !== undefined) updateData.bio = bio;
    if (previousClubs !== undefined) updateData.previousClubs = previousClubs;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Update stats if provided
    if (stats) {
      updateData.stats = { ...player.stats.toObject(), ...stats };
    }

    const updatedPlayer = await Player.findByIdAndUpdate(id, updateData, { new: true })
      .populate('team', 'name logo')
      .populate('league', 'name');

    res.status(200).json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
}

async function deletePlayer(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await Player.findByIdAndDelete(id);

    // Update team players count
    await Team.findByIdAndUpdate(player.team, {
      $inc: { playersCount: -1 }
    });

    res.status(200).json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
}