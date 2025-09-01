import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Season from '../../../models/Season';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId } = req.query;
    
    let query = {};
    if (seasonId) {
      query.season = seasonId;
    } else {
      // Get active season by default
      const activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        query.season = activeSeason._id;
      }
    }
    
    const teams = await Team.find(query)
      .populate('season', 'name isActive')
      .sort({ name: 1 });

    // Get player count for each team
    const teamsWithPlayerCount = await Promise.all(
      teams.map(async (team) => {
        const playerCount = await Player.countDocuments({ 
          currentTeam: team._id, 
          season: team.season 
        });
        
        return {
          ...team.toObject(),
          playerCount
        };
      })
    );
    
    res.status(200).json(teamsWithPlayerCount);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
