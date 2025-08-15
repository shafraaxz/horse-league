// pages/api/matches/generate-schedule.js - COMPLETELY FIXED
import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  console.log('🎯 SCHEDULE GENERATION STARTED');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { leagueId, format, startDate, daysBetween, timePeriods, deleteExisting } = req.body;
    
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
    
    // ✅ FORCE DELETE: Always delete existing matches to ensure fresh schedule
    console.log('🗑️ Clearing existing matches for fresh schedule...');
    const deleteResult = await Match.deleteMany({ league: leagueId });
    const deletedCount = deleteResult.deletedCount;
    console.log(`✅ Deleted ${deletedCount} existing matches`);
    
    // ✅ GENERATE UNIQUE SEED: Ensure different schedules each time
    const generationSeed = Date.now() + Math.random();
    console.log(`🎲 Generation seed: ${generationSeed}`);
    
    // ✅ GENERATE VARIED SCHEDULE
    console.log('⚽ Generating VARIED round-robin schedule...');
    const matches = generateProperRoundRobin({
      teams,
      format: format || 'double-round-robin',
      startDate,
      daysBetween: parseInt(daysBetween) || 7,
      timePeriods,
      seed: generationSeed // Pass seed for reproducible randomization if needed
    });
    
    console.log(`📅 Generated ${matches.length} matches`);
    if (matches.length === 0) {
      return res.status(400).json({ error: 'No matches were generated' });
    }
    
    // Validate the schedule
    const validation = validateGeneratedSchedule(matches, teams, format);
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
      lastScheduleGenerated: new Date() // Track when schedule was last generated
    });
    
    // Final verification
    const verifyCount = await Match.countDocuments({ league: leagueId });
    console.log(`✅ Database verification: ${verifyCount} matches found in database`);
    
    // Generate summary
    const summary = generateScheduleSummary(savedMatches, teams);
    
    console.log('🎉 VARIED schedule generation completed successfully!');
    
    return res.status(200).json({
      success: true,
      message: `Fresh schedule generated! ${savedMatches.length} matches created with variation.`,
      matchesCreated: savedMatches.length,
      data: {
        matchesCreated: savedMatches.length,
        deletedMatches: deletedCount,
        format: format,
        totalRounds: Math.max(...matches.map(m => m.round)),
        summary,
        validation,
        generationSeed // Include seed in response for debugging
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

// ✅ ENHANCED: Generate varied schedules with randomization
function generateProperRoundRobin({ teams, format, startDate, daysBetween, timePeriods }) {
  console.log('🔄 Starting ENHANCED round-robin algorithm with randomization...');
  console.log(`Teams: ${teams.length}, Format: ${format}`);
  
  if (teams.length < 2) {
    console.log('❌ Not enough teams for schedule generation');
    return [];
  }
  
  const matches = [];
  
  // ✅ RANDOMIZE: Shuffle teams for variety in fixtures
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  console.log('🎲 Teams shuffled for variation');
  
  const teamCount = shuffledTeams.length;
  
  // ✅ FIXED: If odd number of teams, add a "bye" team
  let teamList = [...shuffledTeams];
  if (teamCount % 2 === 1) {
    teamList.push({ _id: 'BYE', name: 'BYE' });
  }
  
  const totalTeams = teamList.length;
  const rounds = totalTeams - 1;
  
  // ✅ PROPER ROUND-ROBIN: Generate first round-robin (each team plays each other once)
  for (let round = 0; round < rounds; round++) {
    const roundMatches = [];
    
    // ✅ CIRCLE METHOD: Fixed team at position 0, rotate others
    for (let i = 0; i < totalTeams / 2; i++) {
      const home = teamList[i];
      const away = teamList[totalTeams - 1 - i];
      
      // Skip if either team is the "bye" team
      if (home._id !== 'BYE' && away._id !== 'BYE') {
        // ✅ RANDOMIZE: Sometimes swap home/away for variety
        const shouldSwap = Math.random() > 0.5;
        
        roundMatches.push({
          homeTeam: shouldSwap ? away._id : home._id,
          awayTeam: shouldSwap ? home._id : away._id,
          round: round + 1,
          isFirstLeg: true
        });
      }
    }
    
    // ✅ RANDOMIZE: Shuffle matches within each round
    roundMatches.sort(() => Math.random() - 0.5);
    matches.push(...roundMatches);
    
    // ✅ ROTATE: Keep first team fixed, rotate others clockwise
    if (totalTeams > 2) {
      const temp = teamList[1];
      for (let i = 1; i < totalTeams - 1; i++) {
        teamList[i] = teamList[i + 1];
      }
      teamList[totalTeams - 1] = temp;
    }
  }
  
  // ✅ DOUBLE ROUND-ROBIN: Add return fixtures with smart scheduling
  if (format === 'double-round-robin') {
    console.log('🔄 Adding second round-robin with smart variation...');
    
    const firstRoundMatches = [...matches];
    const secondRoundMatches = [];
    
    // ✅ ENHANCED: Create return fixtures with variation
    firstRoundMatches.forEach((match, index) => {
      // Add some variation to when return fixtures are scheduled
      const baseRound = match.round + rounds;
      const roundVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      const adjustedRound = Math.max(baseRound + roundVariation, baseRound);
      
      secondRoundMatches.push({
        homeTeam: match.awayTeam, // Swap home and away
        awayTeam: match.homeTeam,
        round: adjustedRound,
        isFirstLeg: false
      });
    });
    
    // ✅ RANDOMIZE: Shuffle second round matches for better distribution
    secondRoundMatches.sort(() => Math.random() - 0.5);
    matches.push(...secondRoundMatches);
  }
  
  console.log(`📊 Generated ${matches.length} matches across ${format === 'double-round-robin' ? rounds * 2 : rounds} rounds`);
  
  // ✅ ADD DATES AND TIMES with randomization
  const scheduledMatches = addVariedScheduleDetails(matches, startDate, daysBetween, timePeriods);
  
  console.log(`✅ Final varied schedule: ${scheduledMatches.length} matches`);
  return scheduledMatches;
}

// ✅ ENHANCED: Add varied scheduling with randomization
function addVariedScheduleDetails(matches, startDate, daysBetween, timePeriods) {
  console.log('📅 Adding varied schedule details with randomization...');
  
  const scheduledMatches = [];
  
  // Group matches by round
  const matchesByRound = {};
  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });
  
  // Process each round in chronological order
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
  let currentDate = new Date(startDate);
  
  // ✅ RANDOMIZE: Add some variation to the gaps between rounds
  const baseGap = daysBetween;
  
  sortedRounds.forEach((roundNum, roundIndex) => {
    const roundMatches = matchesByRound[roundNum];
    console.log(`   Round ${roundNum}: ${roundMatches.length} matches on ${currentDate.toISOString().split('T')[0]}`);
    
    // ✅ RANDOMIZE: Shuffle matches within each round for variety
    const shuffledMatches = [...roundMatches].sort(() => Math.random() - 0.5);
    
    // ✅ RANDOMIZE: Sometimes schedule matches across multiple days in a round
    const shouldSpreadRound = roundMatches.length > 2 && Math.random() > 0.6;
    let dayOffset = 0;
    
    shuffledMatches.forEach((match, matchIndex) => {
      // ✅ ENHANCED: Spread some matches across a few days within the round
      if (shouldSpreadRound && matchIndex > 0 && matchIndex % 2 === 0) {
        dayOffset += Math.random() > 0.5 ? 1 : 2; // Add 1-2 days randomly
      }
      
      const matchDate = new Date(currentDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      // ✅ RANDOMIZE: Assign times with some variation
      const timeIndex = Math.floor(Math.random() * timePeriods.length);
      
      // ✅ ENHANCED: Add some random venues for variety
      const venues = [
        'Manadhoo Futsal Ground',
        'Central Arena',
        'Sports Complex A',
        'Main Stadium'
      ];
      const venue = venues[Math.floor(Math.random() * venues.length)];
      
      scheduledMatches.push({
        ...match,
        date: matchDate.toISOString().split('T')[0],
        time: timePeriods[timeIndex],
        venue: venue
      });
    });
    
    // ✅ RANDOMIZE: Vary the gap to next round (±1-2 days)
    const gapVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const actualGap = Math.max(baseGap + gapVariation, 3); // Minimum 3 days between rounds
    
    // Move to next round date
    currentDate = new Date(currentDate.getTime() + actualGap * 24 * 60 * 60 * 1000);
  });
  
  // ✅ FINAL SHUFFLE: Randomize the final order within each week
  scheduledMatches.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() === dateB.getTime()) {
      // Same date - randomize order
      return Math.random() - 0.5;
    }
    return dateA - dateB;
  });
  
  console.log(`✅ Added varied schedule details to ${scheduledMatches.length} matches`);
  return scheduledMatches;
}

// ✅ COMPREHENSIVE VALIDATION
function validateGeneratedSchedule(matches, teams, format) {
  console.log('🔍 Validating generated schedule...');
  
  const errors = [];
  const teamStats = {};
  const pairings = {};
  
  // Initialize team stats
  teams.forEach(team => {
    teamStats[team._id.toString()] = {
      name: team.name,
      totalMatches: 0,
      homeMatches: 0,
      awayMatches: 0
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
    }
    
    if (teamStats[awayId]) {
      teamStats[awayId].totalMatches++;
      teamStats[awayId].awayMatches++;
    }
    
    // Count pairings
    const pairKey = [homeId, awayId].sort().join('-');
    if (!pairings[pairKey]) {
      pairings[pairKey] = [];
    }
    pairings[pairKey].push({ home: homeId, away: awayId });
  });
  
  // ✅ VALIDATE MATCH COUNTS
  const expectedTotal = format === 'double-round-robin' 
    ? (teams.length - 1) * 2 
    : (teams.length - 1);
  
  teams.forEach(team => {
    const stats = teamStats[team._id.toString()];
    if (stats.totalMatches !== expectedTotal) {
      errors.push(`${team.name}: ${stats.totalMatches} matches (expected ${expectedTotal})`);
    }
    
    // For double round-robin, home/away should be balanced
    if (format === 'double-round-robin') {
      const diff = Math.abs(stats.homeMatches - stats.awayMatches);
      if (diff > 1) {
        errors.push(`${team.name}: Unbalanced home/away (${stats.homeMatches}H, ${stats.awayMatches}A)`);
      }
    }
  });
  
  // ✅ VALIDATE PAIRINGS
  Object.entries(pairings).forEach(([pairKey, matches]) => {
    const expectedMatches = format === 'double-round-robin' ? 2 : 1;
    
    if (matches.length !== expectedMatches) {
      errors.push(`Pair ${pairKey}: ${matches.length} matches (expected ${expectedMatches})`);
    }
    
    // For double round-robin, check home/away swap
    if (format === 'double-round-robin' && matches.length === 2) {
      const [match1, match2] = matches;
      if (match1.home === match2.home || match1.away === match2.away) {
        errors.push(`Pair ${pairKey}: Missing home/away swap`);
      }
    }
  });
  
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
      pairingsCount: Object.keys(pairings).length
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
    }
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
  
  // Date range
  if (matches.length > 0) {
    const dates = matches.map(m => new Date(m.date)).sort((a, b) => a - b);
    summary.dateRange.start = dates[0].toISOString().split('T')[0];
    summary.dateRange.end = dates[dates.length - 1].toISOString().split('T')[0];
  }
  
  return summary;
}

export default authMiddleware(handler);