// pages/api/activity/stats.js - Activity Statistics API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import League from '../../../models/League';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  const { method } = req;

  console.log(`📈 Activity Stats API: ${method} /api/activity/stats`);

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }

  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    const { period = '7' } = req.query; // days
    const days = parseInt(period);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    console.log(`📈 Calculating activity stats for last ${days} days`);

    // Calculate statistics in parallel
    const [
      totalPlayers,
      totalTeams,
      totalLeagues,
      totalTransfers,
      recentPlayers,
      recentTeams,
      recentLeagues,
      recentTransfers,
      playersByPosition,
      transfersByType
    ] = await Promise.all([
      // Total counts
      Player.countDocuments({ isActive: true }),
      Team.countDocuments({ isActive: true }),
      League.countDocuments({ isActive: true }),
      Transfer.countDocuments({ status: 'completed' }),

      // Recent activity
      Player.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: fromDate } 
      }),
      Team.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: fromDate } 
      }),
      League.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: fromDate } 
      }),
      Transfer.countDocuments({ 
        status: 'completed',
        transferDate: { $gte: fromDate } 
      }),

      // Breakdowns
      Player.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$position', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Transfer.aggregate([
        { 
          $match: { 
            status: 'completed',
            transferDate: { $gte: fromDate }
          } 
        },
        { $group: { _id: '$transferType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Calculate growth rates
    const calculateGrowthRate = (recent, total) => {
      if (total === 0) return 0;
      return Math.round((recent / total) * 100 * 10) / 10;
    };

    const stats = {
      overview: {
        totalPlayers,
        totalTeams,
        totalLeagues,
        totalTransfers,
        period: `${days} days`
      },
      recentActivity: {
        newPlayers: recentPlayers,
        newTeams: recentTeams,
        newLeagues: recentLeagues,
        newTransfers: recentTransfers,
        period: `${days} days`
      },
      growthRates: {
        players: calculateGrowthRate(recentPlayers, totalPlayers),
        teams: calculateGrowthRate(recentTeams, totalTeams),
        leagues: calculateGrowthRate(recentLeagues, totalLeagues),
        transfers: calculateGrowthRate(recentTransfers, totalTransfers)
      },
      breakdowns: {
        playersByPosition: playersByPosition.reduce((acc, item) => {
          acc[item._id || 'Unknown'] = item.count;
          return acc;
        }, {}),
        transfersByType: transfersByType.reduce((acc, item) => {
          acc[item._id || 'Unknown'] = item.count;
          return acc;
        }, {})
      },
      marketActivity: {
        availablePlayers: await Player.countDocuments({
          isActive: true,
          $and: [
            { $or: [{ team: null }, { team: { $exists: false } }] },
            { $or: [{ currentTeam: null }, { currentTeam: { $exists: false } }] }
          ]
        }),
        assignedPlayers: await Player.countDocuments({
          isActive: true,
          $or: [
            { team: { $exists: true, $ne: null } },
            { currentTeam: { $exists: true, $ne: null } }
          ]
        })
      }
    };

    console.log(`✅ Activity stats calculated successfully`);

    return res.status(200).json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error calculating activity stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate activity statistics',
      error: error.message
    });
  }
}