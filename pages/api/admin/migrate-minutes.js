// ===========================================
// FILE: pages/api/admin/migrate-minutes.js
// API endpoint to migrate player minutes from 90 to 40
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await dbConnect();

    console.log('Starting migration: 90 minutes → 40 minutes...');

    // Find all players with match history
    const players = await Player.find({
      'matchHistory': { $exists: true, $not: { $size: 0 } }
    });

    console.log(`Found ${players.length} players with match history`);

    let totalUpdated = 0;
    let playersUpdated = 0;
    let errors = [];

    for (const player of players) {
      try {
        let playerNeedsUpdate = false;
        let matchesUpdated = 0;

        // Update match history
        if (player.matchHistory && player.matchHistory.length > 0) {
          for (let match of player.matchHistory) {
            if (match.minutesPlayed === 90) {
              match.minutesPlayed = 40;
              matchesUpdated++;
              playerNeedsUpdate = true;
            }
          }
        }

        // Update season stats minutesPlayed
        if (player.seasonStats) {
          for (const seasonId in player.seasonStats) {
            const seasonStat = player.seasonStats[seasonId];
            if (seasonStat.minutesPlayed > 0) {
              // Calculate total minutes: appearances * 40 (instead of 90)
              const newMinutes = seasonStat.appearances * 40;
              if (seasonStat.minutesPlayed !== newMinutes) {
                seasonStat.minutesPlayed = newMinutes;
                playerNeedsUpdate = true;
              }
            }
          }
        }

        // Update career stats minutesPlayed
        if (player.careerStats && player.careerStats.minutesPlayed > 0) {
          // Calculate total career minutes: appearances * 40
          const newCareerMinutes = player.careerStats.appearances * 40;
          if (player.careerStats.minutesPlayed !== newCareerMinutes) {
            player.careerStats.minutesPlayed = newCareerMinutes;
            playerNeedsUpdate = true;
          }
        }

        // Save player if updates were made
        if (playerNeedsUpdate) {
          await player.save();
          playersUpdated++;
          totalUpdated += matchesUpdated;
          
          console.log(`Updated ${player.name}: ${matchesUpdated} matches`);
        }

      } catch (error) {
        console.error(`Error updating player ${player.name}:`, error);
        errors.push({
          player: player.name,
          error: error.message
        });
      }
    }

    console.log('Migration completed!');

    return res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      summary: {
        playersUpdated,
        matchRecordsUpdated: totalUpdated,
        totalPlayersProcessed: players.length,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
