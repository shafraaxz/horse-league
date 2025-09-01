// FILE: pages/api/public/matches.js (Updated to support teamId filter)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { status, limit, seasonId, teamId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (seasonId) query.season = seasonId;
    if (teamId) {
      query.$or = [
        { homeTeam: teamId },
        { awayTeam: teamId }
      ];
    }
    
    let matchQuery = Match.find(query)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('season', 'name')
      .sort({ matchDate: status === 'live' ? -1 : -1 }); // Most recent first for team profile
    
    if (limit) {
      matchQuery = matchQuery.limit(parseInt(limit));
    }
    
    const matches = await matchQuery;
    
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}