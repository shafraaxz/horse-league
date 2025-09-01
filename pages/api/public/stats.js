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

    const [totalTeams, totalPlayers, totalMatches, totalTransfers] = await Promise.all([
      Team.countDocuments(query),
      Player.countDocuments(query),
      Match.countDocuments(query),
      Transfer.countDocuments(query)
    ]);

    // Calculate total goals
    const matches = await Match.find({ ...query, status: 'completed' });
    const totalGoals = matches.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);

    res.status(200).json({
      totalTeams,
      totalPlayers,
      totalMatches,
      totalGoals,
      totalTransfers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
