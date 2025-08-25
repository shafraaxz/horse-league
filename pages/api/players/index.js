// api/players/index.js
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
  sanitizeInput 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { PlayerModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getPlayers(req, res);
        } else if (req.method === 'POST') {
          return await createPlayer(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Players API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/players
async function getPlayers(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    position, 
    status, 
    team,
    minAge,
    maxAge,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  const season = req.season || req.query.season;

  // Build query
  const query = buildFilterQuery({
    season,
    position,
    status,
    minAge,
    maxAge,
    currentTeam: team
  });

  // Add search functionality
  if (search) {
    const searchQuery = buildSearchQuery(sanitizeInput(search), ['name', 'email', 'currentTeam']);
    Object.assign(query, searchQuery);
  }

  // Pagination
  const { skip, limit: pageLimit } = paginate(page, limit);
  
  // Sort
  const sort = buildSortQuery(sortBy, sortOrder);

  try {
    const [players, total] = await Promise.all([
      req.db.collection(PlayerModel.collection)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .toArray(),
      req.db.collection(PlayerModel.collection).countDocuments(query)
    ]);

    const response = {
      players,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit)
      },
      filters: {
        season,
        position,
        status,
        team,
        search
      }
    };

    res.status(200).json(formatResponse(response, 'Players retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve players: ${error.message}`);
  }
}

// POST /api/players
async function createPlayer(req, res) {
  // Validate request body
  const errors = PlayerModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  const season = req.season || req.body.season || getCurrentSeason();

  // Sanitize input
  const playerData = {
    ...req.body,
    name: sanitizeInput(req.body.name),
    email: req.body.email ? sanitizeInput(req.body.email) : null,
    phone: req.body.phone ? sanitizeInput(req.body.phone) : null,
    season,
    status: req.body.status || 'available',
    currentTeam: null,
    currentTeamId: null,
    stats: {
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
      cleanSheets: 0
    },
    transfers: [],
    registrationDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    // Check if player with same email already exists in this season
    if (playerData.email) {
      const existingPlayer = await req.db.collection(PlayerModel.collection)
        .findOne({ email: playerData.email, season });

      if (existingPlayer) {
        return res.status(409).json(formatError('Player with this email already exists in this season'));
      }
    }

    // Insert player
    const result = await req.db.collection(PlayerModel.collection)
      .insertOne(playerData);

    if (!result.insertedId) {
      throw new Error('Failed to create player');
    }

    // Retrieve created player
    const newPlayer = await req.db.collection(PlayerModel.collection)
      .findOne({ _id: result.insertedId });

    res.status(201).json(formatResponse(newPlayer, 'Player created successfully'));
  } catch (error) {
    throw new Error(`Failed to create player: ${error.message}`);
  }
}