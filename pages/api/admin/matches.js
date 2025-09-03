// ===========================================
// FILE: pages/api/admin/matches.js (FIXED WITH PROPER TIME HANDLING)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import Season from '../../../models/Season';

/**
 * Validates and parses ISO date string
 * Returns the Date object if valid, throws error if invalid
 */
function parseAndValidateDate(dateString) {
  if (!dateString) {
    throw new Error('Date is required');
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format. Please use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)');
  }
  
  return date;
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
  
  if (seasonId) {
    query.season = seasonId;
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }

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
    homeTeam,
    awayTeam,
    matchDate,
    venue,
    round,
    referee,
    season,
    status = 'scheduled',
    homeScore = 0,
    awayScore = 0,
    notes
  } = req.body;

  try {
    // Validate required fields
    if (!homeTeam || !awayTeam || !season) {
      return res.status(400).json({ message: 'Home team, away team, and season are required' });
    }

    if (homeTeam === awayTeam) {
      return res.status(400).json({ message: 'Home and away teams cannot be the same' });
    }

    // Validate and parse date
    let parsedDate;
    try {
      parsedDate = parseAndValidateDate(matchDate);
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

    // Check if season exists
    const seasonDoc = await Season.findById(season);
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

    // Create match
    const matchData = {
      homeTeam,
      awayTeam,
      matchDate: parsedDate,
      venue: venue || null,
      round: round || 'Regular Season',
      referee: referee || null,
      season,
      status,
      notes: notes || null
    };

    // Only include scores for completed or live matches
    if (status === 'completed' || status === 'live') {
      matchData.homeScore = parseInt(homeScore) || 0;
      matchData.awayScore = parseInt(awayScore) || 0;
    }

    const match = new Match(matchData);
    await match.save();

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
      localDate: match.matchDate.toString()
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
    id,
    homeTeam,
    awayTeam,
    matchDate,
    venue,
    round,
    referee,
    season,
    status,
    homeScore,
    awayScore,
    notes
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

    // Validate and parse date
    let parsedDate;
    try {
      parsedDate = parseAndValidateDate(matchDate);
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
      _id: { $ne: id }, // Exclude current match
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
      homeTeam,
      awayTeam,
      matchDate: parsedDate,
      venue: venue || null,
      round: round || 'Regular Season',
      referee: referee || null,
      season,
      status: status || 'scheduled',
      notes: notes || null,
      updatedAt: new Date()
    };

    // Handle scores based on status
    if (status === 'completed' || status === 'live') {
      updateData.homeScore = parseInt(homeScore) || 0;
      updateData.awayScore = parseInt(awayScore) || 0;
    } else {
      // Clear scores if not completed or live
      updateData.homeScore = 0;
      updateData.awayScore = 0;
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'homeTeam', select: 'name logo' },
      { path: 'awayTeam', select: 'name logo' },
      { path: 'season', select: 'name isActive' }
    ]);

    console.log('Match updated successfully:', {
      id: updatedMatch._id,
      teams: `${homeTeamDoc.name} vs ${awayTeamDoc.name}`,
      date: updatedMatch.matchDate.toISOString(),
      localDate: updatedMatch.matchDate.toString()
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
