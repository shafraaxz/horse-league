// ===========================================
// FILE: pages/api/matches/live/update-stats.js
// ===========================================
import connectDB from '../../../../lib/mongodb';
import Player from '../../../../models/Player';
import Match from '../../../../models/Match';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { matchId, events, homeScore, awayScore } = req.body;

    const match = await Match.findById(matchId)
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('season');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    console.log(`Updating player stats for match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

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
        
        player.matchHistory.push({
          match: matchId,
          season: match.season._id,
          team: player.currentTeam,
          date: match.matchDate,
          opponent: player.currentTeam.toString() === match.homeTeam._id.toString() 
            ? match.awayTeam._id 
            : match.homeTeam._id,
          homeTeam: match.homeTeam._id,
          awayTeam: match.awayTeam._id,
          result: homeScore === awayScore ? 'draw' : 
            (player.currentTeam.toString() === match.homeTeam._id.toString() 
              ? (homeScore > awayScore ? 'win' : 'loss')
              : (awayScore > homeScore ? 'win' : 'loss')),
          goals: events.filter(e => e.player === playerId && e.type === 'goal').length,
          assists: events.filter(e => e.player === playerId && e.type === 'assist').length,
          yellowCards: events.filter(e => e.player === playerId && e.type === 'yellow_card').length,
          redCards: events.filter(e => e.player === playerId && e.type === 'red_card').length,
          minutesPlayed: 90 // Default to full match, can be updated later
        });

        await player.save();
        console.log(`Updated appearance for ${player.name}: ${player.seasonStats[seasonId].appearances} total`);
      }
    }

    return res.status(200).json({ 
      message: 'Player statistics updated successfully',
      playersUpdated: allPlayerIds.length
    });

  } catch (error) {
    console.error('Update stats error:', error);
    return res.status(500).json({ 
      message: 'Failed to update player statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}