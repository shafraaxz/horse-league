import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Season from '../../../models/Season';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { teamId, seasonId, limit } = req.query;
    
    let query = {};
    if (teamId) query.currentTeam = teamId;
    if (seasonId) {
      query.season = seasonId;
    } else {
      // Get active season by default
      const activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        query.season = activeSeason._id;
      }
    }
    
    let playerQuery = Player.find(query)
      .populate('currentTeam', 'name logo')
      .populate('season', 'name')
      .sort({ lastName: 1 });
    
    if (limit) {
      playerQuery = playerQuery.limit(parseInt(limit));
    }
    
    const players = await playerQuery;
    
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
