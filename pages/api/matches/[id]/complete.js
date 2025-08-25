// api/matches/[id]/complete.js - Complete Match
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid match ID'));
      }

      if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      try {
        // Check if match exists and is live
        const match = await req.db.collection(MatchModel.collection)
          .findOne({ _id: toObjectId(id) });

        if (!match) {
          return res.status(404).json(formatError('Match not found'));
        }

        if (match.status !== 'live') {
          return res.status(400).json(formatError('Match is not live'));
        }

        // Start transaction for data consistency
        const session = req.db.client.startSession();

        try {
          await session.withTransaction(async () => {
            // Complete match
            await req.db.collection(MatchModel.collection)
              .updateOne(
                { _id: toObjectId(id) },
                {
                  $set: {
                    status: 'completed',
                    'liveData.isLive': false,
                    'liveData.isRunning': false,
                    'liveData.endTime': new Date(),
                    updatedAt: new Date()
                  }
                },
                { session }
              );

            // Update team statistics
            const homeScore = match.homeScore || 0;
            const awayScore = match.awayScore || 0;

            // Home team updates
            const homeTeamUpdates = {
              $inc: {
                goalsFor: homeScore,
                goalsAgainst: awayScore
              }
            };

            if (homeScore > awayScore) {
              homeTeamUpdates.$inc.wins = 1;
              homeTeamUpdates.$inc.points = 3;
            } else if (homeScore < awayScore) {
              homeTeamUpdates.$inc.losses = 1;
            } else {
              homeTeamUpdates.$inc.draws = 1;
              homeTeamUpdates.$inc.points = 1;
            }

            await req.db.collection('teams')
              .updateOne({ _id: match.homeTeamId }, homeTeamUpdates, { session });

            // Away team updates
            const awayTeamUpdates = {
              $inc: {
                goalsFor: awayScore,
                goalsAgainst: homeScore
              }
            };

            if (awayScore > homeScore) {
              awayTeamUpdates.$inc.wins = 1;
              awayTeamUpdates.$inc.points = 3;
            } else if (awayScore < homeScore) {
              awayTeamUpdates.$inc.losses = 1;
            } else {
              awayTeamUpdates.$inc.draws = 1;
              awayTeamUpdates.$inc.points = 1;
            }

            await req.db.collection('teams')
              .updateOne({ _id: match.awayTeamId }, awayTeamUpdates, { session });

            // Update player match counts
            const playerIds = [...new Set(
              (match.events || [])
                .filter(event => event.playerId)
                .map(event => event.playerId)
            )];

            if (playerIds.length > 0) {
              await req.db.collection('players')
                .updateMany(
                  { _id: { $in: playerIds } },
                  { $inc: { 'stats.matches': 1 } },
                  { session }
                );
            }
          });

          // Get updated match
          const updatedMatch = await req.db.collection(MatchModel.collection)
            .findOne({ _id: toObjectId(id) });

          res.status(200).json(formatResponse(updatedMatch, 'Match completed successfully'));
        } catch (transactionError) {
          throw new Error(`Transaction failed: ${transactionError.message}`);
        } finally {
          await session.endSession();
        }
      } catch (error) {
        console.error('Complete Match API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);