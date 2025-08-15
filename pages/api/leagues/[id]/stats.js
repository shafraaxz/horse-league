import connectDB from '../../../../lib/mongodb';
import { Player, Match, Team } from '../../../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { id } = req.query;

    // Get top scorers
    const topScorers = await Player.find({ 
      league: id, 
      'stats.goals': { $gt: 0 } 
    })
      .select('name stats.goals team')
      .populate('team', 'name')
      .sort({ 'stats.goals': -1 })
      .limit(10)
      .lean();

    // Get top assists
    const topAssists = await Player.find({ 
      league: id, 
      'stats.assists': { $gt: 0 } 
    })
      .select('name stats.assists team')
      .populate('team', 'name')
      .sort({ 'stats.assists': -1 })
      .limit(10)
      .lean();

    // Get league table data
    const teams = await Team.find({ league: id })
      .select('name logo')
      .lean();

    const leagueTable = [];
    
    for (const team of teams) {
      const matches = await Match.find({
        league: id,
        status: 'finished',
        $or: [{ homeTeam: team._id }, { awayTeam: team._id }]
      }).lean();

      let stats = {
        team: team.name,
        logo: team.logo,
        played: matches.length,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };

      matches.forEach(match => {
        const isHome = match.homeTeam.toString() === team._id.toString();
        const teamScore = isHome ? match.score.home : match.score.away;
        const opponentScore = isHome ? match.score.away : match.score.home;

        stats.goalsFor += teamScore;
        stats.goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          stats.won++;
          stats.points += 3;
        } else if (teamScore === opponentScore) {
          stats.drawn++;
          stats.points += 1;
        } else {
          stats.lost++;
        }
      });

      stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
      leagueTable.push(stats);
    }

    // Sort by points, then goal difference, then goals for
    leagueTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Add position
    leagueTable.forEach((team, index) => {
      team.position = index + 1;
    });

    const statistics = {
      topScorers,
      topAssists,
      leagueTable: leagueTable.slice(0, 10), // Top 10 for stats page
      totalGoals: topScorers.reduce((sum, p) => sum + p.stats.goals, 0),
      averageGoalsPerMatch: matches.length > 0 ? 
        (leagueTable.reduce((sum, t) => sum + t.goalsFor, 0) / leagueTable.reduce((sum, t) => sum + t.played, 0) * 2).toFixed(2) : 0
    };

    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
