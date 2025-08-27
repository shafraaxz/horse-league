// pages/api/standings/[leagueId].js
import dbConnect from '../../../lib/mongodb';
import Standing from '../../../models/Standing';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  const { leagueId } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const standings = await Standing.find({ league: leagueId })
        .populate('team')
        .sort({ points: -1, goalDifference: -1, goalsFor: -1 });
      res.status(200).json({ success: true, data: standings });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Recalculate standings based on matches
      const matches = await Match.find({ 
        league: leagueId, 
        status: 'completed' 
      });

      // Calculate standings logic here
      // This is a simplified version
      const teamStats = {};

      matches.forEach(match => {
        // Initialize teams if not exist
        [match.homeTeam, match.awayTeam].forEach(team => {
          if (!teamStats[team]) {
            teamStats[team] = {
              played: 0, won: 0, drawn: 0, lost: 0,
              goalsFor: 0, goalsAgainst: 0, points: 0
            };
          }
        });

        // Update stats
        teamStats[match.homeTeam].played++;
        teamStats[match.awayTeam].played++;
        teamStats[match.homeTeam].goalsFor += match.homeScore;
        teamStats[match.homeTeam].goalsAgainst += match.awayScore;
        teamStats[match.awayTeam].goalsFor += match.awayScore;
        teamStats[match.awayTeam].goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          teamStats[match.homeTeam].won++;
          teamStats[match.homeTeam].points += 3;
          teamStats[match.awayTeam].lost++;
        } else if (match.awayScore > match.homeScore) {
          teamStats[match.awayTeam].won++;
          teamStats[match.awayTeam].points += 3;
          teamStats[match.homeTeam].lost++;
        } else {
          teamStats[match.homeTeam].drawn++;
          teamStats[match.awayTeam].drawn++;
          teamStats[match.homeTeam].points++;
          teamStats[match.awayTeam].points++;
        }
      });

      // Update standings in database
      for (const [teamId, stats] of Object.entries(teamStats)) {
        await Standing.findOneAndUpdate(
          { league: leagueId, team: teamId },
          {
            ...stats,
            goalDifference: stats.goalsFor - stats.goalsAgainst,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }

      const updatedStandings = await Standing.find({ league: leagueId })
        .populate('team')
        .sort({ points: -1, goalDifference: -1, goalsFor: -1 });

      res.status(200).json({ success: true, data: updatedStandings });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
