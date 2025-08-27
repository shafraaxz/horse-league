// pages/api/matches/[id]/live.js - Fixed live match endpoint with proper error handling
import dbConnect from '../../../../lib/mongodb';
import Match from '../../../../models/Match';

const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Only POST requests are supported.' 
    });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Match ID is required' 
    });
  }

  await dbConnect();

  try {
    const { action, data } = req.body;

    console.log('🎮 Live match API called:', {
      matchId: id,
      action,
      data,
      method: req.method
    });

    if (!action) {
      return res.status(400).json({ 
        success: false, 
        message: 'Action is required' 
      });
    }

    // Find the match
    const match = await Match.findById(id)
      .populate('homeTeam', 'name shortName logo')
      .populate('awayTeam', 'name shortName logo')
      .populate('league', 'name');
    
    if (!match) {
      console.error('❌ Match not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Match not found' 
      });
    }

    console.log('📋 Current match state:', {
      status: match.status,
      isLive: match.isLive,
      currentMinute: match.currentMinute,
      homeScore: match.homeScore,
      awayScore: match.awayScore
    });

    // Process different actions
    switch (action) {
      case 'start':
        if (match.status === 'live') {
          return res.status(400).json({ 
            success: false, 
            message: 'Match is already live' 
          });
        }
        
        if (!match.homeTeam || !match.awayTeam) {
          return res.status(400).json({ 
            success: false, 
            message: 'Both teams must be assigned before starting the match' 
          });
        }
        
        match.status = 'live';
        match.isLive = true;
        match.currentMinute = 0;
        match.homeScore = match.homeScore || 0;
        match.awayScore = match.awayScore || 0;
        match.events = match.events || [];
        match.startTime = new Date();
        
        console.log('🎬 Starting match:', match.homeTeam.name, 'vs', match.awayTeam.name);
        break;
        
      case 'goal':
        if (match.status !== 'live') {
          return res.status(400).json({ 
            success: false, 
            message: 'Can only add goals to live matches' 
          });
        }
        
        if (!data || !data.team || typeof data.minute !== 'number') {
          return res.status(400).json({ 
            success: false, 
            message: 'Goal data must include team and minute' 
          });
        }
        
        // Validate minute
        if (data.minute < 0 || data.minute > 120) {
          return res.status(400).json({ 
            success: false, 
            message: 'Minute must be between 0 and 120' 
          });
        }
        
        // Add goal event
        const goalEvent = {
          type: 'goal',
          minute: data.minute,
          team: data.team,
          player: data.player || '',
          description: data.description || '',
          timestamp: new Date()
        };
        
        match.events = match.events || [];
        match.events.push(goalEvent);
        
        // Update score
        if (data.team.toString() === match.homeTeam._id.toString()) {
          match.homeScore = (match.homeScore || 0) + 1;
          console.log('⚽ Goal for', match.homeTeam.name, '- Score:', match.homeScore, '-', match.awayScore);
        } else if (data.team.toString() === match.awayTeam._id.toString()) {
          match.awayScore = (match.awayScore || 0) + 1;
          console.log('⚽ Goal for', match.awayTeam.name, '- Score:', match.homeScore, '-', match.awayScore);
        } else {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid team ID for this match' 
          });
        }
        break;
        
      case 'event':
        if (match.status !== 'live') {
          return res.status(400).json({ 
            success: false, 
            message: 'Can only add events to live matches' 
          });
        }
        
        if (!data || !data.type || !data.team || typeof data.minute !== 'number') {
          return res.status(400).json({ 
            success: false, 
            message: 'Event data must include type, team, and minute' 
          });
        }
        
        // Validate minute
        if (data.minute < 0 || data.minute > 120) {
          return res.status(400).json({ 
            success: false, 
            message: 'Minute must be between 0 and 120' 
          });
        }
        
        // Validate team
        if (data.team.toString() !== match.homeTeam._id.toString() && 
            data.team.toString() !== match.awayTeam._id.toString()) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid team ID for this match' 
          });
        }
        
        // Add general event
        const event = {
          type: data.type,
          minute: data.minute,
          team: data.team,
          player: data.player || '',
          description: data.description || '',
          timestamp: new Date()
        };
        
        match.events = match.events || [];
        match.events.push(event);
        
        // Update score for penalty goals
        if (data.type === 'penalty') {
          if (data.team.toString() === match.homeTeam._id.toString()) {
            match.homeScore = (match.homeScore || 0) + 1;
          } else if (data.team.toString() === match.awayTeam._id.toString()) {
            match.awayScore = (match.awayScore || 0) + 1;
          }
        }
        
        console.log('📝 Event added:', data.type, 'at minute', data.minute);
        break;
        
      case 'updateMinute':
        if (!data || typeof data.minute !== 'number') {
          return res.status(400).json({ 
            success: false, 
            message: 'Minute data is required' 
          });
        }
        
        match.currentMinute = Math.min(Math.max(data.minute, 0), 120);
        console.log('⏰ Minute updated to:', match.currentMinute);
        break;
        
      case 'end':
        if (match.status !== 'live') {
          return res.status(400).json({ 
            success: false, 
            message: 'Only live matches can be ended' 
          });
        }
        
        match.status = 'completed';
        match.isLive = false;
        match.endTime = new Date();
        
        // Set final minute if not provided
        if (data && typeof data.finalMinute === 'number') {
          match.currentMinute = data.finalMinute;
        } else {
          match.currentMinute = Math.max(match.currentMinute || 90, 90);
        }
        
        // Set final scores if provided
        if (data && data.finalScore) {
          match.homeScore = data.finalScore.home || match.homeScore || 0;
          match.awayScore = data.finalScore.away || match.awayScore || 0;
        }
        
        console.log('🏁 Match ended:', match.homeTeam.name, match.homeScore, '-', match.awayScore, match.awayTeam.name);
        break;
        
      case 'pause':
        if (match.status !== 'live') {
          return res.status(400).json({ 
            success: false, 
            message: 'Only live matches can be paused' 
          });
        }
        
        match.isPaused = true;
        console.log('⏸️ Match paused');
        break;
        
      case 'resume':
        if (match.status !== 'live') {
          return res.status(400).json({ 
            success: false, 
            message: 'Only live matches can be resumed' 
          });
        }
        
        match.isPaused = false;
        console.log('▶️ Match resumed');
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          message: `Invalid action: ${action}. Supported actions: start, goal, event, updateMinute, end, pause, resume` 
        });
    }

    // Save the match
    const updatedMatch = await match.save();
    
    // Populate the response
    await updatedMatch.populate([
      { path: 'homeTeam', select: 'name shortName logo' },
      { path: 'awayTeam', select: 'name shortName logo' },
      { path: 'league', select: 'name' }
    ]);

    console.log('✅ Match updated successfully:', action);
    console.log('📊 Updated match state:', {
      status: updatedMatch.status,
      isLive: updatedMatch.isLive,
      currentMinute: updatedMatch.currentMinute,
      homeScore: updatedMatch.homeScore,
      awayScore: updatedMatch.awayScore,
      eventsCount: updatedMatch.events?.length || 0
    });
    
    res.status(200).json({ 
      success: true, 
      data: updatedMatch,
      message: `Match ${action} successful`
    });
    
  } catch (error) {
    console.error('❌ Error in live match endpoint:', error);
    
    // Handle specific mongoose errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid match ID format' 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate data error' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

export default handler;