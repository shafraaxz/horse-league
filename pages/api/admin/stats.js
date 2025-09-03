// ===========================================
// FILE: pages/api/admin/stats.js (FIXED TO COUNT PLAYERS CORRECTLY)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Get active season for context
    const activeSeason = await Season.findOne({ isActive: true });
    
    let query = {};
    let playerQuery = {};
    
    // If there's an active season, filter by it
    if (activeSeason) {
      query = { season: activeSeason._id };
      
      // For players, we need to count those in teams from the active season OR free agents
      const teamsInSeason = await Team.find({ season: activeSeason._id }).select('_id');
      const teamIds = teamsInSeason.map(team => team._id);
      
      playerQuery = {
        $or: [
          { currentTeam: { $in: teamIds } }, // Players in teams from this season
          { currentTeam: null } // Free agents (could join teams in this season)
        ]
      };
    }

    console.log('Stats query for season:', activeSeason?.name || 'All seasons');
    console.log('Team query:', query);
    console.log('Player query:', playerQuery);

    // Run all queries in parallel
    const [totalTeams, totalPlayers, totalMatches, totalTransfers] = await Promise.all([
      Team.countDocuments(query),
      Player.countDocuments(playerQuery), // Fixed: Use proper player query
      Match.countDocuments(query),
      Transfer.countDocuments(query)
    ]);

    console.log('Stats results:', {
      totalTeams,
      totalPlayers,
      totalMatches,
      totalTransfers,
      season: activeSeason?.name || 'All'
    });

    res.status(200).json({
      totalTeams,
      totalPlayers,
      totalMatches,
      totalTransfers,
      season: activeSeason ? {
        _id: activeSeason._id,
        name: activeSeason.name
      } : null
    });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
