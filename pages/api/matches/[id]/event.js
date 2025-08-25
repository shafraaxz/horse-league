// api/matches/[id]/event.js - Add Match Event
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;
      const { type, team, player, playerId, time } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid match ID'));
      }

      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      // Validate event data
      if (!type || !['goal', 'assist', 'yellow-card', 'red-card', 'substitution', 'save'].includes(type)) {
        return res.status(400).json(formatError('Invalid event type'));
      }

      if (!team || !['home', 'away'].includes(team)) {
        return res.status(400).json(formatError('Team must be "home" or "away"'));
      }

      if (!player) {
        return res.status(400).json(formatError('Player name is required'));
      }

      try {
        // Check if match exists and is live
        const match = await req.db.collection(MatchModel.collection)
          .findOne({ _id: toObjectId(id) });

        if (!match) {
          return res.status(404).json(formatError('Match not found'));
        }

        if (match.status !== 'live') {
          return res.status(400).json(formatError('Can only add events to live matches'));
        }

        // Create event
        const event = {
          id: new ObjectId(),
          type,
          team,
          player: sanitizeInput(player),
          playerId: playerId ? toObjectId(playerId) : null,
          time: time || match.liveData?.timeElapsed || 0,
          timestamp: new Date()
        };

        // Add event to match
        const result = await req.db.collection(MatchModel.collection)
          .findOneAndUpdate(
            { _id: toObjectId(id) },
            { 
              $push: { events: event },
              $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
          );

        if (!result.value) {
          throw new Error('Failed to add event');
        }

        // Update player statistics if playerId is provided
        if (playerId && isValidObjectId(playerId)) {
          const statUpdates = {};
          
          switch (type) {
            case 'goal':
              statUpdates['stats.goals'] = 1;
              break;
            case 'assist':
              statUpdates['stats.assists'] = 1;
              break;
            case 'yellow-card':
              statUpdates['stats.yellowCards'] = 1;
              break;
            case 'red-card':
              statUpdates['stats.redCards'] = 1;
              break;
            case 'save':
              statUpdates['stats.saves'] = 1;
              break;
          }

          if (Object.keys(statUpdates).length > 0) {
            await req.db.collection('players')
              .updateOne(
                { _id: toObjectId(playerId) },
                { $inc: statUpdates }
              );
          }
        }

        res.status(201).json(formatResponse(event, 'Event added successfully'));
      } catch (error) {
        console.error('Add Event API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);
