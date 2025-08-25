// api/players/stats/[id].js
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid player ID'));
      }

      if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      try {
        // Get player
        const player = await req.db.collection(PlayerModel.collection)
          .findOne({ _id: toObjectId(id) });

        if (!player) {
          return res.status(404).json(formatError('Player not found'));
        }

        // Get all matches where player participated
        const matches = await req.db.collection('matches')
          .find({ 
            $or: [
              { 'events.playerId': toObjectId(id) }
            ],
            season: player.season
          })
          .sort({ date: -1 })
          .toArray();

        // Calculate comprehensive stats
        const stats = {
          basic: player.stats || {},
          seasonal: calculatePlayerStats(matches, id),
          matchHistory: matches.map(match => ({
            id: match._id,
            date: match.date,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            events: match.events?.filter(event => 
              event.playerId?.toString() === id
            ) || []
          })),
          performance: {
            goalsPerMatch: matches.length > 0 ? (player.stats?.goals || 0) / matches.length : 0,
            assistsPerMatch: matches.length > 0 ? (player.stats?.assists || 0) / matches.length : 0,
            totalMatches: matches.length,
            winRate: calculateWinRate(matches, player.currentTeam)
          }
        };

        res.status(200).json(formatResponse(stats, 'Player statistics retrieved successfully'));
      } catch (error) {
        console.error('Player Stats API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

function calculateWinRate(matches, team) {
  if (!team || matches.length === 0) return 0;

  const completedMatches = matches.filter(match => 
    match.status === 'completed' && 
    (match.homeTeam === team || match.awayTeam === team)
  );

  if (completedMatches.length === 0) return 0;

  const wins = completedMatches.filter(match => {
    if (match.homeTeam === team) {
      return match.homeScore > match.awayScore;
    } else {
      return match.awayScore > match.homeScore;
    }
  }).length;

  return (wins / completedMatches.length) * 100;
}