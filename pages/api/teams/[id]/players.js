// api/teams/[id]/players.js
import { ObjectId } from 'mongodb';
import { 
  compose, 
  cors, 
  rateLimit 
} from '../../_lib/middleware.js';
import { 
  formatResponse, 
  formatError, 
  isValidObjectId,
  toObjectId 
} from '../../_lib/utils.js';
import { withDatabase } from '../../_lib/mongodb.js';
import { TeamModel } from '../../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid team ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getTeamPlayers(req, res, id);
        } else if (req.method === 'POST') {
          return await addPlayerToTeam(req, res, id);
        } else if (req.method === 'DELETE') {
          return await removePlayerFromTeam(req, res, id);
        } else {
          res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Team Players API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/teams/[id]/players
async function getTeamPlayers(req, res, id) {
  try {
    const team = await req.db.collection(TeamModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!team) {
      return res.status(404).json(formatError('Team not found'));
    }

    const players = await req.db.collection('players')
      .find({ currentTeamId: toObjectId(id) })
      .toArray();

    // Group players by position
    const playersByPosition = players.reduce((acc, player) => {
      if (!acc[player.position]) {
        acc[player.position] = [];
      }
      acc[player.position].push(player);
      return acc;
    }, {});

    const response = {
      team: {
        _id: team._id,
        name: team.name,
        season: team.season
      },
      players,
      playersByPosition,
      totalPlayers: players.length,
      positionCounts: {
        Goalkeeper: playersByPosition.Goalkeeper?.length || 0,
        Defender: playersByPosition.Defender?.length || 0,
        Midfielder: playersByPosition.Midfielder?.length || 0,
        Forward: playersByPosition.Forward?.length || 0
      }
    };

    res.status(200).json(formatResponse(response, 'Team players retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve team players: ${error.message}`);
  }
}

// POST /api/teams/[id]/players
async function addPlayerToTeam(req, res, id) {
  const { playerId } = req.body;

  if (!playerId || !isValidObjectId(playerId)) {
    return res.status(400).json(formatError('Valid player ID is required'));
  }

  try {
    // Check if team exists
    const team = await req.db.collection(TeamModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!team) {
      return res.status(404).json(formatError('Team not found'));
    }

    // Check if player exists and is available
    const player = await req.db.collection('players')
      .findOne({ _id: toObjectId(playerId) });

    if (!player) {
      return res.status(404).json(formatError('Player not found'));
    }

    if (player.status !== 'available') {
      return res.status(400).json(formatError('Player is not available for transfer'));
    }

    // Check team capacity (optional limit)
    const maxPlayersPerTeam = 20; // Configure as needed
    if (team.playerCount >= maxPlayersPerTeam) {
      return res.status(400).json(formatError(`Team has reached maximum capacity of ${maxPlayersPerTeam} players`));
    }

    // Start transaction
    const session = req.db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Update player
        await req.db.collection('players')
          .updateOne(
            { _id: toObjectId(playerId) },
            {
              $set: {
                currentTeam: team.name,
                currentTeamId: toObjectId(id),
                status: 'transferred',
                updatedAt: new Date()
              }
            },
            { session }
          );

        // Update team
        await req.db.collection(TeamModel.collection)
          .updateOne(
            { _id: toObjectId(id) },
            {
              $inc: { playerCount: 1 },
              $addToSet: { players: toObjectId(playerId) },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

        // Create transfer record
        await req.db.collection('transfers')
          .insertOne({
            playerId: toObjectId(playerId),
            playerName: player.name,
            fromTeam: null,
            fromTeamId: null,
            toTeam: team.name,
            toTeamId: toObjectId(id),
            fee: req.body.fee || 0,
            transferType: req.body.transferType || 'transfer',
            season: team.season,
            date: new Date(),
            status: 'completed',
            notes: req.body.notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
          }, { session });
      });

      res.status(200).json(formatResponse(null, 'Player added to team successfully'));
    } catch (transactionError) {
      throw new Error(`Transaction failed: ${transactionError.message}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to add player to team: ${error.message}`);
  }
}

// DELETE /api/teams/[id]/players
async function removePlayerFromTeam(req, res, id) {
  const { playerId } = req.query;

  if (!playerId || !isValidObjectId(playerId)) {
    return res.status(400).json(formatError('Valid player ID is required'));
  }

  try {
    // Check if team exists
    const team = await req.db.collection(TeamModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!team) {
      return res.status(404).json(formatError('Team not found'));
    }

    // Check if player exists and is in this team
    const player = await req.db.collection('players')
      .findOne({ 
        _id: toObjectId(playerId),
        currentTeamId: toObjectId(id)
      });

    if (!player) {
      return res.status(404).json(formatError('Player not found in this team'));
    }

    // Start transaction
    const session = req.db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Update player - release from team
        await req.db.collection('players')
          .updateOne(
            { _id: toObjectId(playerId) },
            {
              $set: {
                currentTeam: null,
                currentTeamId: null,
                status: 'available',
                updatedAt: new Date()
              }
            },
            { session }
          );

        // Update team
        await req.db.collection(TeamModel.collection)
          .updateOne(
            { _id: toObjectId(id) },
            {
              $inc: { playerCount: -1 },
              $pull: { players: toObjectId(playerId) },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

        // Create release record
        await req.db.collection('transfers')
          .insertOne({
            playerId: toObjectId(playerId),
            playerName: player.name,
            fromTeam: team.name,
            fromTeamId: toObjectId(id),
            toTeam: null,
            toTeamId: null,
            fee: 0,
            transferType: 'release',
            season: team.season,
            date: new Date(),
            status: 'completed',
            notes: req.body?.notes || 'Player released from team',
            createdAt: new Date(),
            updatedAt: new Date()
          }, { session });
      });

      res.status(200).json(formatResponse(null, 'Player removed from team successfully'));
    } catch (transactionError) {
      throw new Error(`Transaction failed: ${transactionError.message}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to remove player from team: ${error.message}`);
  }
}