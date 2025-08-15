// pages/api/matches/index.js - FIXED Match API with proper edit support
import connectDB from '../../../lib/mongodb';
import { Match, Team, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        return await getMatches(req, res);
      case 'POST':
        return await createMatch(req, res);
      case 'PUT':
        return await updateMatch(req, res);
      case 'DELETE':
        return await deleteMatch(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Matches API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function getMatches(req, res) {
  try {
    const { league, status, date, limit = 50 } = req.query;
    
    let filter = {};
    
    if (league) filter.league = league;
    if (status) filter.status = status;
    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate.getTime() + 24 * 60 * 60 * 1000);
      filter.date = {
        $gte: queryDate.toISOString().split('T')[0],
        $lt: nextDay.toISOString().split('T')[0]
      };
    }

    const matches = await Match.find(filter)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name')
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit));

    res.status(200).json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}

async function createMatch(req, res) {
  try {
    console.log('🆕 Creating new match:', req.body);
    
    const { homeTeam, awayTeam, leagueId, date, time, venue, referee } = req.body;
    
    // Validate required fields
    if (!homeTeam || !awayTeam || !leagueId) {
      return res.status(400).json({ 
        error: 'Home team, away team, and league are required' 
      });
    }
    
    if (homeTeam === awayTeam) {
      return res.status(400).json({ 
        error: 'Team cannot play against itself' 
      });
    }
    
    // Verify teams exist and belong to the league
    const [homeTeamDoc, awayTeamDoc, league] = await Promise.all([
      Team.findOne({ _id: homeTeam, league: leagueId }),
      Team.findOne({ _id: awayTeam, league: leagueId }),
      League.findById(leagueId)
    ]);
    
    if (!homeTeamDoc) {
      return res.status(400).json({ error: 'Home team not found in this league' });
    }
    
    if (!awayTeamDoc) {
      return res.status(400).json({ error: 'Away team not found in this league' });
    }
    
    if (!league) {
      return res.status(400).json({ error: 'League not found' });
    }
    
    // Get next round number
    const lastMatch = await Match.findOne({ league: leagueId }).sort({ round: -1 });
    const nextRound = lastMatch ? lastMatch.round + 1 : 1;
    
    // Create match
    const matchData = {
      homeTeam,
      awayTeam,
      league: leagueId,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '18:00',
      round: nextRound,
      matchday: nextRound,
      venue: venue || 'Manadhoo Futsal Ground',
      referee: referee || '',
      status: 'scheduled',
      score: {
        home: 0,
        away: 0,
        halfTime: { home: 0, away: 0 }
      },
      events: [],
      liveData: {
        currentMinute: 0,
        isLive: false,
        period: 'first_half'
      },
      statistics: {
        home: { possession: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 },
        away: { possession: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 }
      }
    };
    
    const newMatch = new Match(matchData);
    await newMatch.save();
    
    // Populate the response
    const populatedMatch = await Match.findById(newMatch._id)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name');
    
    console.log('✅ Match created successfully:', populatedMatch._id);
    
    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match: populatedMatch
    });
    
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ 
      error: 'Failed to create match',
      details: error.message 
    });
  }
}

// ✅ FIXED: Proper match update function
async function updateMatch(req, res) {
  try {
    console.log('🔄 Updating match:', req.body);
    
    const { id, homeTeam, awayTeam, date, time, venue, referee, score, status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Match ID is required for update' });
    }
    
    // Find the existing match
    const existingMatch = await Match.findById(id);
    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    console.log('📝 Found existing match:', existingMatch._id);
    
    // Prepare update data
    const updateData = {};
    
    // Only update provided fields
    if (homeTeam !== undefined) updateData.homeTeam = homeTeam;
    if (awayTeam !== undefined) updateData.awayTeam = awayTeam;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (venue !== undefined) updateData.venue = venue;
    if (referee !== undefined) updateData.referee = referee;
    if (status !== undefined) updateData.status = status;
    
    // Handle score updates
    if (score !== undefined) {
      updateData.score = {
        home: score.home || 0,
        away: score.away || 0,
        halfTime: score.halfTime || { home: 0, away: 0 }
      };
    }
    
    // Validate team change if provided
    if (homeTeam && awayTeam && homeTeam === awayTeam) {
      return res.status(400).json({ error: 'Team cannot play against itself' });
    }
    
    // Update the match
    const updatedMatch = await Match.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('homeTeam', 'name logo')
    .populate('awayTeam', 'name logo')
    .populate('league', 'name');
    
    if (!updatedMatch) {
      return res.status(404).json({ error: 'Failed to update match' });
    }
    
    console.log('✅ Match updated successfully:', updatedMatch._id);
    
    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      match: updatedMatch
    });
    
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ 
      error: 'Failed to update match',
      details: error.message 
    });
  }
}

async function deleteMatch(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Match ID is required' });
    }
    
    console.log('🗑️ Deleting match:', id);
    
    const deletedMatch = await Match.findByIdAndDelete(id);
    
    if (!deletedMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    console.log('✅ Match deleted successfully:', id);
    
    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ 
      error: 'Failed to delete match',
      details: error.message 
    });
  }
}

export default authMiddleware(handler);