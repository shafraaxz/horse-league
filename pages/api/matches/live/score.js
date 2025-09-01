// ===========================================
// FILE: pages/api/matches/live/score.js (FIXED - Matches Your Model)
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

    const { matchId, homeScore, awayScore, currentMinute, event } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    console.log(`Updating score: Match ${matchId} - ${homeScore}:${awayScore} (${currentMinute}')`);

    // Get current match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Prepare update data
    const updateData = {
      homeScore: parseInt(homeScore) || 0,
      awayScore: parseInt(awayScore) || 0,
      'liveData.lastUpdate': new Date()
    };

    // Update current minute if provided
    if (typeof currentMinute === 'number' && currentMinute >= 0) {
      updateData['liveData.currentMinute'] = currentMinute;
    }

    // Add event if provided
    if (event && event.type) {
      const eventData = {
        id: match.events.length + 1,
        type: event.type,
        team: event.team || 'home',
        minute: currentMinute || match.liveData?.currentMinute || 0,
        player: event.player || null,
        description: event.description || `${event.type} event`,
        timestamp: new Date()
      };

      updateData.$push = { events: eventData };
      console.log(`Adding event:`, eventData);
    }

    // Update the match
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      updateData,
      { new: true, runValidators: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('season', 'name');

    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found after update' });
    }

    console.log(`Score updated successfully: ${updatedMatch.homeTeam.name} ${homeScore}-${awayScore} ${updatedMatch.awayTeam.name}`);

    return res.status(200).json({ 
      message: 'Score updated successfully', 
      match: updatedMatch,
      currentScore: `${homeScore}-${awayScore}`,
      minute: currentMinute || updatedMatch.liveData?.currentMinute || 0
    });

  } catch (error) {
    console.error('Score update error:', error);
    return res.status(500).json({ 
      message: 'Failed to update score',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}