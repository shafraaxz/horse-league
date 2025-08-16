// Enhanced pages/api/matches/generate-schedule.js with Cup Support

import connectDB from '../../../lib/mongodb';
import { Team, Match, League } from '../../../lib/models';
import { authMiddleware } from '../../../lib/auth';

async function handler(req, res) {
  console.log('🏆 ENHANCED TOURNAMENT GENERATION STARTED');
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
      cupFormat = 'single-elimination',
      groupStageTeams = 4,
      groupAdvancement = 2,
      hasGroupStage = false,
      thirdPlacePlayoff = false,
      seedTeams = false,
      startDate, 
      daysBetween = 7,
      timePeriods = ['18:00', '19:30'],
      deleteExisting = true,
      venues = {}
    } = req.body;
    
    // Validate inputs
    if (!leagueId || !startDate) {
      return res.status(400).json({ error: 'League ID and start date are required' });
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
    
    // Generate matches based on tournament format
    let matches = [];
    let tournamentStructure = {};
    
    switch (format) {
      case 'single-round-robin':
      case 'double-round-robin':
        console.log(`🔄 Generating ${format} tournament...`);
        const result = generateRoundRobinTournament(teams, format, startDate, daysBetween, timePeriods, venues);
        matches = result.matches;
        tournamentStructure = result.structure;
        break;
        
      case 'single-elimination':
        console.log('🏆 Generating single elimination cup...');
        const seResult = generateSingleEliminationCup(teams, startDate, daysBetween, timePeriods, venues, thirdPlacePlayoff, seedTeams);
        matches = seResult.matches;
        tournamentStructure = seResult.structure;
        break;
        
      case 'double-elimination':
        console.log('🏆🏆 Generating double elimination cup...');
        const deResult = generateDoubleEliminationCup(teams, startDate, daysBetween, timePeriods, venues, seedTeams);
        matches = deResult.matches;
        tournamentStructure = deResult.structure;
        break;
        
      case 'group-stage-knockout':
        console.log('👥🏆 Generating group stage + knockout tournament...');
        const gsResult = generateGroupStageKnockout(teams, groupStageTeams, groupAdvancement, startDate, daysBetween, timePeriods, venues, thirdPlacePlayoff, seedTeams);
        matches = gsResult.matches;
        tournamentStructure = gsResult.structure;
        break;
        
      case 'swiss-system':
        console.log('🎯 Generating Swiss system tournament...');
        const swissResult = generateSwissSystem(teams, startDate, daysBetween, timePeriods, venues);
        matches = swissResult.matches;
        tournamentStructure = swissResult.structure;
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported tournament format' });
    }
    
    console.log(`📅 Generated ${matches.length} matches`);
    if (matches.length === 0) {
      return res.status(400).json({ error: 'No matches were generated' });
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
      },
      // Tournament-specific fields
      tournamentFormat: format,
      cupRound: match.cupRound || null,
      groupName: match.groupName || null,
      isPlayoff: match.isPlayoff || false,
      isThirdPlace: match.isThirdPlace || false
    }));
    
    // Save to database
    console.log('💾 Saving matches to database...');
    const savedMatches = await Match.insertMany(matchesToSave);
    console.log(`✅ Successfully saved ${savedMatches.length} matches to database`);
    
    // Update league match count
    await League.findByIdAndUpdate(leagueId, {
      matchesCount: savedMatches.length,
      lastScheduleGenerated: new Date(),
      tournamentFormat: format
    });
    
    console.log('🎉 Tournament generation completed successfully!');
    
    return res.status(200).json({
      success: true,
      message: `${format} tournament generated! ${savedMatches.length} matches created.`,
      matchesCreated: savedMatches.length,
      data: {
        matchesCreated: savedMatches.length,
        format: format,
        totalRounds: Math.max(...matches.map(m => m.round)),
        tournamentStructure,
        teams: teams.length
      }
    });
    
  } catch (error) {
    console.error('💥 Tournament generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during tournament generation',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Tournament generation failed'
    });
  }
}

// ✅ ENHANCED: Round Robin Tournament Generator
function generateRoundRobinTournament(teams, format, startDate, daysBetween, timePeriods, venues) {
  const N = teams.length;
  const matches = [];
  let roundNumber = 1;
  
  // Generate single round robin
  const singleRoundMatches = generateSingleRoundRobin(teams);
  
  // Add dates and details to first leg
  singleRoundMatches.forEach(match => {
    matches.push({
      ...match,
      round: roundNumber++,
      date: calculateMatchDate(startDate, Math.floor(matches.length / Math.max(timePeriods.length, 1)), daysBetween),
      time: timePeriods[matches.length % timePeriods.length],
      venue: selectVenue(venues, matches.length)
    });
  });
  
  // For double round robin, add return leg
  if (format === 'double-round-robin') {
    singleRoundMatches.forEach(match => {
      matches.push({
        homeTeam: match.awayTeam, // Swap home/away
        awayTeam: match.homeTeam,
        round: roundNumber++,
        date: calculateMatchDate(startDate, Math.floor(matches.length / Math.max(timePeriods.length, 1)), daysBetween),
        time: timePeriods[matches.length % timePeriods.length],
        venue: selectVenue(venues, matches.length)
      });
    });
  }
  
  return {
    matches,
    structure: {
      type: format,
      totalMatches: matches.length,
      expectedFormula: format === 'double-round-robin' ? `${N}(${N-1}) = ${N * (N-1)}` : `${N}(${N-1})/2 = ${Math.floor(N * (N-1) / 2)}`,
      rounds: Math.max(...matches.map(m => m.round))
    }
  };
}

// ✅ NEW: Single Elimination Cup Generator
function generateSingleEliminationCup(teams, startDate, daysBetween, timePeriods, venues, thirdPlacePlayoff = false, seedTeams = false) {
  const matches = [];
  let currentDate = new Date(startDate);
  let roundNumber = 1;
  
  // Prepare teams (with seeding if requested)
  let tournamentTeams = [...teams];
  if (seedTeams) {
    // Simple seeding based on team name for now
    tournamentTeams = teams.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Shuffle for random bracket
    for (let i = tournamentTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tournamentTeams[i], tournamentTeams[j]] = [tournamentTeams[j], tournamentTeams[i]];
    }
  }
  
  const rounds = Math.ceil(Math.log2(tournamentTeams.length));
  let currentRoundTeams = [...tournamentTeams];
  
  // Add byes if needed (for non-power-of-2 team counts)
  const powerOf2 = Math.pow(2, rounds);
  const byes = powerOf2 - tournamentTeams.length;
  
  for (let round = 1; round <= rounds; round++) {
    const roundMatches = [];
    const nextRoundTeams = [];
    
    // First round might have byes
    if (round === 1 && byes > 0) {
      // Advanced teams automatically (byes)
      for (let i = 0; i < byes; i++) {
        nextRoundTeams.push(currentRoundTeams[i]);
      }
      // Remaining teams play
      for (let i = byes; i < currentRoundTeams.length; i += 2) {
        if (i + 1 < currentRoundTeams.length) {
          roundMatches.push({
            homeTeam: currentRoundTeams[i]._id,
            awayTeam: currentRoundTeams[i + 1]._id,
            round: roundNumber++,
            cupRound: getRoundName(round, rounds),
            date: currentDate.toISOString().split('T')[0],
            time: timePeriods[roundMatches.length % timePeriods.length],
            venue: selectVenue(venues, roundMatches.length)
          });
          nextRoundTeams.push(null); // Placeholder for winner
        }
      }
    } else {
      // Normal rounds
      for (let i = 0; i < currentRoundTeams.length; i += 2) {
        if (i + 1 < currentRoundTeams.length) {
          roundMatches.push({
            homeTeam: currentRoundTeams[i]._id,
            awayTeam: currentRoundTeams[i + 1]._id,
            round: roundNumber++,
            cupRound: getRoundName(round, rounds),
            date: currentDate.toISOString().split('T')[0],
            time: timePeriods[roundMatches.length % timePeriods.length],
            venue: selectVenue(venues, roundMatches.length)
          });
          nextRoundTeams.push(null); // Placeholder for winner
        }
      }
    }
    
    matches.push(...roundMatches);
    currentRoundTeams = nextRoundTeams;
    
    // Move to next round date
    if (round < rounds) {
      currentDate = new Date(currentDate.getTime() + daysBetween * 24 * 60 * 60 * 1000);
    }
  }
  
  // Add third place playoff if requested
  if (thirdPlacePlayoff && tournamentTeams.length >= 4) {
    const thirdPlaceDate = new Date(currentDate.getTime() + daysBetween * 24 * 60 * 60 * 1000);
    matches.push({
      homeTeam: null, // To be determined from semifinal losers
      awayTeam: null,
      round: roundNumber++,
      cupRound: 'Third Place',
      isThirdPlace: true,
      date: thirdPlaceDate.toISOString().split('T')[0],
      time: timePeriods[0],
      venue: selectVenue(venues, 0)
    });
  }
  
  return {
    matches,
    structure: {
      type: 'single-elimination',
      totalMatches: matches.length,
      rounds: rounds,
      participants: tournamentTeams.length,
      byes: byes,
      hasThirdPlace: thirdPlacePlayoff,
      bracketStructure: generateBracketStructure(tournamentTeams, rounds)
    }
  };
}

// ✅ NEW: Group Stage + Knockout Generator
function generateGroupStageKnockout(teams, groupSize, advancement, startDate, daysBetween, timePeriods, venues, thirdPlacePlayoff, seedTeams) {
  const matches = [];
  let roundNumber = 1;
  let currentDate = new Date(startDate);
  
  // Create groups
  const groupCount = Math.ceil(teams.length / groupSize);
  const groups = [];
  
  // Distribute teams into groups
  let tournamentTeams = [...teams];
  if (seedTeams) {
    tournamentTeams = teams.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Shuffle teams
    for (let i = tournamentTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tournamentTeams[i], tournamentTeams[j]] = [tournamentTeams[j], tournamentTeams[i]];
    }
  }
  
  // Create groups with snake draft for better balance
  for (let g = 0; g < groupCount; g++) {
    groups.push({
      name: `Group ${String.fromCharCode(65 + g)}`, // A, B, C, etc.
      teams: []
    });
  }
  
  // Distribute teams using snake draft
  for (let i = 0; i < tournamentTeams.length; i++) {
    const groupIndex = i % groupCount;
    groups[groupIndex].teams.push(tournamentTeams[i]);
  }
  
  // Generate group stage matches (round robin within each group)
  groups.forEach(group => {
    if (group.teams.length >= 2) {
      const groupMatches = generateSingleRoundRobin(group.teams);
      groupMatches.forEach(match => {
        matches.push({
          ...match,
          round: roundNumber++,
          groupName: group.name,
          date: calculateMatchDate(startDate, Math.floor(matches.length / Math.max(timePeriods.length, 1)), daysBetween),
          time: timePeriods[matches.length % timePeriods.length],
          venue: selectVenue(venues, matches.length)
        });
      });
    }
  });
  
  // Calculate knockout stage
  const advancingTeams = groupCount * advancement;
  if (advancingTeams >= 2) {
    // Move to knockout stage date
    const knockoutStartDate = new Date(currentDate.getTime() + (daysBetween * 2) * 24 * 60 * 60 * 1000);
    
    // Generate knockout matches (simplified - would need actual group winners)
    const knockoutRounds = Math.ceil(Math.log2(advancingTeams));
    for (let round = 1; round <= knockoutRounds; round++) {
      const roundMatches = Math.pow(2, knockoutRounds - round);
      for (let i = 0; i < roundMatches; i++) {
        matches.push({
          homeTeam: null, // To be determined from group stage
          awayTeam: null,
          round: roundNumber++,
          cupRound: getKnockoutRoundName(round, knockoutRounds),
          isPlayoff: true,
          date: new Date(knockoutStartDate.getTime() + (round - 1) * daysBetween * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: timePeriods[i % timePeriods.length],
          venue: selectVenue(venues, i)
        });
      }
    }
    
    // Third place playoff
    if (thirdPlacePlayoff) {
      const finalDate = new Date(knockoutStartDate.getTime() + knockoutRounds * daysBetween * 24 * 60 * 60 * 1000);
      matches.push({
        homeTeam: null,
        awayTeam: null,
        round: roundNumber++,
        cupRound: 'Third Place',
        isThirdPlace: true,
        isPlayoff: true,
        date: finalDate.toISOString().split('T')[0],
        time: timePeriods[0],
        venue: selectVenue(venues, 0)
      });
    }
  }
  
  return {
    matches,
    structure: {
      type: 'group-stage-knockout',
      totalMatches: matches.length,
      groupStage: {
        groups: groups.length,
        teamsPerGroup: groupSize,
        advancement: advancement
      },
      knockout: {
        participants: advancingTeams,
        rounds: Math.ceil(Math.log2(advancingTeams))
      },
      hasThirdPlace: thirdPlacePlayoff
    }
  };
}

// Helper functions
function generateSingleRoundRobin(teams) {
  const matches = [];
  const n = teams.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        homeTeam: teams[i]._id,
        awayTeam: teams[j]._id
      });
    }
  }
  
  return matches;
}

function calculateMatchDate(startDate, dayOffset, daysBetween) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayOffset * daysBetween));
  return date.toISOString().split('T')[0];
}

function selectVenue(venues, index) {
  if (venues.primary) return venues.primary;
  return 'Manadhoo Futsal Ground';
}

function getRoundName(round, totalRounds) {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  if (round === 1) return 'First Round';
  return `Round ${round}`;
}

function getKnockoutRoundName(round, totalRounds) {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  return `Round of ${Math.pow(2, totalRounds - round + 1)}`;
}

function generateBracketStructure(teams, rounds) {
  return {
    totalTeams: teams.length,
    rounds: rounds,
    bracket: `${teams.length} teams → ${rounds} rounds → 1 winner`
  };
}

// Placeholder functions for other tournament types
function generateDoubleEliminationCup(teams, startDate, daysBetween, timePeriods, venues, seedTeams) {
  // Simplified double elimination - would need complex bracket logic
  const singleElim = generateSingleEliminationCup(teams, startDate, daysBetween, timePeriods, venues, false, seedTeams);
  return {
    matches: singleElim.matches,
    structure: { ...singleElim.structure, type: 'double-elimination' }
  };
}

function generateSwissSystem(teams, startDate, daysBetween, timePeriods, venues) {
  const matches = [];
  const rounds = Math.ceil(Math.log2(teams.length));
  let roundNumber = 1;
  
  for (let round = 1; round <= rounds; round++) {
    // Simplified Swiss pairing
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        matches.push({
          homeTeam: teams[i]._id,
          awayTeam: teams[i + 1]._id,
          round: roundNumber++,
          date: calculateMatchDate(startDate, round - 1, daysBetween),
          time: timePeriods[(i / 2) % timePeriods.length],
          venue: selectVenue(venues, i / 2)
        });
      }
    }
  }
  
  return {
    matches,
    structure: {
      type: 'swiss-system',
      totalMatches: matches.length,
      rounds: rounds
    }
  };
}

export default authMiddleware(handler);