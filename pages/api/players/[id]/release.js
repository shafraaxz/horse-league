// pages/api/players/[playerId]/release.js - Release player back to market
import dbConnect from '../../../../lib/mongodb';
import Player from '../../../../models/Player';
import Team from '../../../../models/Team';
import Transfer from '../../../../models/Transfer';

export default async function handler(req, res) {
  const { method } = req;
  const { playerId } = req.query;

  console.log(`🔄 Player Release API: ${method} /api/players/${playerId}/release`);

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

  if (method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    const { league, reason } = req.body;

    // Find the player
    const player = await Player.findById(playerId)
      .populate('currentTeam', 'name')
      .populate('team', 'name');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const currentTeam = player.currentTeam || player.team;

    if (!currentTeam) {
      return res.status(400).json({
        success: false,
        message: 'Player is already a free agent'
      });
    }

    console.log(`🔄 Releasing ${player.name} from ${currentTeam.name} back to market`);

    // Create transfer record for release
    const transferRecord = new Transfer({
      player: playerId,
      fromTeam: currentTeam._id,
      toTeam: null, // Released to market
      league: league || player.league,
      transferType: 'release',
      transferDate: new Date(),
      status: 'completed',
      notes: reason || 'Released to league market',
      transferFee: 0,
      processedDate: new Date()
    });

    await transferRecord.save();

    // Update player status - back to market
    const previousTeamId = currentTeam._id;
    const previousJerseyNumber = player.jerseyNumber;

    player.currentTeam = null;
    player.team = null;
    player.assignedToTeam = false;
    player.status = 'available';
    player.isAvailableForTransfer = true;
    player.marketStatus = 'available';
    player.jerseyNumber = null; // Remove jersey number

    // Add to transfer history
    if (!player.transferHistory) {
      player.transferHistory = [];
    }
    
    player.transferHistory.push({
      transferId: transferRecord._id,
      fromTeam: previousTeamId,
      toTeam: null,
      transferType: 'release',
      date: new Date(),
      reason: reason || 'Released to market',
      previousJerseyNumber
    });

    await player.save();

    // Remove player from team's players array
    await Team.findByIdAndUpdate(
      previousTeamId,
      { $pull: { players: playerId } }
    );

    console.log(`✅ Player ${player.name} released back to market successfully`);

    // Populate the transfer for response
    const populatedTransfer = await Transfer.findById(transferRecord._id)
      .populate('player', 'name photo position')
      .populate('fromTeam', 'name')
      .populate('league', 'name');

    return res.status(200).json({
      success: true,
      message: 'Player released back to market successfully',
      data: {
        player: await Player.findById(playerId)
          .populate('league', 'name'),
        transfer: populatedTransfer
      }
    });

  } catch (error) {
    console.error('❌ Error releasing player:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to release player',
      error: error.message
    });
  }
}