// ===========================================
// FILE: pages/api/admin/stats.js (FIXED VERSION)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb'; // Fixed import
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Match from '../../../models/Match';
import Season from '../../../models/Season';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await dbConnect();

    // Get current active season
    const activeSeason = await Season.findOne({ isActive: true });
    const seasonId = activeSeason?._id;

    // Gather statistics
    const [
      totalPlayers,
      totalTeams, 
      totalMatches,
      totalTransfers,
      seasonStats
    ] = await Promise.all([
      // Total players across all seasons
      Player.countDocuments({ status: 'active' }),
      
      // Total teams across all seasons
      Team.countDocuments({}),
      
      // Total matches across all seasons
      Match.countDocuments({}),
      
      // Total transfers across all seasons - handle if Transfer model doesn't exist
      Transfer.countDocuments({}).catch(() => 0),
      
      // Season-specific stats (if active season exists)
      seasonId ? getSeasonStats(seasonId) : {}
    ]);

    // Calculate total goals across all completed matches
    const allCompletedMatches = await Match.find({ 
      status: 'completed',
      homeScore: { $exists: true, $ne: null },
      awayScore: { $exists: true, $ne: null }
    }).select('homeScore awayScore');
    
    const totalGoals = allCompletedMatches.reduce((sum, match) => {
      const homeScore = parseInt(match.homeScore) || 0;
      const awayScore = parseInt(match.awayScore) || 0;
      return sum + homeScore + awayScore;
    }, 0);

    const stats = {
      // Overall stats
      totalPlayers,
      totalTeams,
      totalMatches,
      totalGoals,
      totalTransfers,
      
      // Season-specific stats
      ...seasonStats,
      
      // Current active season info
      activeSeason: activeSeason ? {
        id: activeSeason._id,
        name: activeSeason.name,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate,
        isActive: activeSeason.isActive
      } : null
    };

    console.log('Admin stats generated:', stats);

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
}

async function getSeasonStats(seasonId) {
  try {
    const [
      seasonPlayers,
      seasonTeams,
      seasonMatches,
      completedMatches,
      liveMatches,
      scheduledMatches,
      seasonTransfers,
      seasonGoals
    ] = await Promise.all([
      // Players in current season (through their teams)
      Team.find({ season: seasonId }).then(teams => 
        Player.countDocuments({ 
          currentTeam: { $in: teams.map(t => t._id) },
          status: 'active'
        })
      ),
      
      // Teams in current season
      Team.countDocuments({ season: seasonId }),
      
      // Total matches in current season
      Match.countDocuments({ season: seasonId }),
      
      // Completed matches in current season
      Match.countDocuments({ season: seasonId, status: 'completed' }),
      
      // Live matches in current season
      Match.countDocuments({ season: seasonId, status: 'live' }),
      
      // Scheduled matches in current season
      Match.countDocuments({ season: seasonId, status: 'scheduled' }),
      
      // Transfers in current season
      Transfer.countDocuments({ season: seasonId }).catch(() => 0),
      
      // Goals in current season
      Match.find({ 
        season: seasonId, 
        status: 'completed',
        homeScore: { $exists: true, $ne: null },
        awayScore: { $exists: true, $ne: null }
      }).select('homeScore awayScore').then(matches => 
        matches.reduce((sum, match) => {
          const homeScore = parseInt(match.homeScore) || 0;
          const awayScore = parseInt(match.awayScore) || 0;
          return sum + homeScore + awayScore;
        }, 0)
      )
    ]);

    // Calculate additional stats
    const matchCompletionRate = seasonMatches > 0 
      ? Math.round((completedMatches / seasonMatches) * 100) 
      : 0;

    // Calculate average goals per match
    const avgGoalsPerMatch = completedMatches > 0 
      ? Math.round((seasonGoals / completedMatches) * 100) / 100 
      : 0;

    return {
      seasonPlayers,
      seasonTeams,
      seasonMatches,
      completedMatches,
      liveMatches,
      scheduledMatches,
      seasonTransfers,
      seasonGoals,
      matchCompletionRate,
      avgGoalsPerMatch
    };
  } catch (error) {
    console.error('Error fetching season stats:', error);
    return {};
  }
}
