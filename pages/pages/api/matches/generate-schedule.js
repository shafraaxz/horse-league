// pages/api/schedule/generate.js - FINAL CORRECT Double Round-Robin Generator
import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  console.log('🏆 FINAL CORRECT SCHEDULE GENERATION STARTED');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { 
      leagueId, 
      format = 'double-round-robin',
      startDate, 
      daysBetween = 7,
      timePeriods = ['18:00', '19:30'],
      deleteExisting = true,
      venues = {}
    } = req.body;
    
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
    const teams = await Team.find({ league: leagueId }).sort({ name: 1 }).lean();
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
    
    // Generate the schedule using CORRECT round-robin algorithm
    console.log(`🎯 Generating CORRECT ${format} schedule...`);
    const matches = generateCorrectRoundRobin({
      teams,
      format,
      startDate,
      daysBetween: parseInt(daysBetween),
      timePeriods,
      venues
    });
    
    console.log(`📅 Generated ${matches.length} matches`);
    if (matches.length === 0) {
      return res.status(400).json({ error: 'No matches were generated' });
    }
    
    // Validate the schedule
    const validation = validateCorrectSchedule(matches, teams, format);
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
    
    console.log('🎉 CORRECT schedule generation completed successfully!');
    
    return res.status(200).json({
      success: true,
      message: `Perfect ${format} schedule generated! ${savedMatches.length} matches created.`,
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

// ✅ CORRECT: True Round-Robin Algorithm Implementation with Fair Distribution
function generateCorrectRoundRobin({ teams, format, startDate, daysBetween, timePeriods, venues }) {
  console.log('🏗️ Generating CORRECT round-robin fixtures with fair distribution...');
  console.log(`Teams: ${teams.length}, Format: ${format}`);
  
  if (teams.length < 2) {
    console.log('❌ Not enough teams for schedule generation');
    return [];
  }
  
  // ✅ RANDOMIZE: Shuffle team order to ensure fairness
  const teamList = [...teams];
  
  // Fisher-Yates shuffle to randomize team positions
  for (let i = teamList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teamList[i], teamList[j]] = [teamList[j], teamList[i]];
  }
  
  console.log('🎲 Team order randomized for fair distribution');
  console.log('📋 Randomized order:', teamList.map(t => t.name));
  
  const numTeams = teamList.length;
  
  // Handle odd number of teams by adding a "bye" placeholder
  const isOdd = numTeams % 2 !== 0;
  if (isOdd) {
    teamList.push({ _id: 'BYE', name: 'BYE' });
  }
  
  const actualTeamCount = teamList.length;
  const roundsPerLeg = actualTeamCount - 1; // Standard round-robin: n-1 rounds
  
  console.log(`📊 Setup: ${numTeams} real teams, ${actualTeamCount} total (with bye), ${roundsPerLeg} rounds per leg`);
  
  // ✅ STEP 1: Generate first leg using classic round-robin algorithm
  const firstLegMatches = generateSingleRoundRobinLeg(teamList, 1);
  
  let allMatches = firstLegMatches;
  
  // ✅ STEP 2: Generate second leg for double round-robin (home/away reversed)
  if (format === 'double-round-robin') {
    const secondLegMatches = generateSingleRoundRobinLeg(teamList, roundsPerLeg + 1, true);
    allMatches = [...firstLegMatches, ...secondLegMatches];
  }
  
  // ✅ STEP 3: Apply schedule details with randomized distribution
  const scheduledMatches = applyFairScheduleDetails(allMatches, startDate, daysBetween, timePeriods, venues);
  
  console.log(`✅ Generated ${scheduledMatches.length} total matches with fair distribution`);
  return scheduledMatches;
}

// ✅ CLASSIC: Single Round-Robin Leg using the standard rotating algorithm
function generateSingleRoundRobinLeg(teams, startingRound, reverseHomeAway = false) {
  console.log(`🔄 Generating single round-robin leg starting at round ${startingRound}, reverse: ${reverseHomeAway}`);
  
  const teamCount = teams.length;
  const matches = [];
  const teamsList = [...teams]; // Make a copy to avoid mutation
  
  // ✅ CLASSIC ROUND-ROBIN ALGORITHM: Fix first team, rotate others
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
    
    // ✅ CRITICAL: Round-robin rotation (keep first team fixed, rotate others)
    if (teamsList.length > 2) {
      const lastTeam = teamsList.pop(); // Remove last team
      teamsList.splice(1, 0, lastTeam); // Insert after first team
    }
  }
  
  console.log(`   Generated ${matches.length} matches for single round-robin leg`);
  return matches;
}

// ✅ ENHANCED: Apply scheduling details with fair distribution within rounds
function applyFairScheduleDetails(matches, startDate, daysBetween, timePeriods, venues) {
  console.log('📅 Applying schedule details with fair distribution...');
  
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
    
    // ✅ RANDOMIZE: Shuffle matches within each round for fair time/venue distribution
    const shuffledRoundMatches = [...roundMatches];
    for (let i = shuffledRoundMatches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoundMatches[i], shuffledRoundMatches[j]] = [shuffledRoundMatches[j], shuffledRoundMatches[i]];
    }
    
    console.log(`   Round ${roundNum}: ${shuffledRoundMatches.length} matches on ${currentDate.toISOString().split('T')[0]} (shuffled)`);
    
    shuffledRoundMatches.forEach((match, matchIndex) => {
      // Distribute time periods evenly but in randomized order
      const timeIndex = matchIndex % timePeriods.length;
      
      // ✅ RANDOMIZE: Venue selection with some variety
      let venue = 'Manadhoo Futsal Ground'; // Default
      if (venues.primary) {
        venue = venues.primary;
        
        // Add some venue variety (30% chance for secondary venue)
        if (venues.secondary && Math.random() > 0.7) {
          venue = venues.secondary;
        }
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
    
    // ✅ SLIGHT RANDOMIZATION: Add small variation to round intervals (±1 day)
    const baseInterval = daysBetween;
    const randomVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const actualInterval = Math.max(baseInterval + randomVariation, 3); // Minimum 3 days
    
    // Move to next round date
    currentDate = new Date(currentDate.getTime() + actualInterval * 24 * 60 * 60 * 1000);
  });
  
  console.log(`✅ Applied fair schedule details to ${scheduledMatches.length} matches`);
  return scheduledMatches;
}

// ✅ COMPREHENSIVE: Validate the correct schedule
function validateCorrectSchedule(matches, teams, format) {
  console.log('🔍 Validating correct round-robin schedule...');
  
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
  
  // ✅ VALIDATE: Expected match counts using CORRECT formula
  const expectedTotal = format === 'double-round-robin' 
    ? (teams.length - 1) * 2  // Each team plays every other team twice
    : (teams.length - 1);     // Each team plays every other team once
  
  teams.forEach(team => {
    const stats = teamStats[team._id.toString()];
    
    // Check total matches
    if (stats.totalMatches !== expectedTotal) {
      errors.push(`${team.name}: ${stats.totalMatches} matches (expected ${expectedTotal})`);
    }
    
    // Check opponent coverage - each team must play every other team
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
  
  Object.entries(headToHeadMatches).forEach(([pairKey, pairMatches]) => {
    const expectedMatches = format === 'double-round-robin' ? 2 : 1;
    
    if (pairMatches.length !== expectedMatches) {
      errors.push(`Pair ${pairKey}: ${pairMatches.length} matches (expected ${expectedMatches})`);
    }
    
    // For double round-robin, validate home/away swap
    if (format === 'double-round-robin' && pairMatches.length === 2) {
      const homeTeams = pairMatches.map(m => m.home);
      const awayTeams = pairMatches.map(m => m.away);
      
      // Check that each team plays home once and away once in the pair
      const allTeams = Array.from(new Set([...homeTeams, ...awayTeams]));
      if (allTeams.length === 2) {
        const team1 = allTeams[0];
        const team2 = allTeams[1];
        
        const team1Home = pairMatches.filter(m => m.home === team1).length;
        const team2Home = pairMatches.filter(m => m.home === team2).length;
        
        if (team1Home !== 1 || team2Home !== 1) {
          errors.push(`Pair ${pairKey}: Invalid home/away distribution`);
        }
      }
    }
  });
  
  console.log(`🔍 Validation result: ${errors.length} errors found`);
  if (errors.length > 0) {
    console.log('❌ Validation errors:', errors);
  } else {
    console.log('✅ Schedule validation passed perfectly!');
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
      algorithm: 'Classic Round-Robin Rotation'
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

// ✅ NEW: Calculate fairness score for the schedule
function calculateFairnessScore(matches, teams) {
  // Analyze distribution of early round appearances
  const earlyRoundAppearances = {};
  const timeSlotDistribution = {};
  
  teams.forEach(team => {
    earlyRoundAppearances[team._id] = 0;
    timeSlotDistribution[team._id] = {};
  });
  
  matches.forEach(match => {
    const homeId = match.homeTeam.toString();
    const awayId = match.awayTeam.toString();
    
    // Count early round appearances (first 25% of rounds)
    const maxRound = Math.max(...matches.map(m => m.round));
    if (match.round <= Math.ceil(maxRound * 0.25)) {
      if (earlyRoundAppearances[homeId] !== undefined) {
        earlyRoundAppearances[homeId]++;
      }
      if (earlyRoundAppearances[awayId] !== undefined) {
        earlyRoundAppearances[awayId]++;
      }
    }
    
    // Count time slot distribution
    const timeSlot = match.time;
    if (timeSlotDistribution[homeId]) {
      timeSlotDistribution[homeId][timeSlot] = (timeSlotDistribution[homeId][timeSlot] || 0) + 1;
    }
    if (timeSlotDistribution[awayId]) {
      timeSlotDistribution[awayId][timeSlot] = (timeSlotDistribution[awayId][timeSlot] || 0) + 1;
    }
  });
  
  // Calculate variance in early round appearances (lower = more fair)
  const earlyRoundValues = Object.values(earlyRoundAppearances);
  const avgEarlyRounds = earlyRoundValues.reduce((a, b) => a + b, 0) / earlyRoundValues.length;
  const earlyRoundVariance = earlyRoundValues.reduce((sum, val) => sum + Math.pow(val - avgEarlyRounds, 2), 0) / earlyRoundValues.length;
  
  // Convert to fairness score (0-100, where 100 is perfectly fair)
  const maxPossibleVariance = Math.pow(avgEarlyRounds, 2);
  const fairnessScore = Math.max(0, 100 - (earlyRoundVariance / maxPossibleVariance) * 100);
  
  return Math.round(fairnessScore);
}

export default authMiddleware(handler);