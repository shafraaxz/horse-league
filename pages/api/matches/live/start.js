// FILE: pages/api/matches/live/start.js
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

    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status !== 'scheduled') {
      return res.status(400).json({ message: 'Match cannot be started' });
    }

    // Start the match
    await Match.findByIdAndUpdate(matchId, {
      status: 'live',
      liveData: {
        currentMinute: 0,
        events: [],
        isLive: true,
        startedAt: new Date()
      }
    });

    console.log(`Match started: ${matchId}`);
    return res.status(200).json({ message: 'Match started successfully' });

  } catch (error) {
    console.error('Start match error:', error);
    return res.status(500).json({ message: 'Failed to start match' });
  }
}