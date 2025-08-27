// pages/api/players/[id]/transfer.js - Handle player transfers and assignments
import dbConnect from '../../../../lib/mongodb';
import Player from '../../../../models/Player';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  console.log(`🔄 Player Transfer API: ${method} /api/players/${id}/transfer`);

  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }

  try {
    const {
      toTeam,
      fromTeam,
      jerseyNumber,
      transferType = 'assignment', // 'assignment', 'transfer', 'loan', 'release'
      transferFee = 0,
      contractDuration,
      salary,
      notes,
      approvalRequired = false
    } = req.body;

    // ✅ Validate required fields
    if (!toTeam && transferType !== 'release') {
      return res.status(400).json({
        success: false,
        message: 'Destination team is required'
      });
    }

    // ✅ Find the player
    const player = await Player.findOne({ _id: id, isActive: true })
      .populate('team', 'name')
      .populate('currentTeam', 'name');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    console.log(`🔍 Processing ${transferType} for player: ${player.name}`);

    // ✅ Handle different transfer types
    if (transferType === 'release') {
      // Release player from current team
      await handlePlayerRelease(player, notes);
      
    } else {
      // Assignment or transfer to new team
      await handlePlayerAssignment(player, {
        toTeam,
        fromTeam,
        jerseyNumber,
        transferType,
        transferFee,
        contractDuration,
        salary,
        notes,
        approvalRequired
      });
    }

    // ✅ Return updated player data
    const updatedPlayer = await Player.findById(id)
      .populate('team', 'name shortName primaryColor logo')
      .populate('currentTeam', 'name shortName primaryColor logo')
      .populate('league', 'name type sport');

    console.log('✅ Transfer completed successfully');

    return res.status(200).json({
      success: true,
      message: `Player ${transferType} completed successfully`,
      data: updatedPlayer
    });

  } catch (error) {
    console.error('Error processing transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process transfer',
      error: error.message
    });
  }
}

// ✅ Handle player release (make them free agent)
async function handlePlayerRelease(player, notes) {
  const currentTeamId = player.team || player.currentTeam;
  const currentTeamName = player.team?.name || player.currentTeam?.name || 'Unknown Team';
  
  // Create transfer history entry
  const transferRecord = {
    fromTeam: currentTeamId,
    toTeam: null,
    transferDate: new Date(),
    transferType: 'release',
    transferFee: 0,
    notes: notes || `Released from ${currentTeamName}`
  };

  // Update player
  await Player.findByIdAndUpdate(player._id, {
    $unset: { 
      team: 1, 
      currentTeam: 1, 
      jerseyNumber: 1 
    },
    $push: { 
      transferHistory: transferRecord 
    },
    $set: {
      updatedAt: new Date()
    }
  });

  // Remove player from team's players array
  if (currentTeamId) {
    await Team.findByIdAndUpdate(currentTeamId, {
      $pull: { players: player._id }
    });
  }

  console.log(`✅ Player ${player.name} released from ${currentTeamName}`);
}

// ✅ Handle player assignment/transfer to team
async function handlePlayerAssignment(player, transferData) {
  const {
    toTeam,
    fromTeam,
    jerseyNumber,
    transferType,
    transferFee,
    contractDuration,
    salary,
    notes,
    approvalRequired
  } = transferData;

  // ✅ Validate destination team
  const destinationTeam = await Team.findById(toTeam);
  if (!destinationTeam) {
    throw new Error('Destination team not found');
  }

  // ✅ Check jersey number availability
  if (jerseyNumber) {
    const existingPlayer = await Player.findOne({
      $or: [{ team: toTeam }, { currentTeam: toTeam }],
      jerseyNumber: jerseyNumber,
      isActive: true,
      _id: { $ne: player._id }
    });

    if (existingPlayer) {
      throw new Error(`Jersey number ${jerseyNumber} is already taken by ${existingPlayer.name}`);
    }
  }

  // ✅ Auto-assign jersey number if not provided
  let finalJerseyNumber = jerseyNumber;
  if (!finalJerseyNumber) {
    const existingNumbers = await Player.find({
      $or: [{ team: toTeam }, { currentTeam: toTeam }],
      isActive: true
    }).select('jerseyNumber').lean();
    
    const takenNumbers = existingNumbers.map(p => p.jerseyNumber).filter(n => n);
    
    // Find first available number (1-99)
    for (let i = 1; i <= 99; i++) {
      if (!takenNumbers.includes(i)) {
        finalJerseyNumber = i;
        break;
      }
    }
    
    if (!finalJerseyNumber) {
      throw new Error('No available jersey numbers for this team');
    }
  }

  const currentTeamId = player.team || player.currentTeam;
  const currentTeamName = player.team?.name || player.currentTeam?.name;

  // ✅ Create transfer history entry
  const transferRecord = {
    fromTeam: currentTeamId,
    toTeam: toTeam,
    transferDate: new Date(),
    transferType: transferType,
    transferFee: transferFee || 0,
    contractDuration: contractDuration,
    salary: salary || 0,
    notes: notes || `${transferType === 'assignment' ? 'Assigned' : 'Transferred'} to ${destinationTeam.name}`,
    status: approvalRequired ? 'pending' : 'completed'
  };

  // ✅ Update player
  const updateData = {
    team: toTeam,
    currentTeam: toTeam,
    jerseyNumber: finalJerseyNumber,
    updatedAt: new Date(),
    $push: { 
      transferHistory: transferRecord 
    }
  };

  // Add contract details if provided
  if (contractDuration) {
    updateData.contractType = contractDuration;
  }

  await Player.findByIdAndUpdate(player._id, updateData);

  // ✅ Update team rosters
  // Remove from previous team
  if (currentTeamId && currentTeamId.toString() !== toTeam.toString()) {
    await Team.findByIdAndUpdate(currentTeamId, {
      $pull: { players: player._id }
    });
    console.log(`📤 Removed ${player.name} from ${currentTeamName}`);
  }

  // Add to new team
  await Team.findByIdAndUpdate(toTeam, {
    $addToSet: { players: player._id }
  });

  console.log(`📥 ${player.name} ${transferType === 'assignment' ? 'assigned' : 'transferred'} to ${destinationTeam.name} with jersey #${finalJerseyNumber}`);
}