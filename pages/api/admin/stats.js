// ===========================================
// FILE: pages/api/admin/stats.js (NEW - Admin Statistics API)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Match from '../../../models/Match';
import Season from '../../../models/Season';
import Transfer from '../../../models/Transfer';
import FairPlay from '../../../models/FairPlay';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await connectToDatabase();

    // Get current active season
    const activeSeason = await Season.findOne({ isActive: true });
    const seasonId = activeSeason?._id;

    // Gather statistics
    const [
      totalPlayers,
      totalTeams, 
      totalMatches,
      totalTransfers,
      totalFairPlayRecords,
      seasonStats
    ] = await Promise.all([
      // Total players across all seasons
      Player.countDocuments({}),
      
      // Total teams across all seasons
      Team.countDocuments({}),
      
      // Total matches across all seasons
      Match.countDocuments({}),
      
      // Total transfers across all seasons
      Transfer.countDocuments({}).catch(() => 0), // Handle if Transfer model doesn't exist
      
      // Total fair play records
      FairPlay.countDocuments({}).catch(() => 0), // Handle if FairPlay model doesn't exist
      
      // Season-specific stats (if active season exists)
      seasonId ? await getSeasonStats(seasonId) : {}
    ]);

    const stats = {
      // Overall stats
      totalPlayers,
      totalTeams,
      totalMatches,
      totalTransfers,
      totalFairPlayRecords,
      
      // Season-specific stats
      ...seasonStats,
      
      // Current active season info
      activeSeason: activeSeason ? {
        id: activeSeason._id,
        name: activeSeason.name,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate
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
      seasonFairPlayRecords
    ] = await Promise.all([
      // Players in current season (through their teams)
      Team.find({ season: seasonId }).then(teams => 
        Player.countDocuments({ 
          currentTeam: { $in: teams.map(t => t._id) } 
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
      
      // Fair play records in current season
      FairPlayRecord.countDocuments({ season: seasonId }).catch(() => 0)
    ]);

    // Calculate additional stats
    const matchCompletionRate = seasonMatches > 0 
      ? Math.round((completedMatches / seasonMatches) * 100) 
      : 0;

    return {
      seasonPlayers,
      seasonTeams,
      seasonMatches,
      completedMatches,
      liveMatches,
      scheduledMatches,
      seasonTransfers,
      seasonFairPlayRecords,
      matchCompletionRate
    };
  } catch (error) {
    console.error('Error fetching season stats:', error);
    return {};
  }
}
