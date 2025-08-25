// api/seasons/index.js
import { ObjectId } from 'mongodb';
import { 
  compose, 
  cors, 
  rateLimit, 
  validateBody 
} from '../_lib/middleware.js';
import { 
  formatResponse, 
  formatError, 
  sanitizeInput,
  getCurrentSeason 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { SeasonModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getSeasons(req, res);
        } else if (req.method === 'POST') {
          return await createSeason(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Seasons API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/seasons
async function getSeasons(req, res) {
  const { includeStats = 'false' } = req.query;

  try {
    const seasons = await req.db.collection(SeasonModel.collection)
      .find({})
      .sort({ startYear: -1 })
      .toArray();

    // Include statistics if requested
    let seasonsWithStats = seasons;
    if (includeStats === 'true') {
      seasonsWithStats = await Promise.all(
        seasons.map(async (season) => {
          const [playerCount, teamCount, matchCount, completedMatchCount] = await Promise.all([
            req.db.collection('players').countDocuments({ season: season.id }),
            req.db.collection('teams').countDocuments({ season: season.id }),
            req.db.collection('matches').countDocuments({ season: season.id }),
            req.db.collection('matches').countDocuments({ 
              season: season.id, 
              status: 'completed' 
            })
          ]);

          return {
            ...season,
            stats: {
              totalPlayers: playerCount,
              totalTeams: teamCount,
              totalMatches: matchCount,
              completedMatches: completedMatchCount
            }
          };
        })
      );
    }

    res.status(200).json(formatResponse(seasonsWithStats, 'Seasons retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve seasons: ${error.message}`);
  }
}

// POST /api/seasons
async function createSeason(req, res) {
  // Validate request body
  const errors = SeasonModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  try {
    const startYear = parseInt(req.body.startYear);
    const endYear = startYear + 1;
    const seasonId = `${startYear}/${endYear}`;

    // Check if season already exists
    const existingSeason = await req.db.collection(SeasonModel.collection)
      .findOne({ id: seasonId });

    if (existingSeason) {
      return res.status(409).json(formatError('Season already exists'));
    }

    const seasonData = {
      id: seasonId,
      name: seasonId,
      startYear,
      endYear,
      status: req.body.status || 'upcoming',
      settings: {
        maxPlayersPerTeam: req.body.maxPlayersPerTeam || 20,
        matchDuration: req.body.matchDuration || 40,
        transferWindowStart: req.body.transferWindowStart ? 
          new Date(req.body.transferWindowStart) : null,
        transferWindowEnd: req.body.transferWindowEnd ? 
          new Date(req.body.transferWindowEnd) : null,
        maxTransfersPerSeason: req.body.maxTransfersPerSeason || 10
      },
      stats: {
        totalPlayers: 0,
        totalTeams: 0,
        totalMatches: 0,
        completedMatches: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert season
    const result = await req.db.collection(SeasonModel.collection)
      .insertOne(seasonData);

    if (!result.insertedId) {
      throw new Error('Failed to create season');
    }

    const newSeason = await req.db.collection(SeasonModel.collection)
      .findOne({ _id: result.insertedId });

    res.status(201).json(formatResponse(newSeason, 'Season created successfully'));
  } catch (error) {
    throw new Error(`Failed to create season: ${error.message}`);
  }
}
