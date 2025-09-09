// ===========================================
// FILE: pages/api/admin/players.js (COMPLETE FIXED VERSION)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    await dbConnect();

    switch (req.method) {
      case 'GET':
        return await getPlayers(req, res);
      case 'POST':
        return await createPlayer(req, res);
      case 'PUT':
        return await updatePlayer(req, res);
      case 'DELETE':
        return await deletePlayer(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin Players API Error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// GET - Fetch ALL players without artificial limits
async function getPlayers(req, res) {
  try {
    const { seasonId, teamId, contractStatus, search } = req.query;
    
    let query = {};
    
    // Season filtering that includes free agents
    if (seasonId && seasonId !== 'all') {
      const teams = await Team.find({ season: seasonId }).select('_id');
      const teamIds = teams.map(team => team._id);
      
      if (teamIds.length > 0) {
        query.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null } // Include free agents
        ];
      } else {
        query.currentTeam = null;
      }
    }
    
    // Team filter
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
        if (query.$or) delete query.$or;
      } else {
        query.currentTeam = new mongoose.Types.ObjectId(teamId);
        if (query.$or) delete query.$or;
      }
    }
    
    // Contract status filter
    if (contractStatus && contractStatus !== 'all') {
      query.contractStatus = contractStatus;
      if (query.$or) delete query.$or;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { idCardNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Remove limit to get ALL players
    const players = await Player.find(query)
      .populate('currentTeam', 'name logo')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive')
      .sort({ name: 1 })
      .lean();

    // Process players with enhanced stats preservation verification
    const processedPlayers = players.map(player => ({
      _id: player._id,
      name: player.name,
      idCardNumber: player.idCardNumber,
      email: player.email,
      phone: player.phone,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      height: player.height,
      weight: player.weight,
      photo: player.photo,
      currentTeam: player.currentTeam,
      status: player.status,
      notes: player.notes,
      emergencyContact: player.emergencyContact,
      medicalInfo: player.medicalInfo,
      
      // Contract information
      contractStatus: player.contractStatus || 'free_agent',
      currentContract: player.currentContract || null,
      
      // Always preserve careerStats
      careerStats: player.careerStats || {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      },
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    }));

    console.log(`Admin fetched ${processedPlayers.length} players (NO LIMIT APPLIED)`);
    
    return res.status(200).json(processedPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
}

// PUT - Update player with career stats preservation
async function updatePlayer(req, res) {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid player ID is required' });
    }

    const existingPlayer = await Player.findById(id);
    if (!existingPlayer) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // CRITICAL: Preserve existing career statistics before any changes
    const preservedCareerStats = existingPlayer.careerStats || {
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0
    };

    console.log(`Preserving career stats for ${existingPlayer.name}:`, preservedCareerStats);

    // Track team changes for transfer record
    const oldTeamId = existingPlayer.currentTeam?.toString();
    const oldContractTeamId = existingPlayer.currentContract?.team?.toString();

    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Prepare update data - NEVER modify careerStats during transfers
    const updateData = {
      name: name.trim(),
      updatedAt: new Date(),
      // CRITICAL: Always preserve career statistics
      careerStats: preservedCareerStats
    };

    // Add optional fields only if provided (EXCLUDING careerStats modifications)
    Object.keys(req.body).forEach(key => {
      if (key !== 'id' && key !== 'name' && key !== 'careerStats' && req.body[key] !== undefined && req.body[key] !== '') {
        if (key === 'currentTeam' && mongoose.Types.ObjectId.isValid(req.body[key])) {
          updateData[key] = new mongoose.Types.ObjectId(req.body[key]);
        } else if (key === 'jerseyNumber') {
          updateData[key] = req.body[key] ? parseInt(req.body[key]) : null;
        } else if (key === 'email') {
          updateData[key] = req.body[key] ? req.body[key].toLowerCase().trim() : null;
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

    // Handle team assignment changes WITHOUT affecting career statistics
    if (updateData.currentTeam) {
      const newTeamId = updateData.currentTeam.toString();
      
      if (oldTeamId !== newTeamId && oldContractTeamId !== newTeamId) {
        console.log(`Team change detected for ${existingPlayer.name} - PRESERVING career stats`);
        
        const activeSeason = await Season.findOne({ isActive: true });
        
        if (activeSeason) {
          // Terminate old contract if exists (preserve stats)
          if (existingPlayer.currentContract && existingPlayer.currentContract.team) {
            if (!updateData.contractHistory) {
              updateData.contractHistory = existingPlayer.contractHistory || [];
            }
            updateData.contractHistory.push({
              ...existingPlayer.currentContract,
              status: 'terminated',
              endDate: new Date()
            });
          }
          
          // Create new contract (preserve stats)
          updateData.currentContract = {
            team: updateData.currentTeam,
            season: activeSeason._id,
            contractType: 'normal',
            startDate: new Date(),
            endDate: null,
            contractValue: 0,
            notes: 'Admin team assignment - career stats preserved'
          };
          
          updateData.contractStatus = 'normal';
        }
      }
    } else if (updateData.currentTeam === null || updateData.currentTeam === '') {
      // Player released to free agency - PRESERVE career stats
      console.log(`Releasing ${existingPlayer.name} to free agency - preserving career stats`);
      updateData.contractStatus = 'free_agent';
      updateData.currentContract = {};
      updateData.currentTeam = null;
      // Career stats explicitly preserved above
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('currentTeam', 'name logo')
     .populate('currentContract.team', 'name logo')
     .populate('currentContract.season', 'name isActive');

    console.log('Player updated with preserved career stats:', updatedPlayer._id);

    // Create transfer record if team changed
    const newTeamId = updatedPlayer.currentTeam?._id?.toString();
    if (oldTeamId !== newTeamId || oldContractTeamId !== newTeamId) {
      console.log('Creating transfer record (stats preservation confirmed)');
      await createTransferRecordWithStatsPreservation(id, oldTeamId || oldContractTeamId, newTeamId, preservedCareerStats);
    }

    return res.status(200).json({
      message: 'Player updated successfully with preserved career statistics',
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating player:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }

    return res.status(500).json({ 
      message: 'Failed to update player', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Enhanced transfer record creation with stats preservation confirmation
async function createTransferRecordWithStatsPreservation(playerId, oldTeamId, newTeamId, preservedStats, transferType = 'transfer') {
  try {
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      console.warn('No active season found - skipping transfer record creation');
      return;
    }

    let notes = `Transfer completed - career statistics preserved: Goals: ${preservedStats.goals}, Assists: ${preservedStats.assists}, Yellow Cards: ${preservedStats.yellowCards}, Red Cards: ${preservedStats.redCards}, Appearances: ${preservedStats.appearances}`;
    
    if (transferType === 'registration') {
      notes = newTeamId ? 
        `Player registered to team - career stats preserved: ${JSON.stringify(preservedStats)}` : 
        `Player registered as free agent - career stats preserved: ${JSON.stringify(preservedStats)}`;
    } else if (!oldTeamId && newTeamId) {
      transferType = 'registration';
      notes = `Joined team from free agency - career stats preserved: ${JSON.stringify(preservedStats)}`;
    } else if (oldTeamId && !newTeamId) {
      transferType = 'release';
      notes = `Released to free agency - career stats preserved: ${JSON.stringify(preservedStats)}`;
    } else if (oldTeamId && newTeamId) {
      transferType = 'transfer';
      notes = `Transfer between teams - career stats preserved: ${JSON.stringify(preservedStats)}`;
    }

    const transferData = {
      player: playerId,
      fromTeam: oldTeamId || null,
      toTeam: newTeamId || null,
      season: activeSeason._id,
      transferDate: new Date(),
      transferType: transferType,
      notes: notes,
      // Metadata to confirm stats preservation
      preservedStatsSnapshot: preservedStats
    };

    const transfer = new Transfer(transferData);
    await transfer.save();
    
    console.log('Transfer record created with stats preservation confirmed:', transfer._id);
  } catch (transferError) {
    console.error('Transfer creation failed (non-fatal):', transferError);
  }
}

// Create player function with career stats initialization
async function createPlayer(req, res) {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Initialize player data with empty career stats
    const playerData = {
      name: name.trim(),
      careerStats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      },
      contractStatus: 'free_agent',
      status: 'active'
    };

    // Add optional fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'name' && key !== 'careerStats' && req.body[key] !== undefined && req.body[key] !== '') {
        if (key === 'currentTeam' && mongoose.Types.ObjectId.isValid(req.body[key])) {
          playerData[key] = new mongoose.Types.ObjectId(req.body[key]);
        } else if (key === 'jerseyNumber') {
          playerData[key] = req.body[key] ? parseInt(req.body[key]) : null;
        } else if (key === 'email') {
          playerData[key] = req.body[key] ? req.body[key].toLowerCase().trim() : null;
        } else {
          playerData[key] = req.body[key];
        }
      }
    });

    const player = new Player(playerData);
    await player.save();

    const populatedPlayer = await Player.findById(player._id)
      .populate('currentTeam', 'name logo')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive');

    console.log('Player created with initialized career stats:', player._id);

    return res.status(201).json({
      message: 'Player created successfully',
      player: populatedPlayer
    });

  } catch (error) {
    console.error('Error creating player:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }

    return res.status(500).json({ 
      message: 'Failed to create player', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Delete player function
async function deletePlayer(req, res) {
  try {
    const { id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid player ID is required' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    await Player.findByIdAndDelete(id);

    console.log('Player deleted:', player.name);

    return res.status(200).json({
      message: 'Player deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting player:', error);
    return res.status(500).json({ 
      message: 'Failed to delete player', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
