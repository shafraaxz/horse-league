// FILE: pages/api/matches/live/update.js
// ===========================================
import connectDB from '../../../../lib/mongodb';
import Match from '../../../../models/Match';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { matchId, status, homeScore, awayScore, liveData } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const updateData = {};
    
    if (status) updateData.status = status;
    if (homeScore !== undefined) updateData.homeScore = homeScore;
    if (awayScore !== undefined) updateData.awayScore = awayScore;
    if (liveData) updateData.liveData = { ...match.liveData, ...liveData };

    await Match.findByIdAndUpdate(matchId, updateData);

    return res.status(200).json({ message: 'Match updated successfully' });

  } catch (error) {
    console.error('Update match error:', error);
    return res.status(500).json({ message: 'Failed to update match' });
  }
}