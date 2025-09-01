// ===========================================
// FILE: pages/api/matches/[id].js (FIXED VERSION)
// ===========================================
import connectDB from '../../../lib/mongodb';
import Match from '../../../models/Match';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error('Invalid match ID:', id);
    return res.status(400).json({ message: 'Invalid match ID format' });
  }

  try {
    await connectDB();
    console.log('Fetching match with ID:', id);

    if (req.method === 'GET') {
      const match = await Match.findById(id)
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .populate('season', 'name isActive')
        .lean();

      if (!match) {
        console.error('Match not found:', id);
        return res.status(404).json({ message: 'Match not found' });
      }

      console.log('Match found:', match.homeTeam?.name, 'vs', match.awayTeam?.name);

      // Ensure liveData exists with default structure
      if (!match.liveData) {
        match.liveData = {
          currentMinute: 0,
          events: [],
          isLive: false
        };
      }

      return res.status(200).json(match);
    }

    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Match API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
}