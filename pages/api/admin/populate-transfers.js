// ===========================================
// FILE: pages/api/admin/force-populate-transfers.js (FORCE RECREATE ALL TRANSFERS)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('=== FORCE POPULATE TRANSFERS SCRIPT STARTED ===');

    // Get the active season
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return res.status(400).json({ 
        message: 'No active season found',
        error: 'An active season is required to create transfer records'
      });
    }

    console.log('Active season:', activeSeason.name);

    // FORCE DELETE ALL EXISTING TRANSFERS FOR THIS SEASON
    const deleteResult = await Transfer.deleteMany({ season: activeSeason._id });
    console.log(`Deleted ${deleteResult.deletedCount} existing transfers`);

    // Get all players
    const allPlayers = await Player.find({}).populate('currentTeam');
    console.log(`Found ${allPlayers.length} total players`);

    let transfersCreated = 0;
    let freeAgents = 0;

    for (const player of allPlayers) {
      try {
        // Create transfer record based on current team status
        const transferData = {
          player: player._id,
          fromTeam: null, // Initial registration
          toTeam: player.currentTeam ? player.currentTeam._id : null,
          season: activeSeason._id,
          transferDate: new Date(),
          transferType: player.currentTeam ? 'registration' : 'registration',
          notes: player.currentTeam 
            ? `Initial registration - assigned to ${player.currentTeam.name}`
            : 'Initial registration - free agent'
        };

        const transfer = new Transfer(transferData);
        await transfer.save();
        
        if (player.currentTeam) {
          console.log(`✅ Created transfer: ${player.name} → ${player.currentTeam.name}`);
        } else {
          console.log(`✅ Created transfer: ${player.name} → Free Agent`);
          freeAgents++;
        }
        
        transfersCreated++;

      } catch (playerError) {
        console.error(`❌ Error processing ${player.name}:`, playerError.message);
        continue;
      }
    }

    console.log('=== FORCE POPULATE TRANSFERS SCRIPT COMPLETED ===');

    const results = {
      deletedTransfers: deleteResult.deletedCount,
      totalPlayers: allPlayers.length,
      transfersCreated,
      freeAgents,
      playersWithTeams: allPlayers.length - freeAgents,
      activeSeason: activeSeason.name
    };

    console.log('Results:', results);

    res.status(200).json({
      message: 'Force transfer population completed',
      results,
      activeSeason: activeSeason.name
    });

  } catch (error) {
    console.error('Force populate transfers error:', error);
    res.status(500).json({
      message: 'Error force populating transfers',
      error: error.message
    });
  }
}
