// ===========================================
// FILE: pages/api/admin/matches.js (ENHANCED WITH PLAYER STATS)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import Season from '../../../models/Season';
import Player from '../../../models/Player';

/**
 * Validates and parses ISO date string
 * Enhanced to handle different match statuses
 */
function parseAndValidateDate(dateString, status = 'scheduled') {
  if (!dateString) {
    throw new Error('Date is required');
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format. Please use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)');
  }
  
  // Enhanced validation based on status
  const now = new Date();
  const hoursDifference = Math.abs(now - date) / (1000 * 60 * 60);
  
  // Only restrict past dates for scheduled matches
  if (status === 'scheduled' && date < now) {
    throw new Error('Scheduled match date cannot be in the past');
  }
  
  // For live matches, allow some flexibility
  if (status === 'live' && hoursDifference > 24) {
    throw new Error('Live match date should be within 24 hours of current time');
  }
  
  return date;
}

/**
 * Auto-update player statistics when match is completed
 */
async function updatePlayerStatistics(match, events) {
  if (!events || events.length === 0) {
    console.log('No events to process for player stats');
    return;
  }

  console.log(`Updating player stats for match: ${match._id}`);

  try {
    // Group events by player
    const playerEvents = {};
    const allPlayerIds = new Set();

    events.forEach(event => {
      if (event.player) {
        allPlayerIds.add(event.player);
        if (!playerEvents[event.player]) {
          playerEvents[event.player] = [];
        }
        playerEvents[event.player].push(event);
      }
    });

    // Process each player
    for (const playerId of allPlayerIds) {
      const player = await Player.findById(playerId);
      if (!player) {
        console.warn(`Player not found: ${playerId}`);
        continue;
      }

      const playerEventsList = playerEvents[playerId];
      const seasonId = match.season.toString();

      // Initialize season stats if not exists
      if (!player.seasonStats) {
        player.seasonStats = {};
      }

      if (!player.seasonStats[seasonId]) {
        player.seasonStats[seasonId] = {
          season: match.season,
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        };
      }

      // Initialize career stats if not exists
      if (!player.careerStats) {
        player.careerStats = {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        };
      }

      const seasonStats = player.seasonStats[seasonId];
      let hasUpdatedAppearance = false;

      // Check if player already has stats for this match (prevent double counting)
      const hasExistingMatch = player.matchHistory?.some(
        h => h.match.toString() === match._id.toString()
      );

      // Process events for this player
      playerEventsList.forEach(event => {
        switch (event.type) {
          case 'goal':
            if (!hasExistingMatch) {
              seasonStats.goals += 1;
              player.careerStats.goals += 1;
            }
            break;
          case 'assist':
            if (!hasExistingMatch) {
              seasonStats.assists += 1;
              player.careerStats.assists += 1;
            }
            break;
          case 'yellow_card':
            if (!hasExistingMatch) {
              seasonStats.yellowCards += 1;
              player.careerStats.yellowCards += 1;
            }
            break;
          case 'red_card':
            if (!hasExistingMatch) {
              seasonStats.redCards += 1;
              player.careerStats.redCards += 1;
            }
            break;
        }

        // Count appearance only once per player per match
        if (!hasUpdatedAppearance && !hasExistingMatch) {
          seasonStats.appearances += 1;
          player.careerStats.appearances += 1;
          seasonStats.minutesPlayed += 90; // Default full match
          player.careerStats.minutesPlayed += 90;
          hasUpdatedAppearance = true;
        }
      });

      // Add to match history if not already exists
      if (!hasExistingMatch && hasUpdatedAppearance) {
        if (!player.matchHistory) player.matchHistory = [];
        
        const homeScore = match.homeScore || 0;
        const awayScore = match.awayScore || 0;
        const isHomeTeam = player.currentTeam.toString() === match.homeTeam.toString();
        
        let result;
        if (homeScore === awayScore) {
          result = 'draw';
        } else if ((isHomeTeam && homeScore > awayScore) || (!isHomeTeam && awayScore > homeScore)) {
          result = 'win';
        } else {
          result = 'loss';
        }

        player.matchHistory.push({
          match: match._id,
          season: match.season,
          team: player.currentTeam,
          date: match.matchDate,
          opponent: isHomeTeam ? match.awayTeam : match.homeTeam,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          result: result,
          goals: playerEventsList.filter(e => e.type === 'goal').length,
          assists: playerEventsList.filter(e => e.type === 'assist').length,
          yellowCards: playerEventsList.filter(e => e.type === 'yellow_card').length,
          redCards: playerEventsList.filter(e => e.type === 'red_card').length,
          minutesPlayed: 90
        });
      }

      await player.save();
      console.log(`Updated stats for ${player.name}: ${seasonStats.goals}G ${seasonStats.assists}A`);
    }

    console.log(`✅ Player statistics updated successfully for ${allPlayerIds.size} players`);

  } catch (error) {
    console.error('❌ Error updating player statistics:', error);
    throw error;
  }
}

/**
 * Auto-update team statistics when match is completed
 */
async function updateTeamStatistics(match) {
  if (match.status !== 'completed' || match.statsUpdated) {
    return; // Skip if not completed or already updated
  }

  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  
  // Determine results and points
  let homeResult, awayResult, homePoints, awayPoints;
  
  if (homeScore > awayScore) {
    homeResult = 'win'; awayResult = 'loss';
    homePoints = 3; awayPoints = 0;
  } else if (homeScore < awayScore) {
    homeResult = 'loss'; awayResult = 'win';
    homePoints = 0; awayPoints = 3;
  } else {
    homeResult = 'draw'; awayResult = 'draw';
    homePoints = 1; awayPoints = 1;
  }
  
  // Get teams
  const [homeTeam, awayTeam] = await Promise.all([
    Team.findById(match.homeTeam),
    Team.findById(match.awayTeam)
  ]);
  
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
  
  // Update team statistics
  await Promise.all([
    Team.findByIdAndUpdate(match.homeTeam, {
      stats: {
        matchesPlayed: homeStats.matchesPlayed + 1,
        wins: homeStats.wins + (homeResult === 'win' ? 1 : 0),
        draws: homeStats.draws + (homeResult === 'draw' ? 1 : 0),
        losses: homeStats.losses + (homeResult === 'loss' ? 1 : 0),
        goalsFor: homeStats.goalsFor + homeScore,
        goalsAgainst: homeStats.goalsAgainst + awayScore,
        points: homeStats.points + homePoints
      }
    }),
    Team.findByIdAndUpdate(match.awayTeam, {
      stats: {
        matchesPlayed: awayStats.matchesPlayed + 1,
        wins: awayStats.wins + (awayResult === 'win' ? 1 : 0),
        draws: awayStats.draws + (awayResult === 'draw' ? 1 : 0),
        losses: awayStats.losses + (awayResult === 'loss' ? 1 : 0),
        goalsFor: awayStats.goalsFor + awayScore,
        goalsAgainst: awayStats.goalsAgainst + homeScore,
        points: awayStats.points + awayPoints
      }
    })
  ]);
  
  console.log(`✅ Team stats updated: ${homeTeam.name} ${homeScore}-${awayScore} ${awayTeam.name}`);
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGET(req, res);
      case 'POST':
        return await handlePOST(req, res);
      case 'PUT':
        return await handlePUT(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleGET(req, res) {
  const { seasonId, status, page = 1, limit = 50 } = req.query;

  let query = {};
  
  if (seasonId) query.season = seasonId;
  if (status && status !== 'all') query.status = status;

  try {
    const matches = await Match.find(query)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('season', 'name isActive')
      .sort({ matchDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    return res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return res.status(500).json({ message: 'Failed to fetch matches' });
  }
}

async function handlePOST(req, res) {
  const {
    homeTeam, awayTeam, matchDate, venue, round, referee, season,
    status = 'scheduled', homeScore = 0, awayScore = 0, notes, events = []
  } = req.body;

  try {
    // Validate required fields
    if (!homeTeam || !awayTeam || !season) {
      return res.status(400).json({ message: 'Home team, away team, and season are required' });
    }

    if (homeTeam === awayTeam) {
      return res.status(400).json({ message: 'Home and away teams cannot be the same' });
    }

    // Validate and parse date with status consideration
    let parsedDate;
    try {
      parsedDate = parseAndValidateDate(matchDate, status);
    } catch (dateError) {
      return res.status(400).json({ message: dateError.message });
    }

    // Check if teams exist and belong to the season
    const [homeTeamDoc, awayTeamDoc, seasonDoc] = await Promise.all([
      Team.findOne({ _id: homeTeam, season }),
      Team.findOne({ _id: awayTeam, season }),
      Season.findById(season)
    ]);

    if (!homeTeamDoc) {
      return res.status(400).json({ message: 'Home team not found or does not belong to selected season' });
    }

    if (!awayTeamDoc) {
      return res.status(400).json({ message: 'Away team not found or does not belong to selected season' });
    }

    if (!seasonDoc) {
      return res.status(400).json({ message: 'Season not found' });
    }

    // Check for conflicting matches (same teams, same date within 2 hours)
    const twoHoursBefore = new Date(parsedDate.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(parsedDate.getTime() + 2 * 60 * 60 * 1000);

    const conflictingMatch = await Match.findOne({
      $or: [
        { homeTeam, awayTeam },
        { homeTeam: awayTeam, awayTeam: homeTeam }
      ],
      matchDate: {
        $gte: twoHoursBefore,
        $lte: twoHoursAfter
      },
      status: { $ne: 'cancelled' }
    });

    if (conflictingMatch) {
      return res.status(400).json({ 
        message: 'A match between these teams is already scheduled within 2 hours of this time' 
      });
    }

    // Create match data
    const matchData = {
      homeTeam, awayTeam,
      matchDate: parsedDate,
      venue: venue || null,
      round: round || 'Regular Season',
      referee: referee || null,
      season, status,
      notes: notes || null,
      events: Array.isArray(events) ? events : []
    };

    // Include scores for completed or live matches
    if (status === 'completed' || status === 'live') {
      matchData.homeScore = parseInt(homeScore) || 0;
      matchData.awayScore = parseInt(awayScore) || 0;
    }

    const match = new Match(matchData);
    await match.save();

    // Auto-update statistics for completed matches
    if (status === 'completed') {
      try {
        // Update team statistics
        await updateTeamStatistics(match);
        
        // Update player statistics if events exist
        if (events.length > 0) {
          await updatePlayerStatistics(match, events);
        }
        
        // Mark as stats updated
        await Match.findByIdAndUpdate(match._id, { statsUpdated: true });
        
        console.log('✅ Auto-updated statistics for completed match');
      } catch (statsError) {
        console.error('❌ Failed to update statistics:', statsError);
        // Don't fail the match creation if stats update fails
      }
    }

    // Populate the response
    await match.populate([
      { path: 'homeTeam', select: 'name logo' },
      { path: 'awayTeam', select: 'name logo' },
      { path: 'season', select: 'name isActive' }
    ]);

    console.log('Match created successfully:', {
      id: match._id,
      teams: `${homeTeamDoc.name} vs ${awayTeamDoc.name}`,
      date: match.matchDate.toISOString(),
      status: match.status,
      events: events.length
    });

    return res.status(201).json({
      message: 'Match created successfully',
      match: match.toObject()
    });

  } catch (error) {
    console.error('Error creating match:', error);
    return res.status(500).json({ 
      message: 'Failed to create match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handlePUT(req, res) {
  const {
    id, homeTeam, awayTeam, matchDate, venue, round, referee, season,
    status, homeScore, awayScore, notes, events = []
  } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    // Find existing match
    const existingMatch = await Match.findById(id);
    if (!existingMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Validate required fields
    if (!homeTeam || !awayTeam || !season) {
      return res.status(400).json({ message: 'Home team, away team, and season are required' });
    }

    if (homeTeam === awayTeam) {
      return res.status(400).json({ message: 'Home and away teams cannot be the same' });
    }

    // Validate and parse date with status consideration
    let parsedDate;
    try {
      parsedDate = parseAndValidateDate(matchDate, status);
    } catch (dateError) {
      return res.status(400).json({ message: dateError.message });
    }

    // Check if teams exist and belong to the season
    const [homeTeamDoc, awayTeamDoc] = await Promise.all([
      Team.findOne({ _id: homeTeam, season }),
      Team.findOne({ _id: awayTeam, season })
    ]);

    if (!homeTeamDoc) {
      return res.status(400).json({ message: 'Home team not found or does not belong to selected season' });
    }

    if (!awayTeamDoc) {
      return res.status(400).json({ message: 'Away team not found or does not belong to selected season' });
    }

    // Check for conflicting matches (excluding current match)
    const twoHoursBefore = new Date(parsedDate.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(parsedDate.getTime() + 2 * 60 * 60 * 1000);

    const conflictingMatch = await Match.findOne({
      _id: { $ne: id },
      $or: [
        { homeTeam, awayTeam },
        { homeTeam: awayTeam, awayTeam: homeTeam }
      ],
      matchDate: {
        $gte: twoHoursBefore,
        $lte: twoHoursAfter
      },
      status: { $ne: 'cancelled' }
    });

    if (conflictingMatch) {
      return res.status(400).json({ 
        message: 'A match between these teams is already scheduled within 2 hours of this time' 
      });
    }

    // Update match data
    const updateData = {
      homeTeam, awayTeam,
      matchDate: parsedDate,
      venue: venue || null,
      round: round || 'Regular Season',
      referee: referee || null,
      season, status: status || 'scheduled',
      notes: notes || null,
      events: Array.isArray(events) ? events : [],
      updatedAt: new Date()
    };

    // Handle scores based on status
    if (status === 'completed' || status === 'live') {
      updateData.homeScore = parseInt(homeScore) || 0;
      updateData.awayScore = parseInt(awayScore) || 0;
    } else {
      updateData.homeScore = 0;
      updateData.awayScore = 0;
    }

    // Check if this is a status change to completed
    const wasCompleted = existingMatch.status === 'completed';
    const nowCompleted = status === 'completed';
    const shouldUpdateStats = nowCompleted && (!wasCompleted || !existingMatch.statsUpdated);

    const updatedMatch = await Match.findByIdAndUpdate(
      id, updateData, { new: true, runValidators: true }
    ).populate([
      { path: 'homeTeam', select: 'name logo' },
      { path: 'awayTeam', select: 'name logo' },
      { path: 'season', select: 'name isActive' }
    ]);

    // Auto-update statistics if match is now completed
    if (shouldUpdateStats) {
      try {
        // Update team statistics
        await updateTeamStatistics(updatedMatch);
        
        // Update player statistics if events exist
        if (events.length > 0) {
          await updatePlayerStatistics(updatedMatch, events);
        }
        
        // Mark as stats updated
        await Match.findByIdAndUpdate(id, { statsUpdated: true });
        
        console.log('✅ Auto-updated statistics for completed match');
      } catch (statsError) {
        console.error('❌ Failed to update statistics:', statsError);
        // Don't fail the match update if stats update fails
      }
    }

    console.log('Match updated successfully:', {
      id: updatedMatch._id,
      teams: `${homeTeamDoc.name} vs ${awayTeamDoc.name}`,
      date: updatedMatch.matchDate.toISOString(),
      status: updatedMatch.status,
      events: events.length
    });

    return res.status(200).json({
      message: 'Match updated successfully',
      match: updatedMatch.toObject()
    });

  } catch (error) {
    console.error('Error updating match:', error);
    return res.status(500).json({ 
      message: 'Failed to update match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleDELETE(req, res) {
  const { id } = req.query;

  try {
    if (!id) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    const match = await Match.findById(id)
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Prevent deletion of live matches
    if (match.status === 'live') {
      return res.status(400).json({ message: 'Cannot delete a live match' });
    }

    await Match.findByIdAndDelete(id);

    console.log('Match deleted successfully:', {
      id: match._id,
      teams: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      date: match.matchDate.toISOString()
    });

    return res.status(200).json({ 
      message: 'Match deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting match:', error);
    return res.status(500).json({ 
      message: 'Failed to delete match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
