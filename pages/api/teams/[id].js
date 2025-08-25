// api/teams/[id].js
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
  toObjectId,
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
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid team ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getTeam(req, res, id);
        } else if (req.method === 'PUT') {
          return await updateTeam(req, res, id);
        } else if (req.method === 'DELETE') {
          return await deleteTeam(req, res, id);
        } else {
          res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Team API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/teams/[id]
async function getTeam(req, res, id) {
  try {
    const team = await req.db.collection(TeamModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!team) {
      return res.status(404).json(formatError('Team not found'));
    }

    // Get team roster with detailed player info
    const players = await req.db.collection('players')
      .find({ currentTeamId: toObjectId(id) })
      .toArray();

    // Get team matches
    const matches = await req.db.collection('matches')
      .find({
        $or: [
          { homeTeamId: toObjectId(id) },
          { awayTeamId: toObjectId(id) }
        ],
        season: team.season
      })
      .sort({ date: -1 })
      .toArray();

    // Calculate detailed stats
    const detailedStats = calculateTeamStats(matches);

    // Get recent transfers
    const transfers = await req.db.collection('transfers')
      .find({ 
        $or: [
          { fromTeamId: toObjectId(id) },
          { toTeamId: toObjectId(id) }
        ]
      })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    const response = {
      ...team,
      roster: players,
      matches,
      detailedStats,
      recentTransfers: transfers
    };

    res.status(200).json(formatResponse(response, 'Team retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve team: ${error.message}`);
  }
}

// PUT /api/teams/[id]
async function updateTeam(req, res, id) {
  // Validate request body
  const errors = TeamModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  try {
    // Check if team exists
    const existingTeam = await req.db.collection(TeamModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!existingTeam) {
      return res.status(404).json(formatError('Team not found'));
    }

    // Check name uniqueness if changed
    if (req.body.name && req.body.name !== existingTeam.name) {
      const nameExists = await req.db.collection(TeamModel.collection)
        .findOne({ 
          name: req.body.name, 
          season: existingTeam.season,
          _id: { $ne: toObjectId(id) }
        });

      if (nameExists) {
        return res.status(409).json(formatError('Team with this name already exists in this season'));
      }
    }

    // Sanitize update data
    const updateData = {
      ...req.body,
      name: req.body.name ? sanitizeInput(req.body.name) : existingTeam.name,
      coach: req.body.coach ? sanitizeInput(req.body.coach) : existingTeam.coach,
      description: req.body.description ? sanitizeInput(req.body.description) : existingTeam.description,
      updatedAt: new Date()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.season;
    delete updateData.createdAt;
    delete updateData.players;
    delete updateData.playerCount;

    // Update team
    const result = await req.db.collection(TeamModel.collection)
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      throw new Error('Failed to update team');
    }

    res.status(200).json(formatResponse(result.value, 'Team updated successfully'));
  } catch (error) {
    throw new Error(`Failed to update team: ${error.message}`);
  }
}

// DELETE /api/teams/[id]
async function deleteTeam(req, res, id) {
  try {
    // Check if team exists
    const team = await req.db.collection(TeamModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!team) {
      return res.status(404).json(formatError('Team not found'));
    }

    // Check if team has players
    const playerCount = await req.db.collection('players')
      .countDocuments({ currentTeamId: toObjectId(id) });

    if (playerCount > 0) {
      return res.status(400).json(formatError('Cannot delete team with active players. Please release all players first.'));
    }

    // Check if team has scheduled matches
    const upcomingMatches = await req.db.collection('matches')
      .countDocuments({
        $or: [
          { homeTeamId: toObjectId(id) },
          { awayTeamId: toObjectId(id) }
        ],
        status: { $in: ['scheduled', 'live'] }
      });

    if (upcomingMatches > 0) {
      return res.status(400).json(formatError('Cannot delete team with scheduled or live matches.'));
    }

    // Start transaction for data consistency
    const session = req.db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete team
        await req.db.collection(TeamModel.collection)
          .deleteOne({ _id: toObjectId(id) }, { session });

        // Update completed matches to remove team references
        await req.db.collection('matches')
          .updateMany(
            {
              $or: [
                { homeTeamId: toObjectId(id) },
                { awayTeamId: toObjectId(id) }
              ],
              status: 'completed'
            },
            {
              $unset: { homeTeamId: '', awayTeamId: '' }
            },
            { session }
          );
      });

      res.status(200).json(formatResponse(null, 'Team deleted successfully'));
    } catch (transactionError) {
      throw new Error(`Transaction failed: ${transactionError.message}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to delete team: ${error.message}`);
  }
}