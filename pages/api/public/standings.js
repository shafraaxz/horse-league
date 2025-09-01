import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Season from '../../../models/Season';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId, limit } = req.query;
    
    let query = {};
    if (seasonId) {
      query.season = seasonId;
    } else {
      // Get active season
      const activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        query.season = activeSeason._id;
      }
    }
    
    let teamQuery = Team.find(query)
      .populate('season', 'name')
      .sort({ 
        'stats.points': -1, 
        'stats.wins': -1,
        'stats.goalsFor': -1 
      });
    
    if (limit) {
      teamQuery = teamQuery.limit(parseInt(limit));
    }
    
    const teams = await teamQuery;
    
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
