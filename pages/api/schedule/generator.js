// pages/api/schedule/generate.js - Fixed Double Round-Robin Generator

import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { 
      leagueId, 
      startDate, 
      timePeriods = ['18:00', '19:30', '21:00'],
      daysBetweenRounds = 7,
      venues = {},
      generateType = 'double-round-robin' // 'double-round-robin' or 'single-round-robin'
    } = req.body;

    if (!leagueId || !startDate) {
      return res.status(400).json({ 
        error: 'League ID and start date are required' 
      });
    }

    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Get all teams in the league
    const teams = await Team.find({ league: leagueId }).sort({ name: 1 });
    
    if (teams.length < 2) {
      return res.status(400).json({ 
        error: 'Need at least 2 teams to generate schedule' 
      });
    }

    console.log(`🎲 Generating ${generateType} schedule for ${teams.length} teams`);

    // Generate the fixtures
    const fixtures = generateDoubleRoundRobinFixtures(teams, generateType);
    
    // Apply dates, times, and venues
    const matches = applyScheduleDetails(fixtures, startDate, timePeriods, daysBetweenRounds, venues);

    // Validate the schedule
    const validation = validateSchedule(matches, teams, generateType);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Generated schedule is invalid', 
        details: validation.errors 
      });
    }

    // Clear existing matches for this league
    await Match.deleteMany({ league: leagueId });

    // Insert all matches
    const createdMatches = await Match.insertMany(
      matches.map(match => ({
        ...match,
        league: leagueId,
        status: 'scheduled',
        score: { home: 0, away: 0, halfTime: { home: 0, away: 0 } },
        events: [],
        liveData: {
          currentMinute: 0,
          isLive: false,
          period: 'first_half'
        },
        statistics: {
          home: { possession: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 },
          away: { possession: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 }
        }
      }))
    );

    // Update league match count
    await League.findByIdAndUpdate(leagueId, {
      matchesCount: createdMatches.length
    });

    console.log(`✅ Successfully generated ${createdMatches.length} matches`);

    // Return summary
    const summary = generateScheduleSummary(createdMatches, teams);

    res.status(201).json({
      success: true,
      message: `Generated ${createdMatches.length} matches for ${generateType}`,
      summary,
      schedule: {
        totalMatches: createdMatches.length,
        totalRounds: Math.max(...matches.map(m => m.round)),
        startDate,
        endDate: matches[matches.length - 1]?.date,
        teamsCount: teams.length,
        format: generateType
      }
    });

  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error.message 
    });
  }
}

// Core fixture generation algorithm
function generateDoubleRoundRobinFixtures(teams, format) {
  console.log(`🏗️ Generating fixtures for ${teams.length} teams`);
  
  let teamsList = [...teams];
  const isOdd = teamsList.length % 2 !== 0;
  
  // Add bye team if odd number of teams
  if (isOdd) {
    teamsList.push({ _id: 'BYE', name: 'BYE' });
  }

  const fixtures = [];
  const numTeams = teamsList.length;
  const numRounds = numTeams - 1;
  
  // Generate first half of season (each team plays each other once)
  for (let round = 0; round < numRounds; round++) {
    const roundFixtures = [];
    
    for (let i = 0; i < numTeams / 2; i++) {
      const home = teamsList[i];
      const away = teamsList[numTeams - 1 - i];
      
      // Skip bye games
      if (home._id !== 'BYE' && away._id !== 'BYE') {
        roundFixtures.push({
          round: round + 1,
          homeTeam: home,
          awayTeam: away,
          isFirstLeg: true
        });
      }
    }
    
    fixtures.push(...roundFixtures);
    
    // Rotate teams (keep first team fixed, rotate others)
    teamsList.splice(1, 0, teamsList.pop());
  }
  
  // Generate second half of season (reverse fixtures) for double round-robin
  if (format === 'double-round-robin') {
    const secondHalfFixtures = fixtures.map(fixture => ({
      round: fixture.round + numRounds,
      homeTeam: fixture.awayTeam,  // Swap home and away
      awayTeam: fixture.homeTeam,
      isFirstLeg: false
    }));
    
    fixtures.push(...secondHalfFixtures);
  }
  
  console.log(`✅ Generated ${fixtures.length} fixtures`);
  return fixtures;
}

// Apply scheduling details (dates, times, venues)
function applyScheduleDetails(fixtures, startDate, timePeriods, daysBetweenRounds, venues) {
  const matches = [];
  let currentDate = new Date(startDate);
  let timeIndex = 0;
  
  // Group fixtures by round
  const fixturesByRound = fixtures.reduce((acc, fixture) => {
    if (!acc[fixture.round]) acc[fixture.round] = [];
    acc[fixture.round].push(fixture);
    return acc;
  }, {});
  
  // Process each round
  Object.keys(fixturesByRound)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(round => {
      const roundFixtures = fixturesByRound[round];
      
      roundFixtures.forEach((fixture, matchIndex) => {
        const venue = venues[fixture.homeTeam._id] || 
                     fixture.homeTeam.stadium || 
                     'TBD';
        
        matches.push({
          homeTeam: fixture.homeTeam._id,
          awayTeam: fixture.awayTeam._id,
          date: currentDate.toISOString().split('T')[0],
          time: timePeriods[timeIndex % timePeriods.length],
          round: parseInt(round),
          matchday: parseInt(round),
          venue: venue,
          referee: '',
          isFirstLeg: fixture.isFirstLeg
        });
        
        timeIndex++;
      });
      
      // Move to next round date
      currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
    });
  
  return matches;
}

// Validate the generated schedule
function validateSchedule(matches, teams, format) {
  const errors = [];
  const teamMatchCounts = {};
  const homeAwayCounts = {};
  const headToHeadMatches = {};
  
  // Initialize counters
  teams.forEach(team => {
    teamMatchCounts[team._id] = 0;
    homeAwayCounts[team._id] = { home: 0, away: 0 };
  });
  
  // Count matches
  matches.forEach(match => {
    const homeId = match.homeTeam;
    const awayId = match.awayTeam;
    
    // Count total matches per team
    teamMatchCounts[homeId]++;
    teamMatchCounts[awayId]++;
    
    // Count home/away matches
    homeAwayCounts[homeId].home++;
    homeAwayCounts[awayId].away++;
    
    // Count head-to-head matches
    const pairKey = [homeId, awayId].sort().join('-');
    if (!headToHeadMatches[pairKey]) {
      headToHeadMatches[pairKey] = [];
    }
    headToHeadMatches[pairKey].push({ home: homeId, away: awayId });
  });
  
  // Validate match counts
  const expectedMatchesPerTeam = format === 'double-round-robin' 
    ? (teams.length - 1) * 2 
    : (teams.length - 1);
  
  teams.forEach(team => {
    const count = teamMatchCounts[team._id];
    if (count !== expectedMatchesPerTeam) {
      errors.push(`Team ${team.name} has ${count} matches, expected ${expectedMatchesPerTeam}`);
    }
  });
  
  // Validate head-to-head matches
  Object.entries(headToHeadMatches).forEach(([pairKey, matches]) => {
    const expectedMatches = format === 'double-round-robin' ? 2 : 1;
    
    if (matches.length !== expectedMatches) {
      errors.push(`Pair ${pairKey} has ${matches.length} matches, expected ${expectedMatches}`);
    }
    
    if (format === 'double-round-robin' && matches.length === 2) {
      // Check that one is home-away and other is away-home
      const match1 = matches[0];
      const match2 = matches[1];
      
      if (match1.home === match2.home) {
        errors.push(`Pair ${pairKey} has same team playing home twice`);
      }
    }
  });
  
  console.log(`🔍 Validation: ${errors.length} errors found`);
  
  return {
    isValid: errors.length === 0,
    errors,
    statistics: {
      totalMatches: matches.length,
      teamsCount: teams.length,
      expectedMatchesPerTeam,
      headToHeadPairs: Object.keys(headToHeadMatches).length
    }
  };
}

// Generate schedule summary
function generateScheduleSummary(matches, teams) {
  const summary = {
    totalMatches: matches.length,
    totalRounds: Math.max(...matches.map(m => m.round)),
    teamsCount: teams.length,
    matchesPerTeam: {},
    venueDistribution: {},
    dateRange: {
      start: Math.min(...matches.map(m => new Date(m.date))),
      end: Math.max(...matches.map(m => new Date(m.date)))
    }
  };
  
  // Count matches per team
  teams.forEach(team => {
    const homeMatches = matches.filter(m => m.homeTeam === team._id).length;
    const awayMatches = matches.filter(m => m.awayTeam === team._id).length;
    
    summary.matchesPerTeam[team.name] = {
      total: homeMatches + awayMatches,
      home: homeMatches,
      away: awayMatches
    };
  });
  
  // Count venue distribution
  matches.forEach(match => {
    const venue = match.venue || 'TBD';
    summary.venueDistribution[venue] = (summary.venueDistribution[venue] || 0) + 1;
  });
  
  return summary;
}

export default authMiddleware(handler);