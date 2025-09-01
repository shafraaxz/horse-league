// FILE: pages/api/matches/live/pause.js
// ===========================================
import connectDB from '../../../../lib/mongodb';
import Match from '../../../../models/Match';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { matchId } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Update live data to paused
    await Match.findByIdAndUpdate(matchId, {
      'liveData.isLive': false,
      'liveData.pausedAt': new Date()
    });

    return res.status(200).json({ message: 'Match paused successfully' });

  } catch (error) {
    console.error('Pause match error:', error);
    return res.status(500).json({ message: 'Failed to pause match' });
  }
}
