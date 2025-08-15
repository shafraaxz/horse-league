// pages/api/matches/generate-schedule.js - COMPLETELY FIXED with TRUE RANDOMIZATION
import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  console.log('🎯 SCHEDULE GENERATION STARTED with TRUE RANDOMIZATION');
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
    
    // ✅ GENERATE FULLY RANDOMIZED SCHEDULE
    console.log('🎲 Generating FULLY RANDOMIZED double round-robin schedule...');
    const matches = generateRandomizedDoubleRoundRobin({
      teams,
      format: format || 'double-round-robin',
      startDate,
      daysBetween: parseInt(daysBetween) || 7,
      timePeriods
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
      lastScheduleGenerated: new Date()
    });
    
    // Final verification
    const verifyCount = await Match.countDocuments({ league: leagueId });
    console.log(`✅ Database verification: ${verifyCount} matches found in database`);
    
    // Generate summary
    const summary = generateScheduleSummary(savedMatches, teams);
    
    console.log('🎉 FULLY RANDOMIZED schedule generation completed successfully!');
    
    return res.status(200).json({
      success: true,
      message: `Fully randomized schedule generated! ${savedMatches.length} matches created.`,
      matchesCreated: savedMatches.length,
      data: {
        matchesCreated: savedMatches.length,
        deletedMatches: deletedCount,
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

// ✅ NEW: Fully randomized double round-robin generator
function generateRandomizedDoubleRoundRobin({ teams, format, startDate, daysBetween, timePeriods }) {
  console.log('🎲 Starting FULLY RANDOMIZED double round-robin generation...');
  console.log(`Teams: ${teams.length}, Format: ${format}`);
  
  if (teams.length < 2) {
    console.log('❌ Not enough teams for schedule generation');
    return [];
  }
  
  const teamList = [...teams];
  const teamCount = teamList.length;
  
  // ✅ STEP 1: Generate ALL possible pairings
  const allPairings = [];
  
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      const team1 = teamList[i];
      const team2 = teamList[j];
      
      // Add both home/away combinations for double round-robin
      if (format === 'double-round-robin') {
        allPairings.push({
          homeTeam: team1._id,
          awayTeam: team2._id,
          homeName: team1.name,
          awayName: team2.name,
          pairId: `${team1._id}-${team2._id}`,
          leg: 'first'
        });
        
        allPairings.push({
          homeTeam: team2._id,
          awayTeam: team1._id,
          homeName: team2.name,
          awayName: team1.name,
          pairId: `${team1._id}-${team2._id}`,
          leg: 'second'
        });
      } else {
        // Single round-robin: randomly choose who plays home
        const homeFirst = Math.random() > 0.5;
        allPairings.push({
          homeTeam: homeFirst ? team1._id : team2._id,
          awayTeam: homeFirst ? team2._id : team1._id,
          homeName: homeFirst ? team1.name : team2.name,
          awayName: homeFirst ? team2.name : team1.name,
          pairId: `${team1._id}-${team2._id}`,
          leg: 'only'
        });
      }
    }
  }
  
  console.log(`📊 Generated ${allPairings.length} total pairings`);
  
  // ✅ STEP 2: COMPLETELY RANDOMIZE the order of all matches
  const shuffledPairings = [...allPairings];
  
  // Fisher-Yates shuffle for true randomization
  for (let i = shuffledPairings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPairings[i], shuffledPairings[j]] = [shuffledPairings[j], shuffledPairings[i]];
  }
  
  console.log('🎲 All pairings completely randomized');
  
  // ✅ STEP 3: Distribute matches across rounds with constraints
  const rounds = [];
  const teamSchedule = {}; // Track when each team last played
  
  // Initialize team schedule tracking
  teamList.forEach(team => {
    teamSchedule[team._id] = { lastRound: -2 }; // Allow teams to play in consecutive rounds initially
  });
  
  // ✅ SMART DISTRIBUTION: Try to spread matches evenly while maintaining randomness
  const matchesPerRound = Math.ceil(teamCount / 2); // Maximum matches per round
  let currentRound = 1;
  let currentRoundMatches = [];
  let usedTeamsThisRound = new Set();
  
  shuffledPairings.forEach((pairing, index) => {
    const homeTeam = pairing.homeTeam;
    const awayTeam = pairing.awayTeam;
    
    // Check if both teams are available this round
    const canPlayThisRound = !usedTeamsThisRound.has(homeTeam) && !usedTeamsThisRound.has(awayTeam);
    
    if (canPlayThisRound && currentRoundMatches.length < matchesPerRound) {
      // Add to current round
      currentRoundMatches.push({
        ...pairing,
        round: currentRound
      });
      
      usedTeamsThisRound.add(homeTeam);
      usedTeamsThisRound.add(awayTeam);
    } else {
      // Move to next round
      if (currentRoundMatches.length > 0) {
        rounds.push(...currentRoundMatches);
      }
      
      currentRound++;
      currentRoundMatches = [{
        ...pairing,
        round: currentRound
      }];
      
      usedTeamsThisRound = new Set([homeTeam, awayTeam]);
    }
  });
  
  // Add remaining matches
  if (currentRoundMatches.length > 0) {
    rounds.push(...currentRoundMatches);
  }
  
  console.log(`📅 Distributed ${rounds.length} matches across ${currentRound} rounds`);
  
  // ✅ STEP 4: Add RANDOMIZED dates and times
  const scheduledMatches = addRandomizedScheduleDetails(rounds, startDate, daysBetween, timePeriods);
  
  console.log(`✅ Final RANDOMIZED schedule: ${scheduledMatches.length} matches`);
  return scheduledMatches;
}

// ✅ ENHANCED: Add randomized scheduling with variation
function addRandomizedScheduleDetails(matches, startDate, daysBetween, timePeriods) {
  console.log('📅 Adding RANDOMIZED schedule details...');
  
  const scheduledMatches = [];
  
  // Group matches by round
  const matchesByRound = {};
  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });
  
  // Process each round with RANDOMIZATION
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
  let currentDate = new Date(startDate);
  
  sortedRounds.forEach((roundNum, roundIndex) => {
    const roundMatches = matchesByRound[roundNum];
    console.log(`   Round ${roundNum}: ${roundMatches.length} matches`);
    
    // ✅ RANDOMIZE: Shuffle matches within each round
    const shuffledMatches = [...roundMatches].sort(() => Math.random() - 0.5);
    
    // ✅ RANDOMIZE: Sometimes spread matches across multiple days in a round
    const shouldSpreadRound = roundMatches.length >= 3 && Math.random() > 0.4;
    const maxSpreadDays = Math.min(3, Math.floor(roundMatches.length / 2));
    
    shuffledMatches.forEach((match, matchIndex) => {
      // ✅ RANDOMIZE: Date within the round period
      let dayOffset = 0;
      if (shouldSpreadRound && matchIndex > 0) {
        dayOffset = Math.floor(Math.random() * maxSpreadDays);
      }
      
      const matchDate = new Date(currentDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      // ✅ RANDOMIZE: Time selection
      const timeIndex = Math.floor(Math.random() * timePeriods.length);
      
      // ✅ RANDOMIZE: Venue selection with bias toward home stadiums
      const venues = [
        'Manadhoo Futsal Ground',
        'Central Arena', 
        'Sports Complex A',
        'Community Ground'
      ];
      
      // 70% chance of Manadhoo, 30% random venue
      const venue = Math.random() > 0.3 ? 'Manadhoo Futsal Ground' : venues[Math.floor(Math.random() * venues.length)];
      
      scheduledMatches.push({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        round: match.round,
        date: matchDate.toISOString().split('T')[0],
        time: timePeriods[timeIndex],
        venue: venue
      });
    });
    
    // ✅ RANDOMIZE: Days between rounds (add variation)
    const baseGap = daysBetween;
    const gapVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const actualGap = Math.max(baseGap + gapVariation, 3); // Minimum 3 days
    
    // Move to next round date
    currentDate = new Date(currentDate.getTime() + actualGap * 24 * 60 * 60 * 1000);
  });
  
  // ✅ FINAL RANDOMIZATION: Shuffle matches one more time while preserving dates
  scheduledMatches.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() === dateB.getTime()) {
      // Same date - add some randomization while keeping logical time order
      const timeA = a.time.replace(':', '');
      const timeB = b.time.replace(':', '');
      return parseInt(timeA) - parseInt(timeB) + (Math.random() - 0.5) * 0.1;
    }
    return dateA - dateB;
  });
  
  console.log(`✅ Added RANDOMIZED schedule details to ${scheduledMatches.length} matches`);
  return scheduledMatches;
}

// ✅ ENHANCED VALIDATION for randomized schedule
function validateGeneratedSchedule(matches, teams, format) {
  console.log('🔍 Validating randomized schedule...');
  
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
    
    // For double round-robin, home/away should be reasonably balanced (allow 1 difference)
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
    console.log('✅ Randomized schedule validation passed!');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    statistics: {
      totalMatches: matches.length,
      teamsCount: teams.length,
      expectedMatchesPerTeam: expectedTotal,
      totalRounds: Math.max(...matches.map(m => m.round)),
      pairingsCount: Object.keys(pairings).length,
      randomizationScore: calculateRandomizationScore(matches, teams)
    }
  };
}

// ✅ NEW: Calculate how random the schedule is
function calculateRandomizationScore(matches, teams) {
  // Simple score based on how varied the round distribution is
  const roundDistribution = {};
  matches.forEach(match => {
    roundDistribution[match.round] = (roundDistribution[match.round] || 0) + 1;
  });
  
  const values = Object.values(roundDistribution);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  
  // Lower variance = more even distribution = better randomization
  // Convert to a 0-100 score where 100 is perfectly random
  const maxVariance = Math.pow(avg, 2);
  const score = Math.max(0, 100 - (variance / maxVariance) * 100);
  
  return Math.round(score);
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
    randomizationInfo: {
      venueVariety: new Set(matches.map(m => m.venue)).size,
      timeVariety: new Set(matches.map(m => m.time)).size,
      roundDistribution: {}
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
  
  // Round distribution
  matches.forEach(match => {
    summary.randomizationInfo.roundDistribution[match.round] = 
      (summary.randomizationInfo.roundDistribution[match.round] || 0) + 1;
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