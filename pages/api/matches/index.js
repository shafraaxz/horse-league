// pages/api/matches/index.js - FIXED: Remove default limit
import connectDB from '../../../lib/mongodb';
import { Match, Team, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        return await getMatches(req, res);
      case 'POST':
        return await authMiddleware(createMatch)(req, res);
      case 'PUT':
        return await authMiddleware(updateMatch)(req, res);
      case 'DELETE':
        return await authMiddleware(deleteMatch)(req, res);
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

// GET matches - FIXED: No default limit, optional limit parameter
async function getMatches(req, res) {
  try {
    const { league, leagueId, team, status, limit } = req.query;
    
    let query = {};
    
    // Support both 'league' and 'leagueId' parameters
    const leagueFilter = league || leagueId;
    if (leagueFilter) {
      query.league = leagueFilter;
    }
    
    if (team) {
      query.$or = [
        { homeTeam: team },
        { awayTeam: team }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    console.log('🔍 Match query:', query);
    console.log('🔍 Limit parameter:', limit);

    let matchQuery = Match.find(query)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name season')
      .sort({ date: 1, time: 1 });

    // ✅ FIXED: Only apply limit if explicitly requested
    if (limit && !isNaN(parseInt(limit))) {
      matchQuery = matchQuery.limit(parseInt(limit));
      console.log('🔢 Applying limit:', parseInt(limit));
    } else {
      console.log('🔢 No limit applied - fetching all matches');
    }

    const matches = await matchQuery;

    console.log(`📅 Retrieved ${matches.length} matches${leagueFilter ? ` for league ${leagueFilter}` : ''}`);
    return res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }
}

// CREATE match - Same as before
async function createMatch(req, res) {
  try {
    const { 
      leagueId, 
      homeTeam, 
      awayTeam, 
      date, 
      time, 
      round, 
      venue,
      referee,
      matchday 
    } = req.body;

    console.log('🏗️ Creating match with data:', { leagueId, homeTeam, awayTeam, date, time });
    console.log('👤 User creating match:', req.user?.username, 'Role:', req.user?.role);

    if (!leagueId || !homeTeam || !awayTeam || !date || !time || !round) {
      return res.status(400).json({ 
        error: 'Missing required fields: leagueId, homeTeam, awayTeam, date, time, round' 
      });
    }

    // Validate teams exist and belong to the league
    const [homeTeamDoc, awayTeamDoc] = await Promise.all([
      Team.findOne({ _id: homeTeam, league: leagueId }),
      Team.findOne({ _id: awayTeam, league: leagueId })
    ]);

    if (!homeTeamDoc) {
      return res.status(400).json({ error: 'Home team not found or does not belong to this league' });
    }

    if (!awayTeamDoc) {
      return res.status(400).json({ error: 'Away team not found or does not belong to this league' });
    }

    if (homeTeam === awayTeam) {
      return res.status(400).json({ error: 'Home team and away team cannot be the same' });
    }

    // Create match
    const newMatch = new Match({
      homeTeam,
      awayTeam,
      league: leagueId,
      date,
      time,
      round: parseInt(round),
      matchday: matchday || parseInt(round),
      venue: venue || 'Manadhoo Futsal Ground',
      referee: referee || '',
      status: 'scheduled',
      score: {
        home: 0,
        away: 0,
        halfTime: { home: 0, away: 0 }
      },
      liveData: {
        currentMinute: 0,
        isLive: false,
        period: 'first_half'
      }
    });

    const savedMatch = await newMatch.save();
    
    // Populate the response
    const populatedMatch = await Match.findById(savedMatch._id)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name season');

    // Update league match count
    await League.findByIdAndUpdate(leagueId, {
      $inc: { matchesCount: 1 }
    });

    console.log('✅ Match created successfully:', savedMatch._id);
    return res.status(201).json({
      message: 'Match created successfully',
      match: populatedMatch
    });
  } catch (error) {
    console.error('❌ Error creating match:', error);
    return res.status(500).json({ 
      error: 'Failed to create match',
      details: error.message 
    });
  }
}

// UPDATE match - Same as before
async function updateMatch(req, res) {
  try {
    const { 
      id, 
      homeTeam, 
      awayTeam, 
      date, 
      time, 
      round, 
      venue, 
      referee, 
      status,
      homeScore,
      awayScore,
      matchday 
    } = req.body;

    console.log('🔄 Updating match:', id);
    console.log('👤 User updating match:', req.user?.username, 'Role:', req.user?.role);

    if (!id) {
      return res.status(400).json({ error: 'Match ID is required' });
    }

    // Find existing match
    const existingMatch = await Match.findById(id).populate('league');
    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Prepare update data
    const updateData = {};
    
    if (homeTeam) updateData.homeTeam = homeTeam;
    if (awayTeam) updateData.awayTeam = awayTeam;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (round) updateData.round = parseInt(round);
    if (matchday) updateData.matchday = parseInt(matchday);
    if (venue) updateData.venue = venue;
    if (referee !== undefined) updateData.referee = referee;
    if (status) updateData.status = status;

    // Handle score updates
    if (homeScore !== undefined || awayScore !== undefined) {
      updateData.score = {
        ...existingMatch.score,
        home: homeScore !== undefined ? parseInt(homeScore) : existingMatch.score.home,
        away: awayScore !== undefined ? parseInt(awayScore) : existingMatch.score.away
      };
    }

    // Validate teams if being updated
    if (homeTeam || awayTeam) {
      const homeTeamId = homeTeam || existingMatch.homeTeam;
      const awayTeamId = awayTeam || existingMatch.awayTeam;

      if (homeTeamId.toString() === awayTeamId.toString()) {
        return res.status(400).json({ error: 'Home team and away team cannot be the same' });
      }

      const leagueId = existingMatch.league._id.toString();
      const [homeTeamDoc, awayTeamDoc] = await Promise.all([
        Team.findOne({ _id: homeTeamId, league: leagueId }),
        Team.findOne({ _id: awayTeamId, league: leagueId })
      ]);

      if (!homeTeamDoc || !awayTeamDoc) {
        return res.status(400).json({ error: 'One or both teams not found or do not belong to this league' });
      }
    }

    updateData.updatedAt = new Date();

    const updatedMatch = await Match.findByIdAndUpdate(id, updateData, { new: true })
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name season');

    console.log('✅ Match updated successfully:', id);
    return res.status(200).json({
      message: 'Match updated successfully',
      match: updatedMatch
    });
  } catch (error) {
    console.error('❌ Error updating match:', error);
    return res.status(500).json({ 
      error: 'Failed to update match',
      details: error.message 
    });
  }
}

// DELETE match - Same as before
async function deleteMatch(req, res) {
  try {
    const { id } = req.query;

    console.log('🗑️ Deleting match:', id);
    console.log('👤 User deleting match:', req.user?.username, 'Role:', req.user?.role);

    if (!id) {
      return res.status(400).json({ error: 'Match ID is required' });
    }

    // Find existing match
    const existingMatch = await Match.findById(id).populate('league');
    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Don't allow deletion of live matches
    if (existingMatch.status === 'live') {
      return res.status(400).json({ error: 'Cannot delete a live match' });
    }

    await Match.findByIdAndDelete(id);

    // Update league match count
    await League.findByIdAndUpdate(existingMatch.league._id, {
      $inc: { matchesCount: -1 }
    });

    console.log('✅ Match deleted successfully:', id);
    return res.status(200).json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting match:', error);
    return res.status(500).json({ 
      error: 'Failed to delete match',
      details: error.message 
    });
  }
}