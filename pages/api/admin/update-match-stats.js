// ===========================================
// FILE: pages/api/admin/update-match-stats.js
// Updates team statistics when matches are completed
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { matchId, seasonId } = req.body;
    
    // If specific match provided, update just that match
    if (matchId) {
      const result = await updateSingleMatchStats(matchId);
      return res.status(200).json(result);
    }
    
    // If season provided, update all matches in that season
    if (seasonId) {
      const result = await updateSeasonStats(seasonId);
      return res.status(200).json(result);
    }
    
    // Update all completed matches
    const result = await updateAllMatchStats();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error updating match stats:', error);
    res.status(500).json({ 
      message: 'Error updating match stats',
      error: error.message 
    });
  }
}

async function updateSingleMatchStats(matchId) {
  const match = await Match.findById(matchId)
    .populate('homeTeam awayTeam', 'name stats')
    .lean();
    
  if (!match) {
    throw new Error('Match not found');
  }
  
  if (match.status !== 'completed') {
    return { message: 'Match not completed yet', match: match.status };
  }
  
  await updateTeamStatsFromMatch(match);
  
  return {
    message: 'Single match stats updated',
    match: {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      score: `${match.homeScore}-${match.awayScore}`
    }
  };
}

async function updateSeasonStats(seasonId) {
  // Reset all team stats for the season first
  const teams = await Team.find({ season: seasonId });
  
  for (const team of teams) {
    await Team.findByIdAndUpdate(team._id, {
      stats: {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }
    });
  }
  
  // Get all completed matches for the season
  const matches = await Match.find({ 
    season: seasonId,
    status: 'completed'
  }).populate('homeTeam awayTeam');
  
  let updatedCount = 0;
  
  for (const match of matches) {
    await updateTeamStatsFromMatch(match);
    updatedCount++;
  }
  
  return {
    message: 'Season stats updated',
    seasonId,
    matchesProcessed: updatedCount,
    teamsUpdated: teams.length
  };
}

async function updateAllMatchStats() {
  // Reset all team stats first
  await Team.updateMany({}, {
    stats: {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    }
  });
  
  // Get all completed matches
  const matches = await Match.find({ status: 'completed' })
    .populate('homeTeam awayTeam');
  
  let updatedCount = 0;
  
  for (const match of matches) {
    await updateTeamStatsFromMatch(match);
    updatedCount++;
  }
  
  const totalTeams = await Team.countDocuments();
  
  return {
    message: 'All match stats updated',
    matchesProcessed: updatedCount,
    teamsUpdated: totalTeams
  };
}

async function updateTeamStatsFromMatch(match) {
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  
  // Determine results
  let homeResult, awayResult, homePoints, awayPoints;
  
  if (homeScore > awayScore) {
    // Home win
    homeResult = 'win';
    awayResult = 'loss';
    homePoints = 3;
    awayPoints = 0;
  } else if (homeScore < awayScore) {
    // Away win
    homeResult = 'loss';
    awayResult = 'win';
    homePoints = 0;
    awayPoints = 3;
  } else {
    // Draw
    homeResult = 'draw';
    awayResult = 'draw';
    homePoints = 1;
    awayPoints = 1;
  }
  
  // Update home team stats
  await Team.findByIdAndUpdate(match.homeTeam._id, {
    $inc: {
      'stats.matchesPlayed': 1,
      [`stats.${homeResult}s`]: 1,
      'stats.goalsFor': homeScore,
      'stats.goalsAgainst': awayScore,
      'stats.points': homePoints
    }
  });
  
  // Update away team stats
  await Team.findByIdAndUpdate(match.awayTeam._id, {
    $inc: {
      'stats.matchesPlayed': 1,
      [`stats.${awayResult}s`]: 1,
      'stats.goalsFor': awayScore,
      'stats.goalsAgainst': homeScore,
      'stats.points': awayPoints
    }
  });
  
  console.log(`Updated stats: ${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}`);
}
