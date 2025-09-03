// ===========================================
// FILE: pages/api/admin/contracts.js (NEW CONTRACT MANAGEMENT API)
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

// GET - Fetch contracts with filters
async function getContracts(req, res) {
  try {
    const { seasonId, teamId, contractType, playerId } = req.query;
    
    let query = {};
    
    // Filter by player
    if (playerId && playerId !== 'all') {
      query._id = playerId;
    }
    
    // Filter by team (through current contract)
    if (teamId && teamId !== 'all') {
      query['currentContract.team'] = new mongoose.Types.ObjectId(teamId);
    }
    
    // Filter by season (through current contract)
    if (seasonId && seasonId !== 'all') {
      query['currentContract.season'] = new mongoose.Types.ObjectId(seasonId);
    }
    
    // Filter by contract type
    if (contractType && contractType !== 'all') {
      if (contractType === 'free_agent') {
        query.contractStatus = 'free_agent';
      } else {
        query.contractStatus = contractType;
      }
    }

    const players = await Player.find(query)
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive startDate endDate')
      .populate('currentTeam', 'name logo')
      .sort({ 'currentContract.startDate': -1, name: 1 })
      .lean();

    // Format contract data for response
    const contracts = players.map(player => ({
      playerId: player._id,
      playerName: player.name,
      playerPhoto: player.photo,
      currentTeam: player.currentTeam,
      contractStatus: player.contractStatus,
      currentContract: player.currentContract || null,
      contractHistory: player.contractHistory || [],
      canTransfer: player.contractStatus === 'free_agent' || 
                  (player.currentContract?.contractType === 'normal'),
      transferEligible: player.contractStatus !== 'seasonal' || 
                       (player.currentContract?.season && !player.currentContract.season.isActive)
    }));

    console.log(`Fetched ${contracts.length} player contracts`);
    
    return res.status(200).json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

// POST - Update player contract
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

    // Validate required fields
    if (!playerId) {
      return res.status(400).json({ message: 'Player ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    // Get player
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // If no team provided, make player free agent
    if (!team) {
      // Release player from current contract
      if (player.currentContract && player.currentContract.team) {
        // Add to contract history
        player.contractHistory.push({
          ...player.currentContract,
          status: 'terminated',
          endDate: new Date()
        });

        // Create transfer record for release
        await createTransferRecord(
          playerId, 
          player.currentContract.team, 
          null, 
          season || player.currentContract.season,
          'release'
        );
      }

      // Clear current contract and team
      player.currentContract = {};
      player.currentTeam = null;
      player.contractStatus = 'free_agent';

      await player.save();

      console.log('✅ Player released to free agency:', player.name);

      return res.status(200).json({
        message: 'Player released to free agency',
        player: {
          _id: player._id,
          name: player.name,
          contractStatus: player.contractStatus,
          currentContract: null
        }
      });
    }

    // Validate team and season
    if (!mongoose.Types.ObjectId.isValid(team)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    // Verify team and season exist
    const [targetTeam, targetSeason] = await Promise.all([
      Team.findById(team),
      Season.findById(season)
    ]);

    if (!targetTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!targetSeason) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if player can be transferred (contract rules)
    const transferEligibility = await player.canTransfer(targetSeason);
    if (!transferEligibility.canTransfer) {
      return res.status(400).json({ 
        message: 'Transfer not allowed', 
        reason: transferEligibility.reason,
        contractEndDate: transferEligibility.contractEndDate
      });
    }

    // Store old team for transfer record
    const oldTeamId = player.currentTeam;
    const oldContractTeamId = player.currentContract?.team;

    // Terminate current contract if exists
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
      notes: notes
    };

    // Update player
    player.currentContract = newContract;
    player.currentTeam = new mongoose.Types.ObjectId(team);
    player.contractStatus = contractType;

    // Add to contract history
    player.contractHistory.push({
      ...newContract,
      status: 'active'
    });

    await player.save();

    // Create transfer record if team changed
    const newTeamId = team;
    if (oldTeamId?.toString() !== newTeamId || oldContractTeamId?.toString() !== newTeamId) {
      await createTransferRecord(
        playerId, 
        oldTeamId || oldContractTeamId, 
        newTeamId, 
        season,
        oldTeamId ? 'transfer' : 'registration'
      );
    }

    // Populate response
    const updatedPlayer = await Player.findById(playerId)
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive')
      .populate('currentTeam', 'name logo');

    console.log('✅ Contract updated successfully:', {
      player: player.name,
      team: targetTeam.name,
      contractType: contractType
    });

    return res.status(200).json({
      message: 'Contract updated successfully',
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
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

    if (!player.currentContract || !player.currentContract.team) {
      return res.status(400).json({ message: 'Player has no active contract to terminate' });
    }

    // Add current contract to history as terminated
    player.contractHistory.push({
      ...player.currentContract,
      status: 'terminated',
      endDate: new Date()
    });

    // Create release transfer record
    await createTransferRecord(
      playerId, 
      player.currentContract.team, 
      null, 
      player.currentContract.season,
      'release'
    );

    // Clear current contract
    player.currentContract = {};
    player.currentTeam = null;
    player.contractStatus = 'free_agent';

    await player.save();

    console.log('✅ Contract terminated:', player.name);

    return res.status(200).json({
      message: 'Contract terminated successfully',
      player: {
        _id: player._id,
        name: player.name,
        contractStatus: 'free_agent'
      }
    });

  } catch (error) {
    console.error('Error terminating contract:', error);
    throw error;
  }
}

// Helper function to create transfer records
async function createTransferRecord(playerId, fromTeamId, toTeamId, seasonId, transferType = 'transfer') {
  try {
    let notes = '';
    if (transferType === 'registration') {
      notes = toTeamId ? 'Contract registration - joined team' : 'Initial registration as free agent';
    } else if (transferType === 'transfer') {
      notes = 'Contract transfer between teams';
    } else if (transferType === 'release') {
      notes = 'Contract terminated - released to free agency';
    }

    const transferData = {
      player: playerId,
      fromTeam: fromTeamId || null,
      toTeam: toTeamId || null,
      season: seasonId,
      transferDate: new Date(),
      transferType: transferType,
      notes: notes
    };

    const transfer = new Transfer(transferData);
    await transfer.save();
    
    console.log('✅ Transfer record created:', transfer._id);
  } catch (transferError) {
    console.error('❌ Transfer creation failed (non-fatal):', transferError);
    // Don't throw - this is non-fatal
  }
}
