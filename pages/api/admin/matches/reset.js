// ===========================================
// FILE: pages/api/matches/live/reset.js (UPDATED)
// Reset match to initial state
// ===========================================
import dbConnect from '../../../../lib/mongodb';
import Match from '../../../../models/Match';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    console.log(`Resetting match: ${matchId}`);

    // Reset match to initial state
    const resetData = {
      status: 'scheduled',
      homeScore: 0,
      awayScore: 0,
      events: [],
      statsUpdated: false,
      liveData: {
        isLive: false,
        currentMinute: 0,
        lastUpdate: new Date(),
        startTime: null,
        endTime: null,
        pausedAt: null,
        resumedAt: null
      }
    };

    const match = await Match.findByIdAndUpdate(
      matchId,
      resetData,
      { new: true, runValidators: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('season', 'name');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    console.log(`Match reset successful: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    return res.status(200).json({ 
      message: 'Match reset successfully', 
      match 
    });

  } catch (error) {
    console.error('Match reset error:', error);
    return res.status(500).json({ 
      message: 'Failed to reset match',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}