// api/players/[id].js
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
  sanitizeInput,
  isValidObjectId,
  toObjectId 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { PlayerModel, TransferModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid player ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getPlayer(req, res, id);
        } else if (req.method === 'PUT') {
          return await updatePlayer(req, res, id);
        } else if (req.method === 'DELETE') {
          return await deletePlayer(req, res, id);
        } else {
          res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Player API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/players/[id]
async function getPlayer(req, res, id) {
  try {
    const player = await req.db.collection(PlayerModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!player) {
      return res.status(404).json(formatError('Player not found'));
    }

    // Get player's transfer history
    const transfers = await req.db.collection(TransferModel.collection)
      .find({ playerId: toObjectId(id) })
      .sort({ date: -1 })
      .toArray();

    // Get player's match statistics
    const matches = await req.db.collection('matches')
      .find({ 
        $or: [
          { 'events.playerId': toObjectId(id) }
        ],
        status: 'completed'
      })
      .toArray();

    // Calculate detailed stats
    const detailedStats = calculatePlayerStats(matches, id);

    const response = {
      ...player,
      transfers,
      detailedStats
    };

    res.status(200).json(formatResponse(response, 'Player retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve player: ${error.message}`);
  }
}

// PUT /api/players/[id]
async function updatePlayer(req, res, id) {
  // Validate request body
  const errors = PlayerModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  try {
    // Check if player exists
    const existingPlayer = await req.db.collection(PlayerModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!existingPlayer) {
      return res.status(404).json(formatError('Player not found'));
    }

    // Check email uniqueness if changed
    if (req.body.email && req.body.email !== existingPlayer.email) {
      const emailExists = await req.db.collection(PlayerModel.collection)
        .findOne({ 
          email: req.body.email, 
          season: existingPlayer.season,
          _id: { $ne: toObjectId(id) }
        });

      if (emailExists) {
        return res.status(409).json(formatError('Player with this email already exists in this season'));
      }
    }

    // Sanitize update data
    const updateData = {
      ...req.body,
      name: sanitizeInput(req.body.name),
      email: req.body.email ? sanitizeInput(req.body.email) : null,
      phone: req.body.phone ? sanitizeInput(req.body.phone) : null,
      updatedAt: new Date()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.season;
    delete updateData.createdAt;
    delete updateData.registrationDate;

    // Update player
    const result = await req.db.collection(PlayerModel.collection)
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      throw new Error('Failed to update player');
    }

    res.status(200).json(formatResponse(result.value, 'Player updated successfully'));
  } catch (error) {
    throw new Error(`Failed to update player: ${error.message}`);
  }
}

// DELETE /api/players/[id]
async function deletePlayer(req, res, id) {
  try {
    // Check if player exists
    const player = await req.db.collection(PlayerModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!player) {
      return res.status(404).json(formatError('Player not found'));
    }

    // Check if player is assigned to a team
    if (player.currentTeam && player.status === 'transferred') {
      return res.status(400).json(formatError('Cannot delete player who is currently assigned to a team. Please release the player first.'));
    }

    // Start transaction for data consistency
    const session = req.db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete player
        await req.db.collection(PlayerModel.collection)
          .deleteOne({ _id: toObjectId(id) }, { session });

        // Delete related transfers
        await req.db.collection(TransferModel.collection)
          .deleteMany({ playerId: toObjectId(id) }, { session });

        // Remove player from team roster
        if (player.currentTeamId) {
          await req.db.collection('teams')
            .updateOne(
              { _id: toObjectId(player.currentTeamId) },
              { 
                $pull: { players: toObjectId(id) },
                $inc: { playerCount: -1 }
              },
              { session }
            );
        }
      });

      res.status(200).json(formatResponse(null, 'Player deleted successfully'));
    } catch (transactionError) {
      throw new Error(`Transaction failed: ${transactionError.message}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to delete player: ${error.message}`);
  }
}

