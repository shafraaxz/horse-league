// api/matches/live/index.js - Live Matches Management
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getLiveMatches(req, res);
        } else {
          res.setHeader('Allow', ['GET']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Live Matches API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/matches/live
async function getLiveMatches(req, res) {
  const season = req.season || req.query.season;

  try {
    const query = {
      status: 'live',
      'liveData.isLive': true
    };

    if (season) {
      query.season = season;
    }

    const liveMatches = await req.db.collection(MatchModel.collection)
      .find(query)
      .sort({ 'liveData.startTime': -1 })
      .toArray();

    // Get team details for each match
    const matchesWithDetails = await Promise.all(
      liveMatches.map(async (match) => {
        const [homeTeam, awayTeam] = await Promise.all([
          req.db.collection('teams').findOne({ _id: match.homeTeamId }),
          req.db.collection('teams').findOne({ _id: match.awayTeamId })
        ]);

        return {
          ...match,
          homeTeamDetails: homeTeam,
          awayTeamDetails: awayTeam
        };
      })
    );

    res.status(200).json(formatResponse(matchesWithDetails, 'Live matches retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve live matches: ${error.message}`);
  }
}
