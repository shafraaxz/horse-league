// FILE: pages/api/public/stats.js - ENHANCED VERSION
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { teamId, seasonId } = req.query;
    
    // Build queries based on filters
    const playerQuery = {};
    const matchQuery = {};
    
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        playerQuery.currentTeam = null;
      } else {
        playerQuery.currentTeam = teamId;
      }
    }
    
    if (seasonId && seasonId !== 'all') {
      matchQuery.season = seasonId;
      // For players, we need to filter by teams in that season
      if (!teamId || teamId === 'all') {
        const teams = await Team.find({ season: seasonId }).select('_id');
        const teamIds = teams.map(team => team._id);
        playerQuery.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null }
        ];
      }
    }

    // Get active season for context
    const activeSeason = await Team.findOne({})
      .populate('season')
      .then(team => team?.season?.isActive ? team.season : null);

    // Fetch all data in parallel
    const [
      totalTeams,
      totalPlayers,
      allMatches,
      allPlayers,
      totalTransfers
    ] = await Promise.all([
      // Teams count with filters
      teamId && teamId !== 'all' 
        ? (teamId === 'free-agents' ? 0 : 1) 
        : Team.countDocuments({}),
      
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

    // FIXED: Calculate total goals using ONLY careerStats for consistency
    const totalGoals = allPlayers.reduce((sum, player) => {
      return sum + (player.careerStats?.goals || 0);
    }, 0);

    console.log('Goal calculation details (FIXED):', {
      totalPlayers: allPlayers.length,
      totalGoals,
      samplePlayerStats: allPlayers.slice(0, 3).map(p => ({
        name: p.name,
        careerGoals: p.careerStats?.goals || 0
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
        _id: activeSeason._id,
        name: activeSeason.name,
        isActive: activeSeason.isActive,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate
      } : null
    };

    console.log('📊 Stats API Response (FIXED):', {
      totalGoals: stats.totalGoals,
      totalPlayers: stats.totalPlayers,
      avgGoalsPerMatch: stats.avgGoalsPerMatch,
      filters: stats.filters
    });

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Stats API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
