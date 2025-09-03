// ===========================================
// FILE: pages/api/admin/players.js (UPDATED - Added Contract Status Filtering)
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

// Helper function to create transfer records automatically
async function createTransferRecord(playerId, oldTeamId, newTeamId, transferType = 'registration') {
  try {
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      console.warn('No active season found - skipping transfer record creation');
      return;
    }

    let notes = '';
    if (transferType === 'registration') {
      if (newTeamId) {
        notes = 'Initial registration - joined team';
      } else {
        notes = 'Initial registration - free agent';
      }
    } else if (!oldTeamId && newTeamId) {
      transferType = 'registration';
      notes = 'Joined team from free agency';
    } else if (oldTeamId && !newTeamId) {
      transferType = 'release';
      notes = 'Released to free agency';
    } else if (oldTeamId && newTeamId) {
      transferType = 'transfer';
      notes = 'Transfer between teams';
    }

    const transferData = {
      player: playerId,
      fromTeam: oldTeamId || null,
      toTeam: newTeamId || null,
      season: activeSeason._id,
      transferDate: new Date(),
      transferType: transferType,
      notes: notes
    };

    const transfer = new Transfer(transferData);
    await transfer.save();
    
    console.log('✅ Transfer record created successfully:', transfer._id);
  } catch (transferError) {
    console.error('❌ Transfer creation failed (non-fatal):', transferError);
  }
}

// GET - Fetch players with filters (UPDATED with contract filtering)
async function getPlayers(req, res) {
  try {
    const { seasonId, teamId, contractStatus, search } = req.query;
    
    let query = {};
    
    // UPDATED: Better season filtering that includes free agents
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
    
    // Add team filter - UPDATED to handle free agents
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
        if (query.$or) delete query.$or;
      } else {
        query.currentTeam = new mongoose.Types.ObjectId(teamId);
        if (query.$or) delete query.$or;
      }
    }
    
    // NEW: Add contract status filter
    if (contractStatus && contractStatus !== 'all') {
      query.contractStatus = contractStatus;
      // Override previous team filtering for contract-specific queries
      if (query.$or) delete query.$or;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { idCardNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const players = await Player.find(query)
      .populate('currentTeam', 'name logo')
      .populate('currentContract.team', 'name logo') // NEW: Populate contract team
      .populate('currentContract.season', 'name isActive') // NEW: Populate contract season
      .sort({ name: 1 })
      .lean();

    // Process players and ensure proper data format
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
      
      // NEW: Contract information
      contractStatus: player.contractStatus || 'free_agent',
      currentContract: player.currentContract || null,
      
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

    console.log(`Admin fetched ${processedPlayers.length} players with contract filter: ${contractStatus || 'none'}`);
    
    return res.status(200).json(processedPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
}

// POST - Create new player with minimal requirements and contract handling
async function createPlayer(req, res) {
  try {
    console.log('Creating player with data:', {
      ...req.body,
      idCardNumber: req.body.idCardNumber ? '***HIDDEN***' : undefined
    });

    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Create minimal player data
    const playerData = {
      name: name.trim(),
      contractStatus: 'free_agent', // NEW: Default contract status
      currentContract: {}, // NEW: Empty contract object
      careerStats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0
      }
    };

    // Add optional fields only if they exist and are valid
    if (req.body.email && req.body.email.trim()) {
      playerData.email = req.body.email.toLowerCase().trim();
    }
    
    if (req.body.phone && req.body.phone.trim()) {
      playerData.phone = req.body.phone.trim();
    }
    
    if (req.body.dateOfBirth) {
      playerData.dateOfBirth = req.body.dateOfBirth;
    }
    
    if (req.body.nationality && req.body.nationality.trim()) {
      playerData.nationality = req.body.nationality.trim();
    }
    
    if (req.body.position) {
      playerData.position = req.body.position;
    }
    
    if (req.body.jerseyNumber && !isNaN(req.body.jerseyNumber)) {
      playerData.jerseyNumber = parseInt(req.body.jerseyNumber);
    }
    
    if (req.body.currentTeam && mongoose.Types.ObjectId.isValid(req.body.currentTeam)) {
      playerData.currentTeam = new mongoose.Types.ObjectId(req.body.currentTeam);
      // NEW: If assigned to team, create basic normal contract
      const activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        playerData.contractStatus = 'normal';
        playerData.currentContract = {
          team: playerData.currentTeam,
          season: activeSeason._id,
          contractType: 'normal',
          startDate: new Date(),
          endDate: null, // Open-ended
          contractValue: 0,
          notes: 'Initial team assignment'
        };
      }
    }
    
    if (req.body.photo) {
      playerData.photo = req.body.photo;
    }
    
    if (req.body.status) {
      playerData.status = req.body.status;
    }
    
    if (req.body.idCardNumber && req.body.idCardNumber.trim()) {
      playerData.idCardNumber = req.body.idCardNumber.trim();
    }

    // NEW: Handle emergency contact
    if (req.body.emergencyContact) {
      playerData.emergencyContact = req.body.emergencyContact;
    }

    console.log('Final player data for creation:', {
      ...playerData,
      idCardNumber: playerData.idCardNumber ? '***HIDDEN***' : undefined
    });

    const newPlayer = new Player(playerData);
    const savedPlayer = await newPlayer.save();

    console.log('✅ Player created successfully:', savedPlayer._id);

    // Auto-create transfer record for new player
    await createTransferRecord(
      savedPlayer._id, 
      null, 
      playerData.currentTeam || null, 
      'registration'
    );

    // Populate the result for response
    const populatedPlayer = await Player.findById(savedPlayer._id)
      .populate('currentTeam', 'name logo')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive')
      .lean();

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
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (error.keyPattern?.idCardNumber) {
        return res.status(400).json({ message: 'Player with this ID card number already exists' });
      }
      if (error.keyPattern?.jerseyNumber) {
        return res.status(400).json({ message: 'Jersey number already taken in this team' });
      }
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }

    throw error;
  }
}

// PUT - Update player (UPDATED with contract awareness)
async function updatePlayer(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Player ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    const existingPlayer = await Player.findById(id);
    if (!existingPlayer) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Track team changes for transfer record
    const oldTeamId = existingPlayer.currentTeam?.toString();
    const oldContractTeamId = existingPlayer.currentContract?.team?.toString();

    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Prepare update data with only changed fields
    const updateData = {
      name: name.trim(),
      updatedAt: new Date()
    };

    // Add optional fields only if provided
    Object.keys(req.body).forEach(key => {
      if (key !== 'id' && key !== 'name' && req.body[key] !== undefined && req.body[key] !== '') {
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

    // NEW: Handle team assignment changes (update contracts)
    if (updateData.currentTeam) {
      const newTeamId = updateData.currentTeam.toString();
      
      // If team changed, we need to handle contract updates
      if (oldTeamId !== newTeamId && oldContractTeamId !== newTeamId) {
        const activeSeason = await Season.findOne({ isActive: true });
        
        if (activeSeason) {
          // Terminate old contract if exists
          if (existingPlayer.currentContract && existingPlayer.currentContract.team) {
            existingPlayer.contractHistory.push({
              ...existingPlayer.currentContract,
              status: 'terminated',
              endDate: new Date()
            });
          }
          
          // Create new contract
          updateData.currentContract = {
            team: updateData.currentTeam,
            season: activeSeason._id,
            contractType: 'normal', // Default to normal for admin assignments
            startDate: new Date(),
            endDate: null,
            contractValue: 0,
            notes: 'Admin team assignment'
          };
          
          updateData.contractStatus = 'normal';
          
          // Add to contract history
          if (!updateData.contractHistory) {
            updateData.contractHistory = existingPlayer.contractHistory || [];
          }
          updateData.contractHistory.push({
            ...updateData.currentContract,
            status: 'active'
          });
        }
      }
    } else if (updateData.currentTeam === null || updateData.currentTeam === '') {
      // Player released to free agency
      updateData.contractStatus = 'free_agent';
      updateData.currentContract = {};
      updateData.currentTeam = null;
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('currentTeam', 'name logo')
     .populate('currentContract.team', 'name logo')
     .populate('currentContract.season', 'name isActive');

    console.log('✅ Player updated successfully:', updatedPlayer._id);

    // Auto-create transfer record if team changed
    const newTeamId = updatedPlayer.currentTeam?._id?.toString();
    if (oldTeamId !== newTeamId || oldContractTeamId !== newTeamId) {
      console.log('🔄 Team changed, creating transfer record:', { oldTeamId, oldContractTeamId, newTeamId });
      await createTransferRecord(id, oldTeamId || oldContractTeamId, newTeamId);
    }

    return res.status(200).json({
      message: 'Player updated successfully',
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

    throw error;
  }
}

// DELETE - Delete player
async function deletePlayer(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Player ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    await Player.findByIdAndDelete(id);

    console.log('✅ Player deleted successfully:', id);
    // Note: We preserve transfer and contract records for historical data

    return res.status(200).json({
      message: 'Player deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}
