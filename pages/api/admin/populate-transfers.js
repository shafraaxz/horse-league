// ===========================================
// FILE: pages/api/admin/populate-transfers.js (FIXED - Correct Model Imports)
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

    console.log('=== POPULATE TRANSFERS SCRIPT STARTED ===');

    // Get the active season
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return res.status(400).json({ 
        message: 'No active season found',
        error: 'An active season is required to create transfer records'
      });
    }

    console.log('Active season:', activeSeason.name);

    // Get all players
    const allPlayers = await Player.find({}).populate('currentTeam');
    console.log(`Found ${allPlayers.length} total players`);

    let transfersCreated = 0;
    let transfersSkipped = 0;
    let freeAgents = 0;

    for (const player of allPlayers) {
      try {
        // Check if transfer record already exists for this player
        const existingTransfer = await Transfer.findOne({ 
          player: player._id,
          season: activeSeason._id
        });

        if (existingTransfer) {
          console.log(`Transfer already exists for ${player.name}, skipping`);
          transfersSkipped++;
          continue;
        }

        // Create transfer record based on current team status
        const transferData = {
          player: player._id,
          fromTeam: null, // Assuming this is initial registration
          toTeam: player.currentTeam ? player.currentTeam._id : null,
          season: activeSeason._id,
          transferDate: new Date(),
          transferType: 'registration',
          notes: player.currentTeam 
            ? `Initial registration - assigned to ${player.currentTeam.name}`
            : 'Initial registration - free agent'
        };

        // Only create if player has a team (since your current model requires toTeam)
        if (player.currentTeam) {
          const transfer = new Transfer(transferData);
          await transfer.save();
          
          console.log(`Created transfer record for ${player.name} → ${player.currentTeam.name}`);
          transfersCreated++;
        } else {
          console.log(`${player.name} is a free agent - skipping (toTeam required in current model)`);
          freeAgents++;
        }

      } catch (playerError) {
        console.error(`Error processing ${player.name}:`, playerError.message);
        continue;
      }
    }

    console.log('=== POPULATE TRANSFERS SCRIPT COMPLETED ===');

    const results = {
      totalPlayers: allPlayers.length,
      transfersCreated,
      transfersSkipped,
      freeAgents,
      activeSeason: activeSeason.name
    };

    console.log('Results:', results);

    res.status(200).json({
      message: 'Transfer population completed',
      results,
      activeSeason: activeSeason.name
    });

  } catch (error) {
    console.error('Populate transfers error:', error);
    res.status(500).json({
      message: 'Error populating transfers',
      error: error.message
    });
  }
}
