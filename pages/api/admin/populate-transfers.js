// ===========================================
// FILE: pages/api/admin/populate-transfers.js
// One-time script to create missing transfer records
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Check authentication (optional - remove if you want to run without auth)
    // const session = await getServerSession(req, res, authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    // Get active season
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return res.status(400).json({ message: 'No active season found' });
    }

    console.log('Found active season:', activeSeason.name);

    // Find all players with teams
    const players = await Player.find({ 
      currentTeam: { $ne: null },
      status: { $in: ['active', 'injured', 'suspended'] }
    }).populate('currentTeam', 'name season');

    console.log(`Found ${players.length} players with teams`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const player of players) {
      // Check if transfer record already exists
      const existingTransfer = await Transfer.findOne({
        player: player._id,
        toTeam: player.currentTeam._id
      });

      if (!existingTransfer) {
        try {
          // Create transfer record
          const transferRecord = new Transfer({
            player: player._id,
            fromTeam: null, // Registration (no previous team)
            toTeam: player.currentTeam._id,
            season: activeSeason._id, // Use active season
            transferType: 'registration',
            transferDate: player.createdAt || new Date(),
            transferFee: 0,
            notes: 'Retroactive registration - populated by admin script'
          });

          await transferRecord.save();
          createdCount++;
          console.log(`✓ Created transfer record for ${player.name} → ${player.currentTeam.name}`);
        } catch (error) {
          console.error(`✗ Failed to create transfer for ${player.name}:`, error.message);
        }
      } else {
        skippedCount++;
        console.log(`- Skipped ${player.name} (transfer record exists)`);
      }
    }

    // Also check for free agents and create their registration records
    const freeAgents = await Player.find({
      currentTeam: null,
      status: { $in: ['active', 'injured', 'suspended'] }
    });

    for (const player of freeAgents) {
      // Check if any transfer record exists for this player
      const existingTransfer = await Transfer.findOne({
        player: player._id
      });

      if (!existingTransfer) {
        try {
          // Create a registration record even for free agents
          const transferRecord = new Transfer({
            player: player._id,
            fromTeam: null,
            toTeam: null, // Special case: registered but no team assigned
            season: activeSeason._id,
            transferType: 'registration',
            transferDate: player.createdAt || new Date(),
            transferFee: 0,
            notes: 'Player registered as free agent'
          });

          // Don't save this - Transfer model requires toTeam
          // await transferRecord.save();
          console.log(`- Free agent ${player.name} - no transfer record needed`);
        } catch (error) {
          console.log(`- Free agent ${player.name} - skipped`);
        }
      }
    }

    const summary = {
      message: 'Transfer population completed',
      results: {
        totalPlayers: players.length,
        transfersCreated: createdCount,
        transfersSkipped: skippedCount,
        freeAgents: freeAgents.length
      },
      activeSeason: activeSeason.name
    };

    console.log('Final summary:', summary);
    
    res.status(200).json(summary);

  } catch (error) {
    console.error('Error populating transfers:', error);
    res.status(500).json({ 
      message: 'Error populating transfers',
      error: error.message 
    });
  }
}
