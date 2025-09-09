import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId } = req.query;
    
    let seasonQuery = {};
    let activeSeason = null;
    
    if (seasonId) {
      seasonQuery.season = seasonId;
      activeSeason = await Season.findById(seasonId);
    } else {
      // Get active season
      activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        seasonQuery.season = activeSeason._id;
      }
    }

    // Base statistics - get counts for the specified season (or active season)
    const [totalTeams, totalPlayers, totalMatches, totalTransfers] = await Promise.all([
      Team.countDocuments(seasonQuery),
      // For players, we need to count players whose currentTeam belongs to teams in this season
      seasonQuery.season ? 
        Team.find({ season: seasonQuery.season }).then(teams => 
          Player.countDocuments({ 
            currentTeam: { $in: teams.map(t => t._id) },
            status: 'active'
          })
        ) : 
        Player.countDocuments({ status: 'active' }),
      Match.countDocuments(seasonQuery),
      Transfer.countDocuments(seasonQuery).catch(() => 0) // Handle if Transfer model doesn't exist
    ]);

    // Calculate total goals from completed matches
    const completedMatches = await Match.find({ 
      ...seasonQuery, 
      status: 'completed',
      homeScore: { $exists: true },
      awayScore: { $exists: true }
    }).select('homeScore awayScore');
    
    const totalGoals = completedMatches.reduce((sum, match) => {
      const homeScore = parseInt(match.homeScore) || 0;
      const awayScore = parseInt(match.awayScore) || 0;
      return sum + homeScore + awayScore;
    }, 0);

    // Additional match statistics
    const [completedMatchCount, liveMatchCount, scheduledMatchCount] = await Promise.all([
      Match.countDocuments({ ...seasonQuery, status: 'completed' }),
      Match.countDocuments({ ...seasonQuery, status: 'live' }),
      Match.countDocuments({ ...seasonQuery, status: 'scheduled' })
    ]);

    // Calculate completion rate
    const matchCompletionRate = totalMatches > 0 ? 
      Math.round((completedMatchCount / totalMatches) * 100) : 0;

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
      
      // Season info
      currentSeason: activeSeason ? {
        id: activeSeason._id,
        name: activeSeason.name,
        isActive: activeSeason.isActive,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate
      } : null
    };

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
}
