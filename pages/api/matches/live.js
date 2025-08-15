// pages/api/matches/live.js - Enhanced Live Match API
import connectDB from '../../../lib/mongodb';
import { Match, Player, Team } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'POST':
        return handleLiveAction(req, res);
      case 'PUT':
        return updateLiveMatch(req, res);
      case 'GET':
        return getLiveMatches(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Live matches API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function getLiveMatches(req, res) {
  try {
    const { leagueId } = req.query;
    
    let filter = { status: { $in: ['live', 'halftime'] } };
    if (leagueId) filter.league = leagueId;

    const liveMatches = await Match.find(filter)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('events.player', 'name number')
      .sort({ updatedAt: -1 });

    res.status(200).json(liveMatches);
  } catch (error) {
    console.error('Get live matches error:', error);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
}

async function handleLiveAction(req, res) {
  try {
    const { action, matchId, data } = req.body;

    console.log('🔴 Live action received:', { action, matchId, data });

    if (!action || !matchId) {
      return res.status(400).json({ error: 'Action and match ID are required' });
    }

    const match = await Match.findById(matchId)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    let updatedMatch;

    switch (action) {
      case 'start_match':
        updatedMatch = await startMatch(match);
        break;
      case 'end_match':
        updatedMatch = await endMatch(match);
        break;
      case 'update_score':
        updatedMatch = await updateScore(match, data);
        break;
      case 'add_event':
        updatedMatch = await addEvent(match, data);
        break;
      case 'update_time':
        updatedMatch = await updateMatchTime(match, data);
        break;
      case 'halftime':
        updatedMatch = await setHalftime(match);
        break;
      case 'second_half':
        updatedMatch = await startSecondHalf(match);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({
      success: true,
      message: `Match ${action} successful`,
      match: updatedMatch
    });
  } catch (error) {
    console.error('Live action error:', error);
    res.status(500).json({ 
      error: 'Failed to perform live action',
      details: error.message 
    });
  }
}

// ✅ NEW: Complete live match update
async function updateLiveMatch(req, res) {
  try {
    const { matchId, score, liveData, status, events } = req.body;

    console.log('🔄 Updating live match:', matchId);

    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Build update data
    const updateData = {};
    if (score !== undefined) updateData.score = score;
    if (liveData !== undefined) updateData.liveData = liveData;
    if (status !== undefined) updateData.status = status;
    if (events !== undefined) updateData.events = events;

    // Update match
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId, 
      updateData, 
      { new: true }
    ).populate('homeTeam awayTeam', 'name logo')
     .populate('events.player', 'name number');

    // ✅ Update player statistics based on events
    if (events) {
      await updatePlayerStatisticsFromEvents(events, match);
    }

    console.log('✅ Live match updated successfully');

    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      match: updatedMatch
    });
  } catch (error) {
    console.error('Update live match error:', error);
    res.status(500).json({ 
      error: 'Failed to update live match',
      details: error.message 
    });
  }
}

async function startMatch(match) {
  try {
    const kickoffEvent = {
      type: 'kickoff',
      minute: 0,
      team: match.homeTeam._id,
      description: 'Match started',
      timestamp: new Date()
    };

    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      {
        status: 'live',
        'liveData.isLive': true,
        'liveData.period': 'first_half',
        'liveData.currentMinute': 0,
        $push: { events: kickoffEvent }
      },
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    console.log('✅ Match started successfully:', updatedMatch._id);
    return updatedMatch;
  } catch (error) {
    console.error('Start match error:', error);
    throw new Error('Failed to start match');
  }
}

async function endMatch(match) {
  try {
    const fullTimeEvent = {
      type: 'fulltime',
      minute: match.liveData.currentMinute || 90,
      description: 'Full time',
      timestamp: new Date()
    };

    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      {
        status: 'finished',
        'liveData.isLive': false,
        'liveData.period': 'finished',
        $push: { events: fullTimeEvent }
      },
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    // ✅ Update final player statistics
    await updateFinalPlayerStats(match);

    console.log('✅ Match ended successfully:', updatedMatch._id);
    return updatedMatch;
  } catch (error) {
    console.error('End match error:', error);
    throw new Error('Failed to end match');
  }
}

async function updateScore(match, data) {
  try {
    const { homeScore, awayScore } = data;
    
    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      {
        'score.home': homeScore,
        'score.away': awayScore
      },
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    console.log('✅ Score updated successfully:', { homeScore, awayScore });
    return updatedMatch;
  } catch (error) {
    console.error('Update score error:', error);
    throw new Error('Failed to update score');
  }
}

async function addEvent(match, data) {
  try {
    const { type, minute, playerId, teamId, description } = data;
    
    const event = {
      type,
      minute,
      player: playerId || null,
      team: teamId,
      description,
      timestamp: new Date()
    };

    // If it's a goal, update the score
    let updateData = { $push: { events: event } };
    
    if (type === 'goal' && playerId) {
      const isHomeTeam = teamId.toString() === match.homeTeam._id.toString();
      if (isHomeTeam) {
        updateData['score.home'] = match.score.home + 1;
      } else {
        updateData['score.away'] = match.score.away + 1;
      }

      // ✅ Update player goal statistics immediately
      await Player.findByIdAndUpdate(playerId, {
        $inc: { 'stats.goals': 1 }
      });
    }

    // Update other player stats immediately
    if (playerId) {
      const statUpdates = {};
      switch (type) {
        case 'yellow_card':
          statUpdates['stats.yellowCards'] = 1;
          break;
        case 'red_card':
          statUpdates['stats.redCards'] = 1;
          break;
      }
      
      if (Object.keys(statUpdates).length > 0) {
        await Player.findByIdAndUpdate(playerId, { $inc: statUpdates });
      }
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      updateData,
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    console.log('✅ Event added successfully:', event);
    return updatedMatch;
  } catch (error) {
    console.error('Add event error:', error);
    throw new Error('Failed to add event');
  }
}

async function updateMatchTime(match, data) {
  try {
    const { minute, period } = data;
    
    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      {
        'liveData.currentMinute': minute,
        'liveData.period': period || match.liveData.period
      },
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    console.log('✅ Match time updated successfully:', { minute, period });
    return updatedMatch;
  } catch (error) {
    console.error('Update match time error:', error);
    throw new Error('Failed to update match time');
  }
}

async function setHalftime(match) {
  try {
    const halftimeEvent = {
      type: 'halftime',
      minute: 45,
      description: 'Half time',
      timestamp: new Date()
    };

    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      {
        status: 'halftime',
        'liveData.period': 'halftime',
        'score.halfTime.home': match.score.home,
        'score.halfTime.away': match.score.away,
        $push: { events: halftimeEvent }
      },
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    console.log('✅ Halftime set successfully:', updatedMatch._id);
    return updatedMatch;
  } catch (error) {
    console.error('Set halftime error:', error);
    throw new Error('Failed to set halftime');
  }
}

async function startSecondHalf(match) {
  try {
    const secondHalfEvent = {
      type: 'kickoff',
      minute: 45,
      description: 'Second half started',
      timestamp: new Date()
    };

    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      {
        status: 'live',
        'liveData.period': 'second_half',
        'liveData.currentMinute': 45,
        'liveData.isLive': true,
        $push: { events: secondHalfEvent }
      },
      { new: true }
    ).populate('homeTeam', 'name logo')
     .populate('awayTeam', 'name logo')
     .populate('events.player', 'name number');

    console.log('✅ Second half started successfully:', updatedMatch._id);
    return updatedMatch;
  } catch (error) {
    console.error('Start second half error:', error);
    throw new Error('Failed to start second half');
  }
}

// ✅ NEW: Update player statistics from events
async function updatePlayerStatisticsFromEvents(events, match) {
  try {
    console.log('📊 Updating player statistics from events...');
    
    const playerStats = {};
    
    // Count events per player
    events.forEach(event => {
      if (!event.player?._id) return;
      
      const playerId = event.player._id;
      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          goals: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 1 // Participated in match
        };
      }
      
      switch (event.type) {
        case 'goal':
          playerStats[playerId].goals++;
          break;
        case 'yellow_card':
          playerStats[playerId].yellowCards++;
          break;
        case 'red_card':
          playerStats[playerId].redCards++;
          break;
      }
    });
    
    // Update each player's statistics
    const updatePromises = Object.entries(playerStats).map(([playerId, stats]) => {
      return Player.findByIdAndUpdate(playerId, {
        $inc: {
          'stats.goals': stats.goals,
          'stats.yellowCards': stats.yellowCards,
          'stats.redCards': stats.redCards,
          'stats.appearances': stats.appearances,
          'stats.minutesPlayed': 90 // Simplified - assume full match
        }
      });
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Updated statistics for ${Object.keys(playerStats).length} players`);
    
  } catch (error) {
    console.error('❌ Update player statistics error:', error);
    // Don't throw - this is not critical for match operation
  }
}

// ✅ NEW: Update final statistics when match ends
async function updateFinalPlayerStats(match) {
  try {
    console.log('📈 Updating final player statistics...');
    
    // Get all players who participated (had events)
    const participatingPlayerIds = new Set();
    match.events.forEach(event => {
      if (event.player) {
        participatingPlayerIds.add(event.player.toString());
      }
    });
    
    // Update appearances for all participating players
    if (participatingPlayerIds.size > 0) {
      await Player.updateMany(
        { _id: { $in: Array.from(participatingPlayerIds) } },
        { 
          $inc: { 
            'stats.appearances': 1,
            'stats.minutesPlayed': 90 
          } 
        }
      );
      console.log(`✅ Updated final stats for ${participatingPlayerIds.size} players`);
    }
  } catch (error) {
    console.error('❌ Update final player stats error:', error);
    // Don't throw - this is not critical
  }
}

export default authMiddleware(handler);