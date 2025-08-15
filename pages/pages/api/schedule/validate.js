// pages/api/schedule/validate.js - Validate and analyze existing schedules

import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  try {
    await connectDB();

    const { leagueId } = req.query;

    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    // Get league, teams, and matches
    const [league, teams, matches] = await Promise.all([
      League.findById(leagueId),
      Team.find({ league: leagueId }),
      Match.find({ league: leagueId }).populate('homeTeam awayTeam')
    ]);

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Analyze the current schedule
    const analysis = analyzeSchedule(teams, matches);

    res.status(200).json({
      league: league.name,
      analysis,
      recommendations: generateRecommendations(analysis)
    });

  } catch (error) {
    console.error('Schedule validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate schedule',
      details: error.message 
    });
  }
}

function analyzeSchedule(teams, matches) {
  const analysis = {
    overview: {
      totalTeams: teams.length,
      totalMatches: matches.length,
      scheduledMatches: matches.filter(m => m.status === 'scheduled').length,
      finishedMatches: matches.filter(m => m.status === 'finished').length,
      liveMatches: matches.filter(m => m.status === 'live').length
    },
    balance: {
      isBalanced: true,
      issues: []
    },
    teamStats: {},
    headToHead: {},
    venueDistribution: {},
    timeDistribution: {},
    dateRange: null
  };

  // Initialize team stats
  teams.forEach(team => {
    analysis.teamStats[team._id] = {
      name: team.name,
      totalMatches: 0,
      homeMatches: 0,
      awayMatches: 0,
      opponents: new Set(),
      venues: new Set()
    };
  });

  // Analyze matches
  matches.forEach(match => {
    const homeId = match.homeTeam._id;
    const awayId = match.awayTeam._id;

    // Update team stats
    if (analysis.teamStats[homeId]) {
      analysis.teamStats[homeId].totalMatches++;
      analysis.teamStats[homeId].homeMatches++;
      analysis.teamStats[homeId].opponents.add(awayId.toString());
      if (match.venue) analysis.teamStats[homeId].venues.add(match.venue);
    }

    if (analysis.teamStats[awayId]) {
      analysis.teamStats[awayId].totalMatches++;
      analysis.teamStats[awayId].awayMatches++;
      analysis.teamStats[awayId].opponents.add(homeId.toString());
    }

    // Head-to-head tracking
    const pairKey = [homeId.toString(), awayId.toString()].sort().join('-');
    if (!analysis.headToHead[pairKey]) {
      analysis.headToHead[pairKey] = {
        teams: [
          { id: homeId, name: match.homeTeam.name },
          { id: awayId, name: match.awayTeam.name }
        ],
        matches: []
      };
    }
    analysis.headToHead[pairKey].matches.push({
      home: { id: homeId, name: match.homeTeam.name },
      away: { id: awayId, name: match.awayTeam.name },
      date: match.date,
      round: match.round,
      status: match.status
    });

    // Venue distribution
    const venue = match.venue || 'TBD';
    analysis.venueDistribution[venue] = (analysis.venueDistribution[venue] || 0) + 1;

    // Time distribution
    const time = match.time || 'TBD';
    analysis.timeDistribution[time] = (analysis.timeDistribution[time] || 0) + 1;
  });

  // Convert sets to numbers for team stats
  Object.values(analysis.teamStats).forEach(stats => {
    stats.uniqueOpponents = stats.opponents.size;
    stats.uniqueVenues = stats.venues.size;
    delete stats.opponents;
    delete stats.venues;
  });

  // Check balance
  const teamMatchCounts = Object.values(analysis.teamStats).map(s => s.totalMatches);
  const homeMatchCounts = Object.values(analysis.teamStats).map(s => s.homeMatches);
  const awayMatchCounts = Object.values(analysis.teamStats).map(s => s.awayMatches);

  // Check if all teams have same number of matches
  const minMatches = Math.min(...teamMatchCounts);
  const maxMatches = Math.max(...teamMatchCounts);
  if (maxMatches - minMatches > 1) {
    analysis.balance.isBalanced = false;
    analysis.balance.issues.push(`Uneven match distribution: ${minMatches}-${maxMatches} matches per team`);
  }

  // Check home/away balance
  Object.entries(analysis.teamStats).forEach(([teamId, stats]) => {
    const diff = Math.abs(stats.homeMatches - stats.awayMatches);
    if (diff > 1) {
      analysis.balance.isBalanced = false;
      analysis.balance.issues.push(`${stats.name}: ${stats.homeMatches} home, ${stats.awayMatches} away matches (difference: ${diff})`);
    }
  });

  // Check head-to-head completeness
  Object.entries(analysis.headToHead).forEach(([pairKey, data]) => {
    const matchCount = data.matches.length;
    
    // For double round-robin, should have 2 matches (home and away)
    if (matchCount === 2) {
      const match1 = data.matches[0];
      const match2 = data.matches[1];
      
      // Check if both teams have played home
      const team1Home = data.matches.filter(m => m.home.id.toString() === data.teams[0].id.toString()).length;
      const team2Home = data.matches.filter(m => m.home.id.toString() === data.teams[1].id.toString()).length;
      
      if (team1Home === 0 || team2Home === 0) {
        analysis.balance.isBalanced = false;
        analysis.balance.issues.push(`${data.teams[0].name} vs ${data.teams[1].name}: Missing home/away balance`);
      }
    } else if (matchCount > 2) {
      analysis.balance.isBalanced = false;
      analysis.balance.issues.push(`${data.teams[0].name} vs ${data.teams[1].name}: Too many matches (${matchCount})`);
    } else if (matchCount === 1) {
      // Could be single round-robin or incomplete double round-robin
      analysis.balance.issues.push(`${data.teams[0].name} vs ${data.teams[1].name}: Only 1 match (single round-robin or incomplete)`);
    }
  });

  // Date range
  if (matches.length > 0) {
    const dates = matches.map(m => new Date(m.date)).filter(d => !isNaN(d));
    if (dates.length > 0) {
      analysis.dateRange = {
        start: new Date(Math.min(...dates)).toISOString().split('T')[0],
        end: new Date(Math.max(...dates)).toISOString().split('T')[0],
        duration: Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24))
      };
    }
  }

  return analysis;
}

function generateRecommendations(analysis) {
  const recommendations = [];

  if (!analysis.balance.isBalanced) {
    recommendations.push({
      type: 'warning',
      title: 'Schedule Balance Issues Detected',
      description: 'The current schedule has balance problems that should be fixed.',
      issues: analysis.balance.issues,
      action: 'Consider regenerating the schedule with proper double round-robin format.'
    });
  }

  // Check if schedule looks incomplete
  const expectedMatchesPerTeam = (analysis.overview.totalTeams - 1) * 2; // Double round-robin
  const avgMatchesPerTeam = Object.values(analysis.teamStats).reduce((sum, stats) => sum + stats.totalMatches, 0) / analysis.overview.totalTeams;
  
  if (avgMatchesPerTeam < expectedMatchesPerTeam * 0.8) {
    recommendations.push({
      type: 'info',
      title: 'Schedule Appears Incomplete',
      description: `Teams average ${avgMatchesPerTeam.toFixed(1)} matches, expected ${expectedMatchesPerTeam} for double round-robin.`,
      action: 'Generate additional fixtures to complete the tournament.'
    });
  }

  // Venue distribution recommendations
  const venues = Object.keys(analysis.venueDistribution);
  if (venues.length === 1 && venues[0] === 'TBD') {
    recommendations.push({
      type: 'warning',
      title: 'No Venues Assigned',
      description: 'All matches are set to "TBD" venue.',
      action: 'Assign proper venues to matches, especially highlight Manadhoo Futsal Ground.'
    });
  }

  // Time distribution check
  const times = Object.keys(analysis.timeDistribution);
  if (times.length === 1) {
    recommendations.push({
      type: 'info',
      title: 'Limited Time Slots',
      description: 'All matches are scheduled at the same time.',
      action: 'Consider spreading matches across multiple time slots to accommodate more spectators.'
    });
  }

  // Date range check
  if (analysis.dateRange && analysis.dateRange.duration > 365) {
    recommendations.push({
      type: 'warning',
      title: 'Tournament Duration Too Long',
      description: `Tournament spans ${analysis.dateRange.duration} days (over 1 year).`,
      action: 'Consider reducing time between rounds to complete tournament sooner.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      title: 'Schedule Looks Good!',
      description: 'The current schedule appears balanced and well-structured.',
      action: 'No action needed. Ready for tournament play!'
    });
  }

  return recommendations;
}

export default authMiddleware(handler);