// pages/api/schedule/generate.js - FIXED Double Round-Robin Generator
import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  console.log('🎯 FIXED SCHEDULE GENERATION STARTED');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { leagueId, format, startDate, daysBetween, timePeriods, deleteExisting, venues } = req.body;
    
    // Validate inputs
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }
    
    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }
    
    if (!timePeriods || timePeriods.length === 0) {
      return res.status(400).json({ error: 'At least one time period is required' });
    }
    
    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    // Get teams
    const teams = await Team.find({ league: leagueId }).lean();
    console.log(`👥 Found ${teams.length} teams:`, teams.map(t => t.name));
    
    if (teams.length < 2) {
      return res.status(400).json({ 
        error: `Need at least 2 teams to generate schedule. Found ${teams.length} teams.` 
      });
    }
    
    // Delete existing matches if requested
    if (deleteExisting) {
      console.log('🗑️ Clearing existing matches...');
      const deleteResult = await Match.deleteMany({ league: leagueId });
      console.log(`✅ Deleted ${deleteResult.deletedCount} existing matches`);
    }
    
    // Generate the schedule using proper round-robin algorithm
    console.log('🎲 Generating proper double round-robin schedule...');
    const matches = generateProperDoubleRoundRobin({
      teams,
      format: format || 'double-round-robin',
      startDate,
      daysBetween: parseInt(daysBetween) || 7,
      timePeriods,
      venues: venues || {}
    });
    
    console.log(`📅 Generated ${matches.length} matches`);
    if (matches.length === 0) {
      return res.status(400).json({ error: 'No matches were generated' });
    }
    
    // Validate the schedule
    const validation = validateProperSchedule(matches, teams, format);
    if (!validation.isValid) {
      console.error('❌ Schedule validation failed:', validation.errors);
      return res.status(400).json({ 
        error: 'Generated schedule is invalid', 
        details: validation.errors 
      });
    }
    
    // Prepare matches for database insertion
    const matchesToSave = matches.map((match) => ({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: leagueId,
      date: match.date,
      time: match.time,
      round: match.round,
      matchday: match.round,
      venue: match.venue || 'Manadhoo Futsal Ground',
      referee: '',
      status: 'scheduled',
      score: {
        home: 0,
        away: 0,
        halfTime: { home: 0, away: 0 }
      },
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
    }));
    
    // Save to database
    console.log('💾 Saving matches to database...');
    const savedMatches = await Match.insertMany(matchesToSave);
    console.log(`✅ Successfully saved ${savedMatches.length} matches to database`);
    
    // Update league match count
    await League.findByIdAndUpdate(leagueId, {
      matchesCount: savedMatches.length,
      lastScheduleGenerated: new Date()
    });
    
    // Generate summary
    const summary = generateScheduleSummary(savedMatches, teams);
    
    console.log('🎉 PROPER schedule generation completed successfully!');
    
    return res.status(200).json({
      success: true,
      message: `Proper double round-robin schedule generated! ${savedMatches.length} matches created.`,
      matchesCreated: savedMatches.length,
      data: {
        matchesCreated: savedMatches.length,
        format: format,
        totalRounds: Math.max(...matches.map(m => m.round)),
        summary,
        validation
      }
    });
    
  } catch (error) {
    console.error('💥 Schedule generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during schedule generation',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Schedule generation failed'
    });
  }
}

// ✅ PROPER: Classic Round-Robin Algorithm Implementation
function generateProperDoubleRoundRobin({ teams, format, startDate, daysBetween, timePeriods, venues }) {
  console.log('🏗️ Generating PROPER round-robin fixtures...');
  console.log(`Teams: ${teams.length}, Format: ${format}`);
  
  if (teams.length < 2) {
    console.log('❌ Not enough teams for schedule generation');
    return [];
  }
  
  const teamList = [...teams];
  const numTeams = teamList.length;
  
  // Handle odd number of teams by adding a "bye" placeholder
  const isOdd = numTeams % 2 !== 0;
  if (isOdd) {
    teamList.push({ _id: 'BYE', name: 'BYE' });
  }
  
  const actualTeamCount = teamList.length;
  const totalRounds = actualTeamCount - 1; // Number of rounds in one leg
  
  console.log(`📊 Setup: ${numTeams} real teams, ${actualTeamCount} total (with bye), ${totalRounds} rounds per leg`);
  
  // ✅ STEP 1: Generate first leg (single round-robin)
  const firstLegMatches = generateSingleRoundRobin(teamList, 1);
  
  let allMatches = firstLegMatches;
  
  // ✅ STEP 2: Generate second leg for double round-robin
  if (format === 'double-round-robin') {
    const secondLegMatches = generateSingleRoundRobin(teamList, totalRounds + 1, true);
    allMatches = [...firstLegMatches, ...secondLegMatches];
  }
  
  // ✅ STEP 3: Apply schedule details (dates, times, venues)
  const scheduledMatches = applyScheduleDetails(allMatches, startDate, daysBetween, timePeriods, venues);
  
  console.log(`✅ Generated ${scheduledMatches.length} total matches`);
  return scheduledMatches;
}

// ✅ CLASSIC: Single Round-Robin using the standard algorithm
function generateSingleRoundRobin(teams, startingRound, reverseHomeAway = false) {
  console.log(`🔄 Generating single round-robin starting at round ${startingRound}, reverse: ${reverseHomeAway}`);
  
  const teamCount = teams.length;
  const matches = [];
  const teamsList = [...teams]; // Make a copy
  
  // The classic round-robin algorithm
  for (let round = 0; round < teamCount - 1; round++) {
    const roundMatches = [];
    
    // Generate matches for this round
    for (let i = 0; i < teamCount / 2; i++) {
      const homeIndex = i;
      const awayIndex = teamCount - 1 - i;
      
      const homeTeam = teamsList[homeIndex];
      const awayTeam = teamsList[awayIndex];
      
      // Skip bye matches
      if (homeTeam._id !== 'BYE' && awayTeam._id !== 'BYE') {
        // For second leg, reverse home and away
        const finalHome = reverseHomeAway ? awayTeam : homeTeam;
        const finalAway = reverseHomeAway ? homeTeam : awayTeam;
        
        roundMatches.push({
          round: startingRound + round,
          homeTeam: finalHome._id,
          awayTeam: finalAway._id,
          homeName: finalHome.name,
          awayName: finalAway.name,
          leg: reverseHomeAway ? 'second' : 'first'
        });
      }
    }
    
    matches.push(...roundMatches);
    
    // ✅ CRITICAL: Rotate teams (keep first team fixed, rotate others)
    // This is the key to the round-robin algorithm
    const lastTeam = teamsList.pop(); // Remove last team
    teamsList.splice(1, 0, lastTeam); // Insert after first team
  }
  
  console.log(`   Generated ${matches.length} matches for single round-robin`);
  return matches;
}

// ✅ ENHANCED: Apply scheduling details with better distribution
function applyScheduleDetails(matches, startDate, daysBetween, timePeriods, venues) {
  console.log('📅 Applying schedule details...');
  
  const scheduledMatches = [];
  
  // Group matches by round
  const matchesByRound = {};
  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });
  
  // Process each round
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
  let currentDate = new Date(startDate);
  
  sortedRounds.forEach((roundNum) => {
    const roundMatches = matchesByRound[roundNum];
    console.log(`   Round ${roundNum}: ${roundMatches.length} matches on ${currentDate.toISOString().split('T')[0]}`);
    
    roundMatches.forEach((match, matchIndex) => {
      // Distribute time periods evenly
      const timeIndex = matchIndex % timePeriods.length;
      
      // Select venue (prioritize home team's stadium if available)
      let venue = 'Manadhoo Futsal Ground'; // Default
      if (venues.primary) {
        venue = venues.primary;
      }
      
      scheduledMatches.push({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        round: match.round,
        date: currentDate.toISOString().split('T')[0],
        time: timePeriods[timeIndex],
        venue: venue,
        leg: match.leg
      });
    });
    
    // Move to next round date
    currentDate = new Date(currentDate.getTime() + daysBetween * 24 * 60 * 60 * 1000);
  });
  
  console.log(`✅ Applied schedule details to ${scheduledMatches.length} matches`);
  return scheduledMatches;
}

// ✅ COMPREHENSIVE: Validate the proper schedule
function validateProperSchedule(matches, teams, format) {
  console.log('🔍 Validating proper round-robin schedule...');
  
  const errors = [];
  const teamStats = {};
  const headToHeadMatches = {};
  
  // Initialize team stats
  teams.forEach(team => {
    teamStats[team._id.toString()] = {
      name: team.name,
      totalMatches: 0,
      homeMatches: 0,
      awayMatches: 0,
      opponents: new Set()
    };
  });
  
  // Analyze all matches
  matches.forEach(match => {
    const homeId = match.homeTeam.toString();
    const awayId = match.awayTeam.toString();
    
    // Count matches per team
    if (teamStats[homeId]) {
      teamStats[homeId].totalMatches++;
      teamStats[homeId].homeMatches++;
      teamStats[homeId].opponents.add(awayId);
    }
    
    if (teamStats[awayId]) {
      teamStats[awayId].totalMatches++;
      teamStats[awayId].awayMatches++;
      teamStats[awayId].opponents.add(homeId);
    }
    
    // Track head-to-head matches
    const pairKey = [homeId, awayId].sort().join('-');
    if (!headToHeadMatches[pairKey]) {
      headToHeadMatches[pairKey] = [];
    }
    headToHeadMatches[pairKey].push({
      home: homeId,
      away: awayId,
      round: match.round,
      leg: match.leg
    });
  });
  
  // ✅ VALIDATE: Expected match counts
  const expectedTotal = format === 'double-round-robin' 
    ? (teams.length - 1) * 2 
    : (teams.length - 1);
  
  teams.forEach(team => {
    const stats = teamStats[team._id.toString()];
    
    // Check total matches
    if (stats.totalMatches !== expectedTotal) {
      errors.push(`${team.name}: ${stats.totalMatches} matches (expected ${expectedTotal})`);
    }
    
    // Check opponent coverage
    if (stats.opponents.size !== teams.length - 1) {
      errors.push(`${team.name}: plays against ${stats.opponents.size} opponents (expected ${teams.length - 1})`);
    }
    
    // For double round-robin, check home/away balance
    if (format === 'double-round-robin') {
      const homeAwayDiff = Math.abs(stats.homeMatches - stats.awayMatches);
      if (homeAwayDiff > 1) {
        errors.push(`${team.name}: Unbalanced home/away (${stats.homeMatches}H, ${stats.awayMatches}A)`);
      }
    }
  });
  
  // ✅ VALIDATE: Head-to-head completeness
  const expectedPairs = (teams.length * (teams.length - 1)) / 2;
  if (Object.keys(headToHeadMatches).length !== expectedPairs) {
    errors.push(`Missing team pairs: found ${Object.keys(headToHeadMatches).length}, expected ${expectedPairs}`);
  }
  
  Object.entries(headToHeadMatches).forEach(([pairKey, matches]) => {
    const expectedMatches = format === 'double-round-robin' ? 2 : 1;
    
    if (matches.length !== expectedMatches) {
      errors.push(`Pair ${pairKey}: ${matches.length} matches (expected ${expectedMatches})`);
    }
    
    // For double round-robin, validate home/away swap
    if (format === 'double-round-robin' && matches.length === 2) {
      const homeTeams = matches.map(m => m.home);
      const awayTeams = matches.map(m => m.away);
      
      // Check that each team plays home once and away once
      const teams = Array.from(new Set([...homeTeams, ...awayTeams]));
      if (teams.length === 2) {
        const team1 = teams[0];
        const team2 = teams[1];
        
        const team1Home = matches.filter(m => m.home === team1).length;
        const team2Home = matches.filter(m => m.home === team2).length;
        
        if (team1Home !== 1 || team2Home !== 1) {
          errors.push(`Pair ${pairKey}: Invalid home/away distribution`);
        }
      }
    }
  });
  
  // ✅ VALIDATE: Round distribution
  const roundCounts = {};
  matches.forEach(match => {
    roundCounts[match.round] = (roundCounts[match.round] || 0) + 1;
  });
  
  // Check that rounds are reasonably balanced
  const roundValues = Object.values(roundCounts);
  const maxRoundMatches = Math.max(...roundValues);
  const minRoundMatches = Math.min(...roundValues);
  
  if (maxRoundMatches - minRoundMatches > Math.ceil(teams.length / 2)) {
    errors.push(`Unbalanced round distribution: ${minRoundMatches}-${maxRoundMatches} matches per round`);
  }
  
  console.log(`🔍 Validation result: ${errors.length} errors found`);
  if (errors.length > 0) {
    console.log('❌ Validation errors:', errors);
  } else {
    console.log('✅ Schedule validation passed!');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    statistics: {
      totalMatches: matches.length,
      teamsCount: teams.length,
      expectedMatchesPerTeam: expectedTotal,
      totalRounds: Math.max(...matches.map(m => m.round)),
      pairingsCount: Object.keys(headToHeadMatches).length,
      averageMatchesPerRound: matches.length / Math.max(...matches.map(m => m.round))
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
    dateRange: {
      start: null,
      end: null
    },
    roundDistribution: {},
    venueDistribution: {}
  };
  
  // Count matches per team
  teams.forEach(team => {
    const homeMatches = matches.filter(m => m.homeTeam.toString() === team._id.toString()).length;
    const awayMatches = matches.filter(m => m.awayTeam.toString() === team._id.toString()).length;
    
    summary.matchesPerTeam[team.name] = {
      total: homeMatches + awayMatches,
      home: homeMatches,
      away: awayMatches
    };
  });
  
  // Round and venue distribution
  matches.forEach(match => {
    summary.roundDistribution[match.round] = (summary.roundDistribution[match.round] || 0) + 1;
    summary.venueDistribution[match.venue] = (summary.venueDistribution[match.venue] || 0) + 1;
  });
  
  // Date range
  if (matches.length > 0) {
    const dates = matches.map(m => new Date(m.date)).sort((a, b) => a - b);
    summary.dateRange.start = dates[0].toISOString().split('T')[0];
    summary.dateRange.end = dates[dates.length - 1].toISOString().split('T')[0];
  }
  
  return summary;
}

export default authMiddleware(handler);