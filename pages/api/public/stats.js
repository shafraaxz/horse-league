// ===========================================
// FILE: pages/api/public/stats.js (ENHANCED WITH OWN GOALS)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { teamId, seasonId } = req.query;
    
    // Get all players and calculate enhanced totals
    const allPlayers = await Player.find({}).lean();
    
    const enhancedStats = allPlayers.reduce((totals, player) => ({
      totalGoals: totals.totalGoals + (player.careerStats?.goals || 0),
      totalOwnGoals: totals.totalOwnGoals + (player.careerStats?.ownGoals || 0),
      totalAssists: totals.totalAssists + (player.careerStats?.assists || 0),
      totalAppearances: totals.totalAppearances + (player.careerStats?.appearances || 0),
      totalYellowCards: totals.totalYellowCards + (player.careerStats?.yellowCards || 0),
      totalRedCards: totals.totalRedCards + (player.careerStats?.redCards || 0)
    }), { 
      totalGoals: 0, 
      totalOwnGoals: 0, 
      totalAssists: 0, 
      totalAppearances: 0,
      totalYellowCards: 0,
      totalRedCards: 0
    });

    // Get match-based totals for comparison
    const allMatches = await Match.find({ status: 'completed' }).lean();
    const matchTotals = allMatches.reduce((totals, match) => {
      const homeTotal = match.stats?.homeGoals?.total || match.homeScore || 0;
      const awayTotal = match.stats?.awayGoals?.total || match.awayScore || 0;
      
      return {
        totalMatchGoals: totals.totalMatchGoals + homeTotal + awayTotal,
        regularGoals: totals.regularGoals + 
          (match.stats?.homeGoals?.regular || 0) + 
          (match.stats?.awayGoals?.regular || 0),
        ownGoalsFromMatches: totals.ownGoalsFromMatches + 
          (match.stats?.homeGoals?.ownGoals || 0) + 
          (match.stats?.awayGoals?.ownGoals || 0),
        yellowCardsFromMatches: totals.yellowCardsFromMatches +
          (match.stats?.yellowCards?.home || 0) +
          (match.stats?.yellowCards?.away || 0),
        redCardsFromMatches: totals.redCardsFromMatches +
          (match.stats?.redCards?.home || 0) +
          (match.stats?.redCards?.away || 0)
      };
    }, { 
      totalMatchGoals: 0, 
      regularGoals: 0, 
      ownGoalsFromMatches: 0,
      yellowCardsFromMatches: 0,
      redCardsFromMatches: 0
    });

    // Top performers
    const topScorers = allPlayers
      .filter(player => player.careerStats?.goals > 0)
      .sort((a, b) => (b.careerStats?.goals || 0) - (a.careerStats?.goals || 0))
      .slice(0, 10)
      .map(player => ({
        _id: player._id,
        name: player.name,
        team: player.currentTeam,
        goals: player.careerStats?.goals || 0,
        ownGoals: player.careerStats?.ownGoals || 0,
        assists: player.careerStats?.assists || 0
      }));

    const topAssists = allPlayers
      .filter(player => player.careerStats?.assists > 0)
      .sort((a, b) => (b.careerStats?.assists || 0) - (a.careerStats?.assists || 0))
      .slice(0, 10)
      .map(player => ({
        _id: player._id,
        name: player.name,
        team: player.currentTeam,
        assists: player.careerStats?.assists || 0,
        goals: player.careerStats?.goals || 0
      }));

    // Most disciplined (least cards)
    const mostDisciplined = allPlayers
      .filter(player => player.careerStats?.appearances > 0)
      .map(player => ({
        _id: player._id,
        name: player.name,
        team: player.currentTeam,
        appearances: player.careerStats?.appearances || 0,
        yellowCards: player.careerStats?.yellowCards || 0,
        redCards: player.careerStats?.redCards || 0,
        cardRate: ((player.careerStats?.yellowCards || 0) + (player.careerStats?.redCards || 0) * 3) / 
                  Math.max(player.careerStats?.appearances || 1, 1)
      }))
      .sort((a, b) => a.cardRate - b.cardRate)
      .slice(0, 10);

    // Most own goals (for transparency)
    const mostOwnGoals = allPlayers
      .filter(player => player.careerStats?.ownGoals > 0)
      .sort((a, b) => (b.careerStats?.ownGoals || 0) - (a.careerStats?.ownGoals || 0))
      .slice(0, 5)
      .map(player => ({
        _id: player._id,
        name: player.name,
        team: player.currentTeam,
        ownGoals: player.careerStats?.ownGoals || 0,
        goals: player.careerStats?.goals || 0
      }));

    const stats = {
      // Enhanced breakdown
      playerStats: {
        goals: enhancedStats.totalGoals,
        ownGoals: enhancedStats.totalOwnGoals,
        assists: enhancedStats.totalAssists,
        appearances: enhancedStats.totalAppearances,
        yellowCards: enhancedStats.totalYellowCards,
        redCards: enhancedStats.totalRedCards
      },
      
      // Match totals
      matchStats: {
        totalGoals: matchTotals.totalMatchGoals,
        regularGoals: matchTotals.regularGoals,
        ownGoals: matchTotals.ownGoalsFromMatches,
        yellowCards: matchTotals.yellowCardsFromMatches,
        redCards: matchTotals.redCardsFromMatches
      },
      
      // Reconciliation
      reconciliation: {
        goalsReconciled: enhancedStats.totalGoals === matchTotals.regularGoals,
        ownGoalsReconciled: enhancedStats.totalOwnGoals === matchTotals.ownGoalsFromMatches,
        yellowCardsReconciled: enhancedStats.totalYellowCards === matchTotals.yellowCardsFromMatches,
        redCardsReconciled: enhancedStats.totalRedCards === matchTotals.redCardsFromMatches
      },
      
      // Top performers
      leaderboards: {
        topScorers,
        topAssists,
        mostDisciplined,
        mostOwnGoals
      },
      
      // Explanation
      explanation: {
        playerGoals: "Goals credited to individual players",
        matchGoals: "Total goals from match results (includes own goals)",
        ownGoals: "Goals scored against player's own team",
        totalDifference: matchTotals.totalMatchGoals - enhancedStats.totalGoals
      }
    };

    console.log('📊 Enhanced Stats Breakdown:', {
      playerGoals: stats.playerStats.goals,
      playerOwnGoals: stats.playerStats.ownGoals,
      matchTotalGoals: stats.matchStats.totalGoals,
      reconciled: stats.reconciliation
    });

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Enhanced stats API error:', error);
    res.status(500).json({ message: 'Failed to fetch enhanced statistics' });
  }
}
