// api/matches/[id]/score.js - Update Live Score
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;
      const { team, action } = req.body; // team: 'home' or 'away', action: 'increment' or 'decrement'

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid match ID'));
      }

      if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      if (!team || !['home', 'away'].includes(team)) {
        return res.status(400).json(formatError('Team must be "home" or "away"'));
      }

      if (!action || !['increment', 'decrement'].includes(action)) {
        return res.status(400).json(formatError('Action must be "increment" or "decrement"'));
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

        // Calculate score update
        const scoreField = team === 'home' ? 'homeScore' : 'awayScore';
        const currentScore = match[scoreField] || 0;
        const increment = action === 'increment' ? 1 : -1;
        const newScore = Math.max(0, currentScore + increment); // Prevent negative scores

        // Update score
        const result = await req.db.collection(MatchModel.collection)
          .findOneAndUpdate(
            { _id: toObjectId(id) },
            { 
              $set: { 
                [scoreField]: newScore,
                updatedAt: new Date()
              }
            },
            { returnDocument: 'after' }
          );

        if (!result.value) {
          throw new Error('Failed to update score');
        }

        res.status(200).json(formatResponse(result.value, 'Score updated successfully'));
      } catch (error) {
        console.error('Update Score API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);
