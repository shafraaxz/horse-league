// api/transfers/[id].js
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid transfer ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getTransfer(req, res, id);
        } else if (req.method === 'DELETE') {
          return await deleteTransfer(req, res, id);
        } else {
          res.setHeader('Allow', ['GET', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Transfer API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/transfers/[id]
async function getTransfer(req, res, id) {
  try {
    const transfer = await req.db.collection(TransferModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!transfer) {
      return res.status(404).json(formatError('Transfer not found'));
    }

    // Get related data
    const [player, fromTeam, toTeam] = await Promise.all([
      transfer.playerId ? 
        req.db.collection('players').findOne({ _id: transfer.playerId }) : null,
      transfer.fromTeamId ? 
        req.db.collection('teams').findOne({ _id: transfer.fromTeamId }) : null,
      transfer.toTeamId ? 
        req.db.collection('teams').findOne({ _id: transfer.toTeamId }) : null
    ]);

    const response = {
      ...transfer,
      playerDetails: player,
      fromTeamDetails: fromTeam,
      toTeamDetails: toTeam
    };

    res.status(200).json(formatResponse(response, 'Transfer retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve transfer: ${error.message}`);
  }
}

// DELETE /api/transfers/[id] - Cancel/Reverse Transfer
async function deleteTransfer(req, res, id) {
  try {
    const transfer = await req.db.collection(TransferModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!transfer) {
      return res.status(404).json(formatError('Transfer not found'));
    }

    if (transfer.status !== 'completed') {
      return res.status(400).json(formatError('Can only reverse completed transfers'));
    }

    // Start transaction to reverse the transfer
    const session = req.db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete transfer record
        await req.db.collection(TransferModel.collection)
          .deleteOne({ _id: toObjectId(id) }, { session });

        // Revert player status
        const playerUpdate = {
          currentTeam: transfer.fromTeam,
          currentTeamId: transfer.fromTeamId,
          status: transfer.fromTeam ? 'transferred' : 'available',
          updatedAt: new Date()
        };

        await req.db.collection('players')
          .updateOne(
            { _id: transfer.playerId },
            { 
              $set: playerUpdate,
              $pull: { transfers: toObjectId(id) }
            },
            { session }
          );

        // Revert team changes
        if (transfer.fromTeamId) {
          await req.db.collection('teams')
            .updateOne(
              { _id: transfer.fromTeamId },
              {
                $inc: { playerCount: 1 },
                $addToSet: { players: transfer.playerId }
              },
              { session }
            );
        }

        await req.db.collection('teams')
          .updateOne(
            { _id: transfer.toTeamId },
            {
              $inc: { playerCount: -1 },
              $pull: { players: transfer.playerId }
            },
            { session }
          );
      });

      res.status(200).json(formatResponse(null, 'Transfer reversed successfully'));
    } catch (transactionError) {
      throw new Error(`Reverse transaction failed: ${transactionError.message}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to reverse transfer: ${error.message}`);
  }
}