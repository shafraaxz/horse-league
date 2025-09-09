// ===========================================
// FILE: pages/api/admin/update-match-stats.js (FIXED VERSION)
// Updates team statistics when matches are completed
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await dbConnect();

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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

async function updateSingleMatchStats(matchId) {
  const match = await Match.findById(matchId)
    .populate('homeTeam awayTeam season', 'name stats')
    .lean();
    
  if (!match) {
    throw new Error('Match not found');
  }
  
  if (match.status !== 'completed') {
    return { 
      message: 'Match not completed yet', 
      matchStatus: match.status,
      matchId: matchId
    };
  }

  // Validate scores exist
  if (match.homeScore == null || match.awayScore == null) {
    throw new Error('Match scores are missing');
  }
  
  await updateTeamStatsFromMatch(match);
  
  return {
    message: 'Single match stats updated successfully',
    match: {
      id: match._id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      score: `${match.homeScore}-${match.awayScore}`,
      season: match.season?.name
    }
  };
}

async function updateSeasonStats(seasonId) {
  // Validate season exists
  const seasonExists = await Team.findOne({ season: seasonId });
  if (!seasonExists) {
    throw new Error('No teams found for this season');
  }

  // Reset all team stats for the season first
  const teams = await Team.find({ season: seasonId });
  
  for (const team of teams) {
    // Initialize stats object if it doesn't exist
    await Team.findByIdAndUpdate(team._id, {
      $set: {
        'stats.matchesPlayed': 0,
        'stats.wins': 0,
        'stats.draws': 0,
        'stats.losses': 0,
        'stats.goalsFor': 0,
        'stats.goalsAgainst': 0,
        'stats.goalDifference': 0,
        'stats.points': 0
      }
    }, { upsert: true });
  }
  
  // Get all completed matches for the season with valid scores
  const matches = await Match.find({ 
    season: seasonId,
    status: 'completed',
    homeScore: { $exists: true, $ne: null },
    awayScore: { $exists: true, $ne: null }
  }).populate('homeTeam awayTeam season');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      await updateTeamStatsFromMatch(match);
      updatedCount++;
    } catch (error) {
      console.error(`Error updating match ${match._id}:`, error);
      errorCount++;
    }
  }
  
  return {
    message: 'Season stats updated successfully',
    seasonId,
    matchesProcessed: updatedCount,
    teamsUpdated: teams.length,
    errors: errorCount
  };
}

async function updateAllMatchStats() {
  // Reset all team stats first - ensure stats object exists
  await Team.updateMany({}, {
    $set: {
      'stats.matchesPlayed': 0,
      'stats.wins': 0,
      'stats.draws': 0,
      'stats.losses': 0,
      'stats.goalsFor': 0,
      'stats.goalsAgainst': 0,
      'stats.goalDifference': 0,
      'stats.points': 0
    }
  });
  
  // Get all completed matches with valid scores
  const matches = await Match.find({ 
    status: 'completed',
    homeScore: { $exists: true, $ne: null },
    awayScore: { $exists: true, $ne: null }
  }).populate('homeTeam awayTeam season');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      await updateTeamStatsFromMatch(match);
      updatedCount++;
    } catch (error) {
      console.error(`Error updating match ${match._id}:`, error);
      errorCount++;
    }
  }
  
  const totalTeams = await Team.countDocuments();
  
  return {
    message: 'All match stats updated successfully',
    matchesProcessed: updatedCount,
    teamsUpdated: totalTeams,
    errors: errorCount
  };
}

async function updateTeamStatsFromMatch(match) {
  if (!match.homeTeam || !match.awayTeam) {
    throw new Error('Match missing team information');
  }

  const homeScore = parseInt(match.homeScore) || 0;
  const awayScore = parseInt(match.awayScore) || 0;
  const goalDifference = homeScore - awayScore;
  
  // Determine results
  let homeResult, awayResult, homePoints, awayPoints;
  
  if (homeScore > awayScore) {
    // Home win
    homeResult = 'wins';
    awayResult = 'losses';
    homePoints = 3;
    awayPoints = 0;
  } else if (homeScore < awayScore) {
    // Away win
    homeResult = 'losses';
    awayResult = 'wins';
    homePoints = 0;
    awayPoints = 3;
  } else {
    // Draw
    homeResult = 'draws';
    awayResult = 'draws';
    homePoints = 1;
    awayPoints = 1;
  }
  
  // Update home team stats
  const homeUpdate = await Team.findByIdAndUpdate(match.homeTeam._id, {
    $inc: {
      'stats.matchesPlayed': 1,
      [`stats.${homeResult}`]: 1,
      'stats.goalsFor': homeScore,
      'stats.goalsAgainst': awayScore,
      'stats.goalDifference': goalDifference,
      'stats.points': homePoints
    }
  }, { new: true });

  if (!homeUpdate) {
    throw new Error(`Failed to update home team: ${match.homeTeam._id}`);
  }
  
  // Update away team stats
  const awayUpdate = await Team.findByIdAndUpdate(match.awayTeam._id, {
    $inc: {
      'stats.matchesPlayed': 1,
      [`stats.${awayResult}`]: 1,
      'stats.goalsFor': awayScore,
      'stats.goalsAgainst': homeScore,
      'stats.goalDifference': -goalDifference, // Negative for away team
      'stats.points': awayPoints
    }
  }, { new: true });

  if (!awayUpdate) {
    throw new Error(`Failed to update away team: ${match.awayTeam._id}`);
  }
  
  console.log(`✅ Updated stats: ${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}`);
}
