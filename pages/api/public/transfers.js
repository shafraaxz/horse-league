// FILE: pages/api/public/transfers.js (Updated to support teamId filter)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { limit = 20, seasonId, teamId } = req.query;
    
    let query = {};
    if (seasonId) query.season = seasonId;
    if (teamId) {
      query.$or = [
        { fromTeam: teamId },
        { toTeam: teamId }
      ];
    }
    
    const transfers = await Transfer.find(query)
      .populate('player', 'firstName lastName position')
      .populate('fromTeam', 'name logo')
      .populate('toTeam', 'name logo')
      .populate('season', 'name')
      .sort({ transferDate: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json(transfers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}