// api/transfers/index.js
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
  isValidObjectId,
  toObjectId 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { TransferModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getTransfers(req, res);
        } else if (req.method === 'POST') {
          return await createTransfer(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Transfers API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/transfers
async function getTransfers(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    status,
    transferType,
    team,
    player,
    dateFrom,
    dateTo,
    sortBy = 'date', 
    sortOrder = 'desc' 
  } = req.query;

  const season = req.season || req.query.season;

  // Build query
  const query = buildFilterQuery({
    season,
    status,
    transferType,
    dateFrom,
    dateTo
  });

  // Add team filter
  if (team) {
    query.$or = [
      { fromTeam: new RegExp(sanitizeInput(team), 'i') },
      { toTeam: new RegExp(sanitizeInput(team), 'i') }
    ];
  }

  // Add player filter
  if (player) {
    query.playerName = new RegExp(sanitizeInput(player), 'i');
  }

  // Add search functionality
  if (search) {
    const searchTerm = sanitizeInput(search);
    if (!query.$or) query.$or = [];
    query.$or.push(
      { playerName: new RegExp(searchTerm, 'i') },
      { fromTeam: new RegExp(searchTerm, 'i') },
      { toTeam: new RegExp(searchTerm, 'i') }
    );
  }

  // Pagination
  const { skip, limit: pageLimit } = paginate(page, limit);
  
  // Sort
  const sort = buildSortQuery(sortBy, sortOrder);

  try {
    const [transfers, total] = await Promise.all([
      req.db.collection(TransferModel.collection)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .toArray(),
      req.db.collection(TransferModel.collection).countDocuments(query)
    ]);

    // Get player and team details for each transfer
    const transfersWithDetails = await Promise.all(
      transfers.map(async (transfer) => {
        const [player, fromTeam, toTeam] = await Promise.all([
          transfer.playerId ? 
            req.db.collection('players').findOne({ _id: transfer.playerId }) : null,
          transfer.fromTeamId ? 
            req.db.collection('teams').findOne({ _id: transfer.fromTeamId }) : null,
          transfer.toTeamId ? 
            req.db.collection('teams').findOne({ _id: transfer.toTeamId }) : null
        ]);

        return {
          ...transfer,
          playerDetails: player,
          fromTeamDetails: fromTeam,
          toTeamDetails: toTeam
        };
      })
    );

    const response = {
      transfers: transfersWithDetails,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit)
      },
      filters: {
        season,
        status,
        transferType,
        team,
        player,
        dateFrom,
        dateTo,
        search
      }
    };

    res.status(200).json(formatResponse(response, 'Transfers retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve transfers: ${error.message}`);
  }
}

// POST /api/transfers
async function createTransfer(req, res) {
  // Validate request body
  const errors = TransferModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  const season = req.season || req.body.season || getCurrentSeason();

  try {
    // Verify player exists
    const player = await req.db.collection('players')
      .findOne({ _id: toObjectId(req.body.playerId) });

    if (!player) {
      return res.status(404).json(formatError('Player not found'));
    }

    // Verify destination team exists
    const toTeam = await req.db.collection('teams')
      .findOne({ _id: toObjectId(req.body.toTeamId) });

    if (!toTeam) {
      return res.status(404).json(formatError('Destination team not found'));
    }

    // Get source team if player is currently assigned
    let fromTeam = null;
    if (player.currentTeamId) {
      fromTeam = await req.db.collection('teams')
        .findOne({ _id: player.currentTeamId });
    }

    // Check if player is available for transfer
    if (req.body.transferType !== 'release' && player.status !== 'available') {
      return res.status(400).json(formatError('Player is not available for transfer'));
    }

    // Start transaction
    const session = req.db.client.startSession();

    try {
      let transferResult;

      await session.withTransaction(async () => {
        // Create transfer record
        const transferData = {
          playerId: toObjectId(req.body.playerId),
          playerName: player.name,
          fromTeam: fromTeam?.name || null,
          fromTeamId: fromTeam?._id || null,
          toTeam: toTeam.name,
          toTeamId: toTeam._id,
          fee: req.body.fee || 0,
          transferType: req.body.transferType || 'transfer',
          season,
          date: new Date(),
          status: 'completed',
          notes: req.body.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await req.db.collection(TransferModel.collection)
          .insertOne(transferData, { session });

        if (!result.insertedId) {
          throw new Error('Failed to create transfer record');
        }

        transferResult = { ...transferData, _id: result.insertedId };

        // Update player
        await req.db.collection('players')
          .updateOne(
            { _id: toObjectId(req.body.playerId) },
            {
              $set: {
                currentTeam: toTeam.name,
                currentTeamId: toTeam._id,
                status: 'transferred',
                updatedAt: new Date()
              },
              $push: { transfers: result.insertedId }
            },
            { session }
          );

        // Update source team (remove player)
        if (fromTeam) {
          await req.db.collection('teams')
            .updateOne(
              { _id: fromTeam._id },
              {
                $inc: { playerCount: -1 },
                $pull: { players: toObjectId(req.body.playerId) },
                $set: { updatedAt: new Date() }
              },
              { session }
            );
        }

        // Update destination team (add player)
        await req.db.collection('teams')
          .updateOne(
            { _id: toTeam._id },
            {
              $inc: { playerCount: 1 },
              $addToSet: { players: toObjectId(req.body.playerId) },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
      });

      res.status(201).json(formatResponse(transferResult, 'Transfer completed successfully'));
    } catch (transactionError) {
      throw new Error(`Transfer transaction failed: ${transactionError.message}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to process transfer: ${error.message}`);
  }
}
