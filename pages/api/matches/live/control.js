// ===========================================
// FILE: pages/api/matches/live/control.js (WITH AUTO STATS UPDATE)
// ===========================================
import dbConnect from '../../../../lib/mongodb';
import Match from '../../../../models/Match';
import Team from '../../../../models/Team';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

// Helper function to update team statistics when match is completed
async function updateTeamStatsFromMatch(match) {
  if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) {
    return; // Only update completed matches with scores
  }
  
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  
  // Determine results
  let homeResult, awayResult, homePoints, awayPoints;
  
  if (homeScore > awayScore) {
    homeResult = 'win';
    awayResult = 'loss';
    homePoints = 3;
    awayPoints = 0;
  } else if (homeScore < awayScore) {
    homeResult = 'loss';
    awayResult = 'win';
    homePoints = 0;
    awayPoints = 3;
  } else {
    homeResult = 'draw';
    awayResult = 'draw';
    homePoints = 1;
    awayPoints = 1;
  }
  
  // Get current teams
  const homeTeam = await Team.findById(match.homeTeam._id || match.homeTeam);
  const awayTeam = await Team.findById(match.awayTeam._id || match.awayTeam);
  
  if (!homeTeam || !awayTeam) {
    console.error('Teams not found for stats update');
    return;
  }
  
  // Initialize stats if they don't exist
  const homeStats = homeTeam.stats || {
    matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, points: 0
  };
  
  const awayStats = awayTeam.stats || {
    matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, points: 0
  };
  
  // Check if this match was already counted (prevent double counting)
  const wasAlreadyCounted = match.statsUpdated;
  
  if (!wasAlreadyCounted) {
    // Update home team stats
    await Team.findByIdAndUpdate(match.homeTeam._id || match.homeTeam, {
      stats: {
        matchesPlayed: homeStats.matchesPlayed + 1,
        wins: homeStats.wins + (homeResult === 'win' ? 1 : 0),
        draws: homeStats.draws + (homeResult === 'draw' ? 1 : 0),
        losses: homeStats.losses + (homeResult === 'loss' ? 1 : 0),
        goalsFor: homeStats.goalsFor + homeScore,
        goalsAgainst: homeStats.goalsAgainst + awayScore,
        points: homeStats.points + homePoints
      }
    });
    
    // Update away team stats
    await Team.findByIdAndUpdate(match.awayTeam._id || match.awayTeam, {
      stats: {
        matchesPlayed: awayStats.matchesPlayed + 1,
        wins: awayStats.wins + (awayResult === 'win' ? 1 : 0),
        draws: awayStats.draws + (awayResult === 'draw' ? 1 : 0),
        losses: awayStats.losses + (awayResult === 'loss' ? 1 : 0),
        goalsFor: awayStats.goalsFor + awayScore,
        goalsAgainst: awayStats.goalsAgainst + homeScore,
        points: awayStats.points + awayPoints
      }
    });
    
    // Mark match as stats updated
    await Match.findByIdAndUpdate(match._id, { statsUpdated: true });
    
    console.log(`✅ Stats updated: ${homeTeam.name} ${homeScore}-${awayScore} ${awayTeam.name}`);
  }
}

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

    console.log('Live match control request:', { matchId, action, currentMinute });

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
        updateData['liveData.startedAt'] = new Date();
        if (typeof currentMinute !== 'number') {
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
        updateData['liveData.endedAt'] = new Date();
        if (typeof currentMinute !== 'number') {
          updateData['liveData.currentMinute'] = 90;
        }
        break;
    }

    console.log('Update data:', updateData);

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

    // AUTO-UPDATE TEAM STATS when match is stopped/completed
    if (action === 'stop' && updateData.status === 'completed') {
      try {
        console.log('🔄 Auto-updating team stats for completed match...');
        await updateTeamStatsFromMatch(match);
        console.log('✅ Team stats updated successfully');
      } catch (statsError) {
        console.error('❌ Failed to update team stats:', statsError);
        // Don't fail the match completion if stats update fails
      }
    }

    console.log(`Match ${action} successful: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    console.log('Updated match status:', match.status);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: `Match ${action} successful`,
      match,
      liveData: match.liveData,
      status: match.status,
      statsUpdated: action === 'stop' ? true : undefined
    });

  } catch (error) {
    console.error(`Live match control error (${req.body?.action}):`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to control live match',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
