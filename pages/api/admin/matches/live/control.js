// ===========================================
// FILE: pages/api/matches/live/control.js
// Live match control API - Start/Stop/Pause matches
// This replaces the existing live.js file
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

    const { matchId, action, currentMinute } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    if (!['start', 'pause', 'stop', 'resume'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use: start, pause, stop, or resume' });
    }

    console.log(`Live match control: ${action} for match ${matchId}`);

    // Prepare update data based on action
    let updateData = {
      'liveData.lastUpdate': new Date()
    };

    // Update current minute if provided
    if (typeof currentMinute === 'number' && currentMinute >= 0) {
      updateData['liveData.currentMinute'] = currentMinute;
    }

    switch (action) {
      case 'start':
        updateData.status = 'live';
        updateData['liveData.isLive'] = true;
        updateData['liveData.startTime'] = new Date();
        if (!updateData['liveData.currentMinute']) {
          updateData['liveData.currentMinute'] = 0;
        }
        break;
        
      case 'pause':
        updateData['liveData.isLive'] = false;
        updateData['liveData.pausedAt'] = new Date();
        break;
        
      case 'resume':
        updateData['liveData.isLive'] = true;
        updateData['liveData.resumedAt'] = new Date();
        break;
        
      case 'stop':
        updateData.status = 'completed';
        updateData['liveData.isLive'] = false;
        updateData['liveData.endTime'] = new Date();
        if (!updateData['liveData.currentMinute']) {
          updateData['liveData.currentMinute'] = 90; // Default full time
        }
        break;
    }

    // Update the match
    const match = await Match.findByIdAndUpdate(
      matchId,
      updateData,
      { new: true, runValidators: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('season', 'name');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    console.log(`Match ${action} successful: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    
    // Return success response
    return res.status(200).json({
      message: `Match ${action} successful`,
      match,
      liveData: match.liveData
    });

  } catch (error) {
    console.error(`Live match control error (${req.body?.action}):`, error);
    return res.status(500).json({ 
      message: 'Failed to control live match',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}