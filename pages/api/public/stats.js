// FILE: pages/api/public/stats.js - FIXED VERSION
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Match from '../../../models/Match';
import Season from '../../../models/Season';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  try {
    await dbConnect();

    // Get query parameters
    const { teamId, seasonId } = req.query;

    // Get current active season if no season specified
    let activeSeason = null;
    if (!seasonId) {
      activeSeason = await Season.findOne({ isActive: true });
    } else {
      activeSeason = await Season.findById(seasonId);
    }

    console.log('Public stats API called with:', { teamId, seasonId, activeSeason: activeSeason?.name });

    // Build query filters
    let playerQuery = { status: 'active' };
    let matchQuery = { status: { $in: ['completed', 'live', 'scheduled'] } };
    
    // Apply team filter
    if (teamId && teamId !== 'free-agents') {
      playerQuery.currentTeam = teamId;
      // For matches, we want to include matches where this team participated
      matchQuery.$or = [
        { homeTeam: teamId },
        { awayTeam: teamId }
      ];
    } else if (teamId === 'free-agents') {
      playerQuery.currentTeam = { $exists: false };
      // Free agents don't have matches
      matchQuery = { _id: { $exists: false } }; // This will return no matches
    }
    
    // Apply season filter
    if (seasonId) {
      if (teamId !== 'free-agents') {
        matchQuery.season = seasonId;
      }
      // For players, season filtering is more complex due to contract history
    }

    console.log('Queries built:', { playerQuery, matchQuery });

    // Parallel execution of database queries
    const [
      totalTeams,
      totalPlayers,
      allMatches,
      allPlayers,
      totalTransfers
    ] = await Promise.all([
      // Teams count
      teamId ? (teamId === 'free-agents' ? 0 : 1) : Team.countDocuments({}),
      
      // Players count with filters
      Player.countDocuments(playerQuery),
      
      // Matches with filters
      Match.find(matchQuery).lean(),
      
      // All players for goal calculation (with same filters)
      Player.find(playerQuery).lean(),
      
      // Transfers count
      Transfer.countDocuments({}).catch(() => 0)
    ]);

    // Calculate match statistics
    const totalMatches = allMatches.length;
    const completedMatches = allMatches.filter(m => m.status === 'completed');
    const liveMatches = allMatches.filter(m => m.status === 'live');
    const scheduledMatches = allMatches.filter(m => m.status === 'scheduled');
    const completedMatchCount = completedMatches.length;
    const liveMatchCount = liveMatches.length;
    const scheduledMatchCount = scheduledMatches.length;

    // Calculate total goals - FIXED VERSION
    // Use player stats for accurate goal counting, with fallback normalization
    const totalGoals = allPlayers.reduce((sum, player) => {
      // Use the same normalization logic as the frontend
      const goals = player.careerStats?.goals || player.stats?.goals || 0;
      return sum + goals;
    }, 0);

    console.log('Goal calculation details:', {
      totalPlayers: allPlayers.length,
      totalGoals,
      samplePlayerStats: allPlayers.slice(0, 3).map(p => ({
        name: p.name,
        careerGoals: p.careerStats?.goals,
        statsGoals: p.stats?.goals,
        normalizedGoals: p.careerStats?.goals || p.stats?.goals || 0
      }))
    });

    // Calculate match completion rate
    const matchCompletionRate = totalMatches > 0 
      ? Math.round((completedMatchCount / totalMatches) * 100) 
      : 0;

    // Calculate average goals per match
    const avgGoalsPerMatch = completedMatchCount > 0 
      ? Math.round((totalGoals / completedMatchCount) * 10) / 10 
      : 0;

    const stats = {
      // Basic counts
      totalTeams,
      totalPlayers,
      totalMatches,
      totalGoals,
      totalTransfers,
      
      // Match breakdown
      completedMatches: completedMatchCount,
      liveMatches: liveMatchCount,
      scheduledMatches: scheduledMatchCount,
      matchCompletionRate,
      avgGoalsPerMatch,
      
      // Filter context
      filters: {
        teamId: teamId || null,
        seasonId: seasonId || null,
        teamName: teamId ? (teamId === 'free-agents' ? 'Free Agents' : 'Selected Team') : null,
        seasonName: activeSeason?.name || null
      },
      
      // Season info
      currentSeason: activeSeason ? {
        id: activeSeason._id,
        name: activeSeason.name,
        isActive: activeSeason.isActive,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate
      } : null
    };

    console.log('Final stats result:', {
      totalPlayers: stats.totalPlayers,
      totalGoals: stats.totalGoals,
      filters: stats.filters
    });

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
