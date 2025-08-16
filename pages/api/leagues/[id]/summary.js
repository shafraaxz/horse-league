// pages/api/leagues/[id]/summary.js - FIXED: No match limit
import connectDB from '../../../../lib/mongodb';
import { League, Team, Player, Match } from '../../../../lib/models';

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    console.log('📊 Fetching summary for league:', id);

    // Get league info
    const league = await League.findById(id);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Get all related data in parallel - NO LIMITS
    const [teams, players, matches] = await Promise.all([
      Team.find({ league: id }).sort({ name: 1 }),
      Player.find({ league: id }).populate('team', 'name'),
      // ✅ FIXED: Remove any limits - get ALL matches
      Match.find({ league: id })
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .sort({ date: 1, time: 1 })
        // NO .limit() here!
    ]);

    console.log(`📊 League data loaded:`);
    console.log(`  - Teams: ${teams.length}`);
    console.log(`  - Players: ${players.length}`);
    console.log(`  - Matches: ${matches.length}`); // This should show all matches now

    // Calculate statistics
    const liveMatches = matches.filter(m => m.status === 'live');
    const finishedMatches = matches.filter(m => m.status === 'finished');
    const scheduledMatches = matches.filter(m => m.status === 'scheduled');

    // Top scorers
    const topScorers = players
      .filter(p => p.stats && p.stats.goals > 0)
      .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
      .slice(0, 10);

    // League table calculation
    const leagueTable = calculateLeagueTable(teams, finishedMatches);

    const summary = {
      league: {
        _id: league._id,
        name: league.name,
        description: league.description,
        logo: league.logo,
        season: league.season,
        status: league.status
      },
      teams,
      players,
      matches, // ALL matches, not limited
      liveMatches,
      statistics: {
        totalTeams: teams.length,
        totalPlayers: players.length,
        totalMatches: matches.length,
        liveCount: liveMatches.length,
        finishedMatches: finishedMatches.length,
        scheduledMatches: scheduledMatches.length,
        topScorers
      },
      leagueTable
    };

    console.log(`✅ League summary generated: ${teams.length} teams, ${matches.length} matches (ALL MATCHES)`);
    return res.status(200).json(summary);
  } catch (error) {
    console.error('❌ Error generating league summary:', error);
    return res.status(500).json({ 
      error: 'Failed to generate league summary',
      details: error.message 
    });
  }
}

function calculateLeagueTable(teams, finishedMatches) {
  const table = teams.map(team => ({
    team: {
      _id: team._id,
      name: team.name,
      logo: team.logo
    },
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));

  finishedMatches.forEach(match => {
    const homeIndex = table.findIndex(t => t.team._id.toString() === match.homeTeam._id.toString());
    const awayIndex = table.findIndex(t => t.team._id.toString() === match.awayTeam._id.toString());

    if (homeIndex !== -1 && awayIndex !== -1) {
      const homeScore = match.score?.home || 0;
      const awayScore = match.score?.away || 0;

      // Update home team
      table[homeIndex].played++;
      table[homeIndex].goalsFor += homeScore;
      table[homeIndex].goalsAgainst += awayScore;

      // Update away team
      table[awayIndex].played++;
      table[awayIndex].goalsFor += awayScore;
      table[awayIndex].goalsAgainst += homeScore;

      // Determine result
      if (homeScore > awayScore) {
        table[homeIndex].won++;
        table[homeIndex].points += 3;
        table[awayIndex].lost++;
      } else if (homeScore < awayScore) {
        table[awayIndex].won++;
        table[awayIndex].points += 3;
        table[homeIndex].lost++;
      } else {
        table[homeIndex].drawn++;
        table[awayIndex].drawn++;
        table[homeIndex].points += 1;
        table[awayIndex].points += 1;
      }
    }
  });

  // Calculate goal difference and sort
  table.forEach(team => {
    team.goalDifference = team.goalsFor - team.goalsAgainst;
  });

  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}