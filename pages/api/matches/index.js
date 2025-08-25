
// api/matches/index.js
import { ObjectId } from 'mongodb';
import { 
  compose, 
  cors, 
  rateLimit, 
  extractSeason, 
  validateBody 
} from '../_lib/middleware.js';
import { 
  formatResponse, 
  formatError, 
  paginate, 
  buildSearchQuery, 
  buildFilterQuery, 
  buildSortQuery,
  sanitizeInput,
  getCurrentSeason 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { MatchModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getMatches(req, res);
        } else if (req.method === 'POST') {
          return await createMatch(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Matches API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/matches
async function getMatches(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    status,
    team,
    venue,
    dateFrom,
    dateTo,
    round,
    sortBy = 'date', 
    sortOrder = 'desc' 
  } = req.query;

  const season = req.season || req.query.season;

  // Build query
  const query = buildFilterQuery({
    season,
    status,
    venue,
    dateFrom,
    dateTo,
    round
  });

  // Add team filter
  if (team) {
    query.$or = [
      { homeTeam: new RegExp(sanitizeInput(team), 'i') },
      { awayTeam: new RegExp(sanitizeInput(team), 'i') }
    ];
  }

  // Add search functionality
  if (search) {
    const searchTerm = sanitizeInput(search);
    if (!query.$or) query.$or = [];
    query.$or.push(
      { homeTeam: new RegExp(searchTerm, 'i') },
      { awayTeam: new RegExp(searchTerm, 'i') },
      { venue: new RegExp(searchTerm, 'i') }
    );
  }

  // Pagination
  const { skip, limit: pageLimit } = paginate(page, limit);
  
  // Sort
  const sort = buildSortQuery(sortBy, sortOrder);

  try {
    const [matches, total] = await Promise.all([
      req.db.collection(MatchModel.collection)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .toArray(),
      req.db.collection(MatchModel.collection).countDocuments(query)
    ]);

    const response = {
      matches,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit)
      },
      filters: {
        season,
        status,
        team,
        venue,
        dateFrom,
        dateTo,
        round,
        search
      }
    };

    res.status(200).json(formatResponse(response, 'Matches retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve matches: ${error.message}`);
  }
}

// POST /api/matches
async function createMatch(req, res) {
  // Validate request body
  const errors = MatchModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  const season = req.season || req.body.season || getCurrentSeason();

  try {
    // Verify teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      req.db.collection('teams').findOne({ 
        name: req.body.homeTeam, 
        season 
      }),
      req.db.collection('teams').findOne({ 
        name: req.body.awayTeam, 
        season 
      })
    ]);

    if (!homeTeam) {
      return res.status(404).json(formatError('Home team not found'));
    }

    if (!awayTeam) {
      return res.status(404).json(formatError('Away team not found'));
    }

    // Check for scheduling conflicts
    const conflictingMatch = await req.db.collection(MatchModel.collection)
      .findOne({
        date: new Date(req.body.date),
        venue: sanitizeInput(req.body.venue),
        status: { $in: ['scheduled', 'live'] }
      });

    if (conflictingMatch) {
      return res.status(409).json(formatError('Venue is already booked for this date and time'));
    }

    // Sanitize match data
    const matchData = {
      homeTeam: sanitizeInput(req.body.homeTeam),
      homeTeamId: homeTeam._id,
      awayTeam: sanitizeInput(req.body.awayTeam),
      awayTeamId: awayTeam._id,
      date: new Date(req.body.date),
      venue: sanitizeInput(req.body.venue),
      status: 'scheduled',
      season,
      round: req.body.round || 1,
      homeScore: null,
      awayScore: null,
      events: [],
      liveData: {
        isLive: false,
        timeElapsed: 0,
        isRunning: false,
        period: 1,
        startTime: null,
        pausedTime: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert match
    const result = await req.db.collection(MatchModel.collection)
      .insertOne(matchData);

    if (!result.insertedId) {
      throw new Error('Failed to create match');
    }

    // Retrieve created match
    const newMatch = await req.db.collection(MatchModel.collection)
      .findOne({ _id: result.insertedId });

    res.status(201).json(formatResponse(newMatch, 'Match created successfully'));
  } catch (error) {
    throw new Error(`Failed to create match: ${error.message}`);
  }
}

// api/matches/[id].js
import { ObjectId } from 'mongodb';
import { 
  compose, 
  cors, 
  rateLimit, 
  extractSeason 
} from '../_lib/middleware.js';
import { 
  formatResponse, 
  formatError, 
  sanitizeInput,
  isValidObjectId,
  toObjectId 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { MatchModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid match ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getMatch(req, res, id);
        } else if (req.method === 'PUT') {
          return await updateMatch(req, res, id);
        } else if (req.method === 'DELETE') {
          return await deleteMatch(req, res, id);
        } else {
          res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Match API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/matches/[id]
async function getMatch(req, res, id) {
  try {
    const match = await req.db.collection(MatchModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!match) {
      return res.status(404).json(formatError('Match not found'));
    }

    // Get team details
    const [homeTeamDetails, awayTeamDetails] = await Promise.all([
      req.db.collection('teams').findOne({ _id: match.homeTeamId }),
      req.db.collection('teams').findOne({ _id: match.awayTeamId })
    ]);

    // Get player details for events
    const eventsWithPlayerDetails = await Promise.all(
      (match.events || []).map(async (event) => {
        if (event.playerId) {
          const player = await req.db.collection('players')
            .findOne({ _id: event.playerId });
          return {
            ...event,
            playerDetails: player
          };
        }
        return event;
      })
    );

    const response = {
      ...match,
      homeTeamDetails,
      awayTeamDetails,
      events: eventsWithPlayerDetails
    };

    res.status(200).json(formatResponse(response, 'Match retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve match: ${error.message}`);
  }
}

// PUT /api/matches/[id]
async function updateMatch(req, res, id) {
  // Validate request body
  const errors = MatchModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  try {
    // Check if match exists
    const existingMatch = await req.db.collection(MatchModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!existingMatch) {
      return res.status(404).json(formatError('Match not found'));
    }

    // Don't allow updating live or completed matches through this endpoint
    if (existingMatch.status === 'live') {
      return res.status(400).json(formatError('Cannot update live match. Use live match endpoints.'));
    }

    if (existingMatch.status === 'completed') {
      return res.status(400).json(formatError('Cannot update completed match.'));
    }

    // Verify teams exist if they're being updated
    let homeTeamId = existingMatch.homeTeamId;
    let awayTeamId = existingMatch.awayTeamId;

    if (req.body.homeTeam && req.body.homeTeam !== existingMatch.homeTeam) {
      const homeTeam = await req.db.collection('teams').findOne({
        name: req.body.homeTeam,
        season: existingMatch.season
      });
      if (!homeTeam) {
        return res.status(404).json(formatError('Home team not found'));
      }
      homeTeamId = homeTeam._id;
    }

    if (req.body.awayTeam && req.body.awayTeam !== existingMatch.awayTeam) {
      const awayTeam = await req.db.collection('teams').findOne({
        name: req.body.awayTeam,
        season: existingMatch.season
      });
      if (!awayTeam) {
        return res.status(404).json(formatError('Away team not found'));
      }
      awayTeamId = awayTeam._id;
    }

    // Check for scheduling conflicts if date/venue is being updated
    if ((req.body.date && req.body.date !== existingMatch.date) || 
        (req.body.venue && req.body.venue !== existingMatch.venue)) {
      const conflictingMatch = await req.db.collection(MatchModel.collection)
        .findOne({
          _id: { $ne: toObjectId(id) },
          date: new Date(req.body.date || existingMatch.date),
          venue: sanitizeInput(req.body.venue || existingMatch.venue),
          status: { $in: ['scheduled', 'live'] }
        });

      if (conflictingMatch) {
        return res.status(409).json(formatError('Venue is already booked for this date and time'));
      }
    }

    // Sanitize update data
    const updateData = {
      ...req.body,
      homeTeam: req.body.homeTeam ? sanitizeInput(req.body.homeTeam) : existingMatch.homeTeam,
      awayTeam: req.body.awayTeam ? sanitizeInput(req.body.awayTeam) : existingMatch.awayTeam,
      venue: req.body.venue ? sanitizeInput(req.body.venue) : existingMatch.venue,
      homeTeamId,
      awayTeamId,
      date: req.body.date ? new Date(req.body.date) : existingMatch.date,
      updatedAt: new Date()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.season;
    delete updateData.createdAt;
    delete updateData.events;
    delete updateData.liveData;

    // Update match
    const result = await req.db.collection(MatchModel.collection)
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      throw new Error('Failed to update match');
    }

    res.status(200).json(formatResponse(result.value, 'Match updated successfully'));
  } catch (error) {
    throw new Error(`Failed to update match: ${error.message}`);
  }
}