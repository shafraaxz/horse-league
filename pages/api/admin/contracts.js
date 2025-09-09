// ===========================================
// FILE 2: pages/api/admin/contracts.js (FIXED VERSION WITH STATS PRESERVATION)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Season from '../../../models/Season';
import Transfer from '../../../models/Transfer';
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
        return await getContracts(req, res);
      case 'POST':
        return await updatePlayerContract(req, res);
      case 'DELETE':
        return await terminateContract(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Contract API Error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// GET - Fetch all contract information
async function getContracts(req, res) {
  try {
    const { seasonId, teamId, contractType } = req.query;
    
    let query = {};
    
    // Build query based on filters
    if (contractType && contractType !== 'all') {
      query.contractStatus = contractType;
    }
    
    // Team filter
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
      } else {
        query.currentTeam = teamId;
      }
    }
    
    const players = await Player.find(query)
      .populate('currentTeam', 'name logo')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive startDate endDate')
      .sort({ name: 1 })
      .lean();

    // Format contracts for response
    const contracts = players.map(player => ({
      _id: player._id,
      playerName: player.name,
      currentTeam: player.currentTeam,
      contractStatus: player.contractStatus || 'free_agent',
      currentContract: player.currentContract,
      contractHistory: player.contractHistory || [],
      // Include career stats for verification
      careerStats: player.careerStats || {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      }
    }));

    return res.status(200).json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

// FIXED: POST - Update player contract with career stats preservation
async function updatePlayerContract(req, res) {
  try {
    const { 
      playerId, 
      team, 
      season, 
      contractType = 'normal', 
      startDate, 
      endDate, 
      contractValue = 0, 
      notes = '' 
    } = req.body;

    if (!playerId || !mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: 'Valid player ID is required' });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // CRITICAL: Preserve existing career statistics before any contract changes
    const preservedCareerStats = player.careerStats || {
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0
    };

    console.log(`🛡️ Preserving career stats for ${player.name} during contract update:`, preservedCareerStats);

    // If no team provided, make player free agent
    if (!team) {
      if (player.currentContract && player.currentContract.team) {
        // Add to contract history
        player.contractHistory.push({
          ...player.currentContract,
          status: 'terminated',
          endDate: new Date()
        });

        // Create transfer record for release
        await createTransferRecordWithStatsPreservation(
          playerId, 
          player.currentContract.team, 
          null,
          preservedCareerStats,
          'release'
        );
      }

      // Clear current contract and team but PRESERVE career stats
      player.currentContract = {};
      player.currentTeam = null;
      player.contractStatus = 'free_agent';
      player.careerStats = preservedCareerStats; // Explicit preservation

      await player.save();

      console.log('✅ Player released to free agency with preserved career stats:', player.name);

      return res.status(200).json({
        message: 'Player released to free agency with preserved career statistics',
        player: {
          _id: player._id,
          name: player.name,
          contractStatus: player.contractStatus,
          currentContract: null,
          careerStats: preservedCareerStats
        }
      });
    }

    // Validate team and season
    if (!mongoose.Types.ObjectId.isValid(team) || !mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({ message: 'Valid team and season IDs are required' });
    }

    const [targetTeam, targetSeason] = await Promise.all([
      Team.findById(team),
      Season.findById(season)
    ]);

    if (!targetTeam || !targetSeason) {
      return res.status(404).json({ message: 'Team or season not found' });
    }

    // Store old team for transfer tracking
    const oldTeamId = player.currentTeam;
    const oldContractTeamId = player.currentContract?.team;

    // Terminate current contract if exists (preserve stats)
    if (player.currentContract && player.currentContract.team) {
      player.contractHistory.push({
        ...player.currentContract,
        status: 'terminated',
        endDate: new Date()
      });
    }

    // Create new contract
    const newContract = {
      team: new mongoose.Types.ObjectId(team),
      season: new mongoose.Types.ObjectId(season),
      contractType: contractType,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      contractValue: parseFloat(contractValue) || 0,
      notes: notes || `Contract updated - career stats preserved`
    };

    // Update player but PRESERVE career statistics
    player.currentContract = newContract;
    player.currentTeam = new mongoose.Types.ObjectId(team);
    player.contractStatus = contractType;
    player.careerStats = preservedCareerStats; // Explicit preservation

    // Add to contract history
    player.contractHistory.push({
      ...newContract,
      status: 'active'
    });

    await player.save();

    // Create transfer record if team changed
    const newTeamId = team;
    if (oldTeamId?.toString() !== newTeamId || oldContractTeamId?.toString() !== newTeamId) {
      await createTransferRecordWithStatsPreservation(
        playerId, 
        oldTeamId || oldContractTeamId, 
        newTeamId,
        preservedCareerStats,
        oldTeamId ? 'transfer' : 'registration'
      );
    }

    // Populate response
    const updatedPlayer = await Player.findById(playerId)
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive')
      .populate('currentTeam', 'name logo');

    console.log('✅ Contract updated successfully with preserved career stats:', {
      player: player.name,
      team: targetTeam.name,
      contractType: contractType,
      preservedStats: preservedCareerStats
    });

    return res.status(200).json({
      message: 'Contract updated successfully with preserved career statistics',
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating contract:', error);
    return res.status(500).json({ 
      message: 'Failed to update contract', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// DELETE - Terminate contract
async function terminateContract(req, res) {
  try {
    const { playerId } = req.query;

    if (!playerId || !mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: 'Valid player ID is required' });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // CRITICAL: Preserve career stats during contract termination
    const preservedCareerStats = player.careerStats || {
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0
    };

    console.log(`🛡️ Preserving career stats during contract termination for ${player.name}:`, preservedCareerStats);

    // Move current contract to history
    if (player.currentContract && player.currentContract.team) {
      player.contractHistory.push({
        ...player.currentContract,
        status: 'terminated',
        endDate: new Date()
      });

      // Create transfer record for release
      await createTransferRecordWithStatsPreservation(
        playerId,
        player.currentContract.team,
        null,
        preservedCareerStats,
        'release'
      );
    }

    // Clear contract but preserve stats
    player.currentContract = {};
    player.currentTeam = null;
    player.contractStatus = 'free_agent';
    player.careerStats = preservedCareerStats; // Explicit preservation

    await player.save();

    console.log('✅ Contract terminated with preserved career stats:', player.name);

    return res.status(200).json({
      message: 'Contract terminated successfully with preserved career statistics',
      player: {
        _id: player._id,
        name: player.name,
        contractStatus: player.contractStatus,
        careerStats: preservedCareerStats
      }
    });

  } catch (error) {
    console.error('Error terminating contract:', error);
    return res.status(500).json({ 
      message: 'Failed to terminate contract', 
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

    let notes = `Contract update - career statistics preserved: Goals: ${preservedStats.goals}, Assists: ${preservedStats.assists}, Appearances: ${preservedStats.appearances}`;
    
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
    
    console.log('✅ Transfer record created with stats preservation confirmed:', transfer._id);
  } catch (transferError) {
    console.error('❌ Transfer creation failed (non-fatal):', transferError);
  }
}
