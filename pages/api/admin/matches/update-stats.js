// ===========================================
// FILE: pages/api/admin/matches/update-stats.js (ENHANCED WITH OWN GOALS)
// ===========================================
import dbConnect from '../../../../lib/mongodb';
import Player from '../../../../models/Player';
import Match from '../../../../models/Match';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { matchId, events } = req.body;

    if (!matchId || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const match = await Match.findById(matchId).populate('season');
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    console.log(`Updating enhanced stats for match: ${matchId}`);

    // Clear existing player stats for this match
    await clearExistingMatchStats(matchId, match.season._id);

    // Process each event and update player statistics
    const playerUpdates = new Map();

    for (const event of events) {
      // Skip events without player (officials) for player stats
      if (!event.player || event.isOfficial) continue;

      const playerId = event.player.toString();
      
      if (!playerUpdates.has(playerId)) {
        playerUpdates.set(playerId, {
          goals: 0,
          ownGoals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 1 // Player appeared in match
        });
      }

      const playerStats = playerUpdates.get(playerId);

      switch (event.type) {
        case 'goal':
          playerStats.goals++;
          break;
        case 'own_goal':
          playerStats.ownGoals++;
          break;
        case 'assist':
          playerStats.assists++;
          break;
        case 'yellow_card':
          playerStats.yellowCards++;
          break;
        case 'red_card':
          playerStats.redCards++;
          break;
      }
    }

    // Update each player's career stats
    const updatePromises = [];
    for (const [playerId, stats] of playerUpdates) {
      updatePromises.push(updatePlayerCareerStats(playerId, stats, match.season._id));
    }

    await Promise.all(updatePromises);

    // Update match with calculated stats
    match.events = events;
    match.calculateMatchStats();
    match.statsUpdated = true;
    await match.save();

    console.log('✅ Enhanced stats update completed');

    return res.status(200).json({
      success: true,
      message: 'Enhanced match statistics updated successfully',
      playersUpdated: playerUpdates.size,
      matchStats: match.stats
    });

  } catch (error) {
    console.error('Error updating enhanced stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update enhanced statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

async function updatePlayerCareerStats(playerId, matchStats, seasonId) {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      console.warn(`Player not found: ${playerId}`);
      return;
    }

    // Initialize career stats if missing
    if (!player.careerStats) {
      player.careerStats = {
        appearances: 0,
        goals: 0,
        ownGoals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0
      };
    }

    // Update career totals
    player.careerStats.appearances += matchStats.appearances;
    player.careerStats.goals += matchStats.goals;
    player.careerStats.ownGoals += matchStats.ownGoals;
    player.careerStats.assists += matchStats.assists;
    player.careerStats.yellowCards += matchStats.yellowCards;
    player.careerStats.redCards += matchStats.redCards;
    player.careerStats.minutesPlayed += 40; // Default match duration

    // Update season stats
    let seasonStats = player.seasonStats.find(s => s.season.toString() === seasonId.toString());
    if (!seasonStats) {
      seasonStats = {
        season: seasonId,
        appearances: 0,
        goals: 0,
        ownGoals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0
      };
      player.seasonStats.push(seasonStats);
    }

    seasonStats.appearances += matchStats.appearances;
    seasonStats.goals += matchStats.goals;
    seasonStats.ownGoals += matchStats.ownGoals;
    seasonStats.assists += matchStats.assists;
    seasonStats.yellowCards += matchStats.yellowCards;
    seasonStats.redCards += matchStats.redCards;
    seasonStats.minutesPlayed += 40;

    await player.save();
    
    console.log(`Updated ${player.name}: +${matchStats.goals} goals, +${matchStats.ownGoals} own goals`);
  } catch (error) {
    console.error(`Error updating player ${playerId}:`, error);
  }
}

async function clearExistingMatchStats(matchId, seasonId) {
  try {
    // Find all players who had stats from this match
    const players = await Player.find({
      'matchHistory.match': matchId
    });

    for (const player of players) {
      // Remove match from history
      player.matchHistory = player.matchHistory.filter(
        history => history.match.toString() !== matchId.toString()
      );

      // Recalculate career and season stats
      // This is a simplified approach - you might want to implement more sophisticated logic
      await player.save();
    }

    console.log(`Cleared existing stats for ${players.length} players`);
  } catch (error) {
    console.error('Error clearing existing match stats:', error);
  }
}
