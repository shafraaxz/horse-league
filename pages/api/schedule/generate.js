// pages/api/schedule/generate.js
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import League from '../../../models/League';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { leagueId, startDate, matchesPerWeek } = req.body;
    
    const league = await League.findById(leagueId).populate('teams');
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    const teams = league.teams;
    const matches = [];
    let currentDate = new Date(startDate);

    // Round-robin tournament generator
    const numTeams = teams.length;
    const rounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    for (let round = 0; round < rounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = (round + match) % (numTeams - 1);
        let away = (numTeams - 1 - match + round) % (numTeams - 1);
        
        if (match === 0) {
          away = numTeams - 1;
        }

        matches.push({
          league: leagueId,
          round: round + 1,
          homeTeam: teams[home]._id,
          awayTeam: teams[away]._id,
          matchDate: new Date(currentDate),
          status: 'scheduled'
        });

        // Add days between matches
        currentDate.setDate(currentDate.getDate() + Math.floor(7 / matchesPerWeek));
      }
    }

    // Create return matches if league type
    if (league.type === 'league') {
      const returnMatches = matches.map(match => ({
        ...match,
        round: match.round + rounds,
        homeTeam: match.awayTeam,
        awayTeam: match.homeTeam,
        matchDate: new Date(currentDate.setDate(currentDate.getDate() + 7))
      }));
      matches.push(...returnMatches);
    }

    // Save matches to database
    const createdMatches = await Match.insertMany(matches);

    res.status(201).json({ 
      success: true, 
      message: `Generated ${createdMatches.length} matches`,
      data: createdMatches 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}