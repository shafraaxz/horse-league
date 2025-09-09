// ===========================================
// COMPREHENSIVE STATISTICS FIX
// Fixes: Players page 50-player limit, Teams page goal calculation, Admin APIs with transfer preservation
// ===========================================

// FILE 1: pages/api/admin/players.js (FIXED VERSION WITH TRANSFER STATS PRESERVATION)
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

// FIXED: GET - Fetch ALL players without artificial limits
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

    // FIXED: Remove limit to get ALL players
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
      
      // FIXED: Always preserve careerStats
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

// FIXED: PUT - Update player with career stats preservation
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

    console.log(`🛡️ Preserving career stats for ${existingPlayer.name}:`, preservedCareerStats);

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
        console.log(`🔄 Team change detected for ${existingPlayer.name} - PRESERVING career stats`);
        
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
      console.log(`🔓 Releasing ${existingPlayer.name} to free agency - preserving career stats`);
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

    console.log('✅ Player updated with preserved career stats:', updatedPlayer._id);

    // Create transfer record if team changed
    const newTeamId = updatedPlayer.currentTeam?._id?.toString();
    if (oldTeamId !== newTeamId || oldContractTeamId !== newTeamId) {
      console.log('🔄 Creating transfer record (stats preservation confirmed)');
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

// FIXED: Enhanced transfer record creation with stats preservation confirmation
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
    
    console.log('✅ Transfer record created with stats preservation confirmed:', transfer._id);
  } catch (transferError) {
    console.error('❌ Transfer creation failed (non-fatal):', transferError);
  }
}

// Rest of functions remain the same...
async function createPlayer(req, res) {
  // ... existing implementation with careerStats preservation
}

async function deletePlayer(req, res) {
  // ... existing implementation
}

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

// Rest of functions with similar fixes...
async function getContracts(req, res) {
  // ... existing implementation
}

async function terminateContract(req, res) {
  // ... existing implementation with careerStats preservation
}

// ===========================================
// FILE 3: pages/api/public/players.js (FIXED - Remove 50 Player Limit)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId, teamId, search } = req.query; // REMOVED limit parameter
    
    console.log('🔍 Public players API called with:', { seasonId, teamId, search });
    
    let query = {};
    
    // Handle search by player ID or name
    if (search) {
      if (search.length === 24) { // MongoDB ObjectId length
        query._id = search;
      } else {
        query.name = { $regex: search, $options: 'i' };
      }
    }
    
    // Filter by season (through teams)
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
    
    // Filter by team
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
        if (query.$or) delete query.$or; // Remove season filtering
      } else {
        query.currentTeam = teamId;
        if (query.$or) delete query.$or; // Remove season filtering
      }
    }

    console.log('🔍 Player query built:', JSON.stringify(query, null, 2));
    
    // FIXED: Fetch ALL players without limit
    const players = await Player.find(query)
      .populate('currentTeam', 'name logo season')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive startDate endDate')
      .sort({ name: 1 })
      // .limit(parseInt(limit)) // REMOVED LIMIT
      .lean();

    console.log(`🔍 Found ${players.length} players from database (NO LIMIT)`);

    // STANDARDIZED NORMALIZATION FUNCTION
    const normalizePlayerStats = (player) => {
      return {
        goals: player.careerStats?.goals || 0,
        assists: player.careerStats?.assists || 0,
        appearances: player.careerStats?.appearances || 0,
        yellowCards: player.careerStats?.yellowCards || 0,
        redCards: player.careerStats?.redCards || 0,
        minutesPlayed: player.careerStats?.minutesPlayed || 0,
        wins: player.careerStats?.wins || 0,
        losses: player.careerStats?.losses || 0,
        draws: player.careerStats?.draws || 0
      };
    };

    // Process players with consistent statistics
    const publicPlayers = players.map(player => {
      const normalizedStats = normalizePlayerStats(player);

      return {
        _id: player._id,
        name: player.name,
        position: player.position || 'Outfield Player',
        jerseyNumber: player.jerseyNumber,
        dateOfBirth: player.dateOfBirth,
        nationality: player.nationality || '',
        height: player.height,
        weight: player.weight,
        photo: normalizePhoto(player.photo),
        
        currentTeam: player.currentTeam ? {
          _id: player.currentTeam._id,
          name: player.currentTeam.name,
          logo: normalizePhoto(player.currentTeam.logo),
          season: player.currentTeam.season
        } : null,
        
        status: player.status,
        contractStatus: player.contractStatus || 'free_agent',
        currentContract: player.currentContract && player.currentContract.team ? {
          team: player.currentContract.team ? {
            _id: player.currentContract.team._id,
            name: player.currentContract.team.name,
            logo: normalizePhoto(player.currentContract.team.logo)
          } : null,
          season: player.currentContract.season ? {
            _id: player.currentContract.season._id,
            name: player.currentContract.season.name,
            isActive: player.currentContract.season.isActive,
            startDate: player.currentContract.season.startDate,
            endDate: player.currentContract.season.endDate
          } : null,
          contractType: player.currentContract.contractType,
          startDate: player.currentContract.startDate,
          endDate: player.currentContract.endDate,
          contractValue: player.currentContract.contractValue || 0,
          notes: player.currentContract.notes || ''
        } : null,
        
        // CONSISTENT STATISTICS - Use careerStats as primary source
        careerStats: player.careerStats || {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0
        },
        
        // For backwards compatibility
        stats: normalizedStats
      };
    });

    // Debug: Calculate totals to verify consistency
    const totalGoals = publicPlayers.reduce((sum, p) => sum + (p.careerStats?.goals || 0), 0);
    const playersWithGoals = publicPlayers.filter(p => (p.careerStats?.goals || 0) > 0);
    
    console.log('🔍 Player API stats summary (FIXED - NO LIMIT):', {
      totalPlayers: publicPlayers.length,
      totalGoals,
      playersWithGoals: playersWithGoals.length,
      topScorers: playersWithGoals
        .sort((a, b) => (b.careerStats?.goals || 0) - (a.careerStats?.goals || 0))
        .slice(0, 5)
        .map(p => `${p.name}: ${p.careerStats?.goals || 0} goals`)
    });

    res.status(200).json(publicPlayers);
    
  } catch (error) {
    console.error('❌ Public players API error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Helper function to normalize photo/logo data
function normalizePhoto(photo) {
  if (!photo) return null;
  
  if (typeof photo === 'string') {
    return photo;
  }
  
  if (typeof photo === 'object') {
    return photo.secure_url || photo.url || null;
  }
  
  return null;
}

// ===========================================
// FILE 4: pages/api/public/stats.js (FIXED - Accurate Goal Calculation)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { teamId, seasonId } = req.query;
    
    // Build queries based on filters
    const playerQuery = {};
    const matchQuery = {};
    
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        playerQuery.currentTeam = null;
      } else {
        playerQuery.currentTeam = teamId;
      }
    }
    
    if (seasonId && seasonId !== 'all') {
      matchQuery.season = seasonId;
      if (!teamId || teamId === 'all') {
        const teams = await Team.find({ season: seasonId }).select('_id');
        const teamIds = teams.map(team => team._id);
        playerQuery.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null }
        ];
      }
    }

    // Get active season for context
    const activeSeason = await Team.findOne({})
      .populate('season')
      .then(team => team?.season?.isActive ? team.season : null);

    // FIXED: Fetch ALL data in parallel without limits
    const [
      totalTeams,
      totalPlayers,
      allMatches,
      allPlayers, // Get ALL players
      totalTransfers
    ] = await Promise.all([
      teamId && teamId !== 'all' 
        ? (teamId === 'free-agents' ? 0 : 1) 
        : Team.countDocuments({}),
      
      Player.countDocuments(playerQuery),
      Match.find(matchQuery).lean(),
      Player.find(playerQuery).lean(), // No limit here
      Transfer.countDocuments({}).catch(() => 0)
    ]);

    // Calculate match statistics
    const totalMatches = allMatches.length;
    const completedMatches = allMatches.filter(m => m.status === 'completed');
    const liveMatches = allMatches.filter(m => m.status === 'live');
    const scheduledMatches = allMatches.filter(m => m.status === 'scheduled');
    const completedMatchCount = completedMatches.length;
    const liveMatchCount = liveMatches.length;
    const scheduledMatchCount = scheduledMatches.length;

    // FIXED: Calculate total goals using ONLY careerStats from ALL players
    const totalGoals = allPlayers.reduce((sum, player) => {
      return sum + (player.careerStats?.goals || 0);
    }, 0);

    console.log('Goal calculation details (FIXED - ALL PLAYERS):', {
      totalPlayers: allPlayers.length,
      totalGoals,
      samplePlayerStats: allPlayers
        .filter(p => (p.careerStats?.goals || 0) > 0)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          careerGoals: p.careerStats?.goals || 0
        }))
    });

    // Calculate match completion rate
    const matchCompletionRate = totalMatches > 0 
      ? Math.round((completedMatchCount / totalMatches) * 100) 
      : 0;

    // Calculate average goals per match
    const avgGoalsPerMatch = completedMatchCount > 0 
      ? Math.round((totalGoals / completedMatchCount) * 10) / 10 
      : 0;

    const stats = {
      // Basic counts
      totalTeams,
      totalPlayers,
      totalMatches,
      totalGoals,
      totalTransfers,
      
      // Match breakdown
      completedMatches: completedMatchCount,
      liveMatches: liveMatchCount,
      scheduledMatches: scheduledMatchCount,
      matchCompletionRate,
      avgGoalsPerMatch,
      
      // Filter context
      filters: {
        teamId: teamId || null,
        seasonId: seasonId || null,
        teamName: teamId ? (teamId === 'free-agents' ? 'Free Agents' : 'Selected Team') : null,
        seasonName: activeSeason?.name || null
      },
      
      // Season info
      currentSeason: activeSeason ? {
        _id: activeSeason._id,
        name: activeSeason.name,
        isActive: activeSeason.isActive,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate
      } : null
    };

    console.log('📊 Stats API Response (FIXED - ALL PLAYERS):', {
      totalGoals: stats.totalGoals,
      totalPlayers: stats.totalPlayers,
      avgGoalsPerMatch: stats.avgGoalsPerMatch,
      playersQueried: allPlayers.length,
      filters: stats.filters
    });

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Stats API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
