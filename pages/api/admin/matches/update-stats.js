// ===========================================
// FILE: pages/api/matches/live/update-stats.js (FIXED VERSION)
// ===========================================
import dbConnect from '../../../../lib/mongodb'; // Fixed import name
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

    const { matchId, events, homeScore, awayScore } = req.body;

    // Validate input
    if (!matchId || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const match = await Match.findById(matchId)
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('season');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    console.log(`Updating player stats for match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    // Clear existing stats for this match to prevent duplicates
    await clearExistingMatchStats(matchId, match.season._id);

    // Process each event and update player statistics
    for (const event of events) {
      if (!event.player) continue; // Skip events without player info

      const player = await Player.findById(event.player);
      if (!player) {
        console.warn(`Player not found: ${event.player}`);
        continue;
      }

      // Initialize season stats if not exists
      if (!player.seasonStats) {
        player.seasonStats = {};
      }

      const seasonId = match.season._id.toString();
      if (!player.seasonStats[seasonId]) {
        player.seasonStats[seasonId] = {
          season: match.season._id,
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        };
      }

      const stats = player.seasonStats[seasonId];

      // Update stats based on event type
      switch (event.type) {
        case 'goal':
          stats.goals += 1;
          console.log(`Added goal for ${player.name}: ${stats.goals} total`);
          break;
        
        case 'assist':
          stats.assists += 1;
          console.log(`Added assist for ${player.name}: ${stats.assists} total`);
          break;
        
        case 'yellow_card':
          stats.yellowCards += 1;
          console.log(`Added yellow card for ${player.name}: ${stats.yellowCards} total`);
          break;
        
        case 'red_card':
          stats.redCards += 1;
          console.log(`Added red card for ${player.name}: ${stats.redCards} total`);
          break;
      }

      // Update career stats
      if (!player.careerStats) {
        player.careerStats = {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        };
      }

      switch (event.type) {
        case 'goal':
          player.careerStats.goals += 1;
          break;
        case 'assist':
          player.careerStats.assists += 1;
          break;
        case 'yellow_card':
          player.careerStats.yellowCards += 1;
          break;
        case 'red_card':
          player.careerStats.redCards += 1;
          break;
      }

      await player.save();
    }

    // Update appearances for all players who participated
    const allPlayerIds = [...new Set(events.filter(e => e.player).map(e => e.player))];
    
    for (const playerId of allPlayerIds) {
      const player = await Player.findById(playerId);
      if (!player) continue;

      const seasonId = match.season._id.toString();
      
      if (!player.seasonStats) player.seasonStats = {};
      if (!player.seasonStats[seasonId]) {
        player.seasonStats[seasonId] = {
          season: match.season._id,
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        };
      }

      if (!player.careerStats) {
        player.careerStats = {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        };
      }

      // Check if this player already has an appearance recorded for this match
      const hasExistingAppearance = player.matchHistory?.some(
        h => h.match.toString() === matchId
      );

      if (!hasExistingAppearance) {
        player.seasonStats[seasonId].appearances += 1;
        player.careerStats.appearances += 1;

        // Add to match history
        if (!player.matchHistory) player.matchHistory = [];
        
        // Determine player's team and opponent
        const playerTeamId = player.currentTeam.toString();
        const isHomeTeam = playerTeamId === match.homeTeam._id.toString();
        const opponentTeamId = isHomeTeam ? match.awayTeam._id : match.homeTeam._id;
        
        // Calculate match result for this player
        let result = 'draw';
        if (homeScore !== awayScore) {
          if (isHomeTeam) {
            result = homeScore > awayScore ? 'win' : 'loss';
          } else {
            result = awayScore > homeScore ? 'win' : 'loss';
          }
        }

        player.matchHistory.push({
          match: matchId,
          season: match.season._id,
          team: player.currentTeam,
          date: match.matchDate,
          opponent: opponentTeamId,
          homeTeam: match.homeTeam._id,
          awayTeam: match.awayTeam._id,
          result: result,
          goals: events.filter(e => e.player === playerId && e.type === 'goal').length,
          assists: events.filter(e => e.player === playerId && e.type === 'assist').length,
          yellowCards: events.filter(e => e.player === playerId && e.type === 'yellow_card').length,
          redCards: events.filter(e => e.player === playerId && e.type === 'red_card').length,
          minutesPlayed: 40 // Fixed: Changed from 90 to 40 minutes for futsal
        });

        await player.save();
        console.log(`Updated appearance for ${player.name}: ${player.seasonStats[seasonId].appearances} total`);
      }
    }

    return res.status(200).json({ 
      message: 'Player statistics updated successfully',
      playersUpdated: allPlayerIds.length,
      eventsProcessed: events.length
    });

  } catch (error) {
    console.error('Update stats error:', error);
    return res.status(500).json({ 
      message: 'Failed to update player statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Helper function to clear existing match stats to prevent duplicates
async function clearExistingMatchStats(matchId, seasonId) {
  try {
    // Find all players who have this match in their history
    const playersWithMatch = await Player.find({
      'matchHistory.match': matchId
    });

    for (const player of playersWithMatch) {
      // Find the match history entry
      const matchHistoryIndex = player.matchHistory.findIndex(
        h => h.match.toString() === matchId.toString()
      );

      if (matchHistoryIndex >= 0) {
        const matchHistory = player.matchHistory[matchHistoryIndex];
        
        // Subtract the stats from season and career totals
        const seasonStats = player.seasonStats?.[seasonId.toString()];
        if (seasonStats) {
          seasonStats.goals = Math.max(0, seasonStats.goals - (matchHistory.goals || 0));
          seasonStats.assists = Math.max(0, seasonStats.assists - (matchHistory.assists || 0));
          seasonStats.yellowCards = Math.max(0, seasonStats.yellowCards - (matchHistory.yellowCards || 0));
          seasonStats.redCards = Math.max(0, seasonStats.redCards - (matchHistory.redCards || 0));
          seasonStats.appearances = Math.max(0, seasonStats.appearances - 1);
        }

        if (player.careerStats) {
          player.careerStats.goals = Math.max(0, player.careerStats.goals - (matchHistory.goals || 0));
          player.careerStats.assists = Math.max(0, player.careerStats.assists - (matchHistory.assists || 0));
          player.careerStats.yellowCards = Math.max(0, player.careerStats.yellowCards - (matchHistory.yellowCards || 0));
          player.careerStats.redCards = Math.max(0, player.careerStats.redCards - (matchHistory.redCards || 0));
          player.careerStats.appearances = Math.max(0, player.careerStats.appearances - 1);
        }

        // Remove the match history entry
        player.matchHistory.splice(matchHistoryIndex, 1);
        
        await player.save();
      }
    }
  } catch (error) {
    console.error('Error clearing existing match stats:', error);
  }
}
