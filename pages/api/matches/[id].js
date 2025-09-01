// FILE: pages/api/matches/[id].js
// ===========================================
import connectDB from '../../../lib/mongodb';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === 'GET') {
      const match = await Match.findById(id)
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .populate('season', 'name')
        .lean();

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      return res.status(200).json(match);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Match API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}