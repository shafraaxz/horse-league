// pages/api/stats/overview.js - Homepage Statistics API
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import League from '../../../models/League';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  try {
    // Get main league
    const league = await League.findOne({ 
      $or: [
        { isDefault: true }, 
        { slug: 'the-horse-futsal-league' }
      ],
      isActive: true 
    });

    if (!league) {
      return res.status(200).json({
        success: true,
        data: {
          totalTeams: 0,
          totalPlayers: 0,
          totalMatches: 0,
          totalGoals: 0,
          completedMatches: 0
        }
      });
    }

    // Get statistics in parallel
    const [
      totalTeams,
      totalPlayers, 
      totalMatches,
      completedMatches,
      matchStats
    ] = await Promise.all([
      Team.countDocuments({ league: league._id, isActive: true }),
      Player.countDocuments({ league: league._id, isActive: true }),
      Match.countDocuments({ league: league._id }),
      Match.countDocuments({ league: league._id, status: 'completed' }),
      Match.aggregate([
        { 
          $match: { 
            league: league._id, 
            status: 'completed',
            homeScore: { $exists: true },
            awayScore: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            totalGoals: { 
              $sum: { 
                $add: [
                  { $ifNull: ['$homeScore', 0] }, 
                  { $ifNull: ['$awayScore', 0] }
                ]
              }
            }
          }
        }
      ])
    ]);

    const stats = {
      totalTeams: totalTeams || 0,
      totalPlayers: totalPlayers || 0,
      totalMatches: totalMatches || 0,
      completedMatches: completedMatches || 0,
      totalGoals: matchStats.length > 0 ? matchStats[0].totalGoals : 0,
      league: {
        name: league.name,
        currentSeason: league.currentSeason
      }
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
}