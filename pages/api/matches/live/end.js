// FILE: pages/api/matches/live/end.js
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

    const { matchId, homeScore, awayScore, events } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // End the match
    await Match.findByIdAndUpdate(matchId, {
      status: 'completed',
      homeScore: homeScore || 0,
      awayScore: awayScore || 0,
      liveData: {
        ...match.liveData,
        isLive: false,
        events: events || [],
        endedAt: new Date()
      }
    });

    console.log(`Match ended: ${matchId}, Score: ${homeScore}-${awayScore}`);
    return res.status(200).json({ message: 'Match ended successfully' });

  } catch (error) {
    console.error('End match error:', error);
    return res.status(500).json({ message: 'Failed to end match' });
  }
}
