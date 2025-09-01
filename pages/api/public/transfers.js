// ===========================================
// FILE: pages/api/public/transfers.js (NEW - MISSING API)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';
import Team from '../../../models/Team';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId, limit = 20, teamId } = req.query;
    
    let query = {};
    
    // Filter by season
    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    }
    
    // Filter by team (either from or to)
    if (teamId && teamId !== 'all') {
      query.$or = [
        { fromTeam: teamId },
        { toTeam: teamId }
      ];
    }

    const transfers = await Transfer.find(query)
      .populate('player', 'name photo position')
      .populate('fromTeam', 'name logo')
      .populate('toTeam', 'name logo')
      .populate('season', 'name')
      .sort({ transferDate: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`Public transfers API: Found ${transfers.length} transfers`);
    
    res.status(200).json(transfers || []);
  } catch (error) {
    console.error('Public transfers API error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
