
// api/teams/index.js
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
  calculateTeamStats 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { TeamModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getTeams(req, res);
        } else if (req.method === 'POST') {
          return await createTeam(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Teams API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/teams
async function getTeams(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    sortBy = 'points', 
    sortOrder = 'desc',
    includeStats = 'true'
  } = req.query;

  const season = req.season || req.query.season;

  // Build query
  const query = buildFilterQuery({ season });

  // Add search functionality
  if (search) {
    const searchQuery = buildSearchQuery(sanitizeInput(search), ['name', 'coach']);
    Object.assign(query, searchQuery);
  }

  // Pagination
  const { skip, limit: pageLimit } = paginate(page, limit);
  
  // Sort
  const sort = buildSortQuery(sortBy, sortOrder);

  try {
    const [teams, total] = await Promise.all([
      req.db.collection(TeamModel.collection)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .toArray(),
      req.db.collection(TeamModel.collection).countDocuments(query)
    ]);

    // Include detailed stats if requested
    let teamsWithStats = teams;
    if (includeStats === 'true') {
      teamsWithStats = await Promise.all(
        teams.map(async (team) => {
          // Get team matches
          const matches = await req.db.collection('matches')
            .find({
              $or: [
                { homeTeamId: team._id },
                { awayTeamId: team._id }
              ],
              season: team.season
            })
            .toArray();

          // Calculate current stats
          const currentStats = calculateTeamStats(matches);
          
          // Get team roster
          const players = await req.db.collection('players')
            .find({ currentTeamId: team._id })
            .toArray();

          return {
            ...team,
            currentStats,
            roster: players,
            playerCount: players.length
          };
        })
      );
    }

    const response = {
      teams: teamsWithStats,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit)
      },
      filters: {
        season,
        search
      }
    };

    res.status(200).json(formatResponse(response, 'Teams retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve teams: ${error.message}`);
  }
}

// POST /api/teams
async function createTeam(req, res) {
  // Validate request body
  const errors = TeamModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  const season = req.season || req.body.season || getCurrentSeason();

  // Sanitize input
  const teamData = {
    ...req.body,
    name: sanitizeInput(req.body.name),
    coach: req.body.coach ? sanitizeInput(req.body.coach) : null,
    description: req.body.description ? sanitizeInput(req.body.description) : null,
    season,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    playerCount: 0,
    players: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    // Check if team with same name already exists in this season
    const existingTeam = await req.db.collection(TeamModel.collection)
      .findOne({ name: teamData.name, season });

    if (existingTeam) {
      return res.status(409).json(formatError('Team with this name already exists in this season'));
    }

    // Insert team
    const result = await req.db.collection(TeamModel.collection)
      .insertOne(teamData);

    if (!result.insertedId) {
      throw new Error('Failed to create team');
    }

    // Retrieve created team
    const newTeam = await req.db.collection(TeamModel.collection)
      .findOne({ _id: result.insertedId });

    res.status(201).json(formatResponse(newTeam, 'Team created successfully'));
  } catch (error) {
    throw new Error(`Failed to create team: ${error.message}`);
  }
}
