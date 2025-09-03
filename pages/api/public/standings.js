// ===========================================
// FILE: pages/api/public/standings.js (UPDATED WITH TIE-BREAKING RULES)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Season from '../../../models/Season';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId, limit } = req.query;
    
    let query = {};
    let activeSeason = null;
    
    if (seasonId) {
      query.season = seasonId;
      activeSeason = await Season.findById(seasonId);
    } else {
      // Get active season
      activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        query.season = activeSeason._id;
      }
    }
    
    console.log('Standings query:', query);
    
    // Get teams with their current stats
    let teams = await Team.find(query)
      .populate('season', 'name')
      .lean();
    
    console.log(`Found ${teams.length} teams for standings`);
    
    // Calculate enhanced stats for each team including fair play
    const teamsWithEnhancedStats = await Promise.all(
      teams.map(async (team) => {
        try {
          // Get all matches for this team in this season
          const teamMatches = await Match.find({
            $or: [
              { homeTeam: team._id },
              { awayTeam: team._id }
            ],
            season: query.season,
            status: 'completed'
          }).populate('homeTeam awayTeam', 'name').lean();
          
          console.log(`${team.name}: Found ${teamMatches.length} completed matches`);
          
          // Calculate comprehensive stats
          const stats = {
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
            goalDifference: 0,
            fairPlayPoints: 0, // Lower is better (yellow cards = 1 point, red cards = 3 points)
            headToHeadResults: {} // Will store results against other teams
          };
          
          teamMatches.forEach(match => {
            const isHome = match.homeTeam._id.toString() === team._id.toString();
            const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
            const opponentScore = isHome ? match.awayScore || 0 : match.homeScore || 0;
            const opponentId = isHome ? match.awayTeam._id.toString() : match.homeTeam._id.toString();
            
            // Basic stats
            stats.matchesPlayed++;
            stats.goalsFor += teamScore;
            stats.goalsAgainst += opponentScore;
            
            // Points and results
            if (teamScore > opponentScore) {
              stats.wins++;
              stats.points += 3;
              // Head to head
              if (!stats.headToHeadResults[opponentId]) {
                stats.headToHeadResults[opponentId] = { points: 0, goalsFor: 0, goalsAgainst: 0 };
              }
              stats.headToHeadResults[opponentId].points += 3;
              stats.headToHeadResults[opponentId].goalsFor += teamScore;
              stats.headToHeadResults[opponentId].goalsAgainst += opponentScore;
            } else if (teamScore < opponentScore) {
              stats.losses++;
              // Head to head
              if (!stats.headToHeadResults[opponentId]) {
                stats.headToHeadResults[opponentId] = { points: 0, goalsFor: 0, goalsAgainst: 0 };
              }
              stats.headToHeadResults[opponentId].goalsFor += teamScore;
              stats.headToHeadResults[opponentId].goalsAgainst += opponentScore;
            } else {
              stats.draws++;
              stats.points += 1;
              // Head to head
              if (!stats.headToHeadResults[opponentId]) {
                stats.headToHeadResults[opponentId] = { points: 0, goalsFor: 0, goalsAgainst: 0 };
              }
              stats.headToHeadResults[opponentId].points += 1;
              stats.headToHeadResults[opponentId].goalsFor += teamScore;
              stats.headToHeadResults[opponentId].goalsAgainst += opponentScore;
            }
            
            // Fair play calculation from match events
            if (match.events && Array.isArray(match.events)) {
              match.events.forEach(event => {
                // Only count cards for this team
                const eventForThisTeam = (event.team === 'home' && isHome) || (event.team === 'away' && !isHome);
                
                if (eventForThisTeam) {
                  if (event.type === 'yellow_card') {
                    stats.fairPlayPoints += 1;
                  } else if (event.type === 'red_card') {
                    stats.fairPlayPoints += 3;
                  }
                }
              });
            }
          });
          
          stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
          
          console.log(`${team.name} stats:`, {
            points: stats.points,
            goalDifference: stats.goalDifference,
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst,
            fairPlay: stats.fairPlayPoints
          });
          
          return {
            ...team,
            stats,
            enhancedStats: stats // Keep enhanced stats separate for tie-breaking
          };
        } catch (error) {
          console.error(`Error calculating stats for ${team.name}:`, error);
          // Return team with default stats if calculation fails
          return {
            ...team,
            stats: team.stats || {
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              goalDifference: 0
            },
            enhancedStats: {
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              goalDifference: 0,
              fairPlayPoints: 0,
              headToHeadResults: {}
            }
          };
        }
      })
    );
    
    // Advanced sorting with tie-breaking rules
    const sortedTeams = teamsWithEnhancedStats.sort((teamA, teamB) => {
      const statsA = teamA.enhancedStats;
      const statsB = teamB.enhancedStats;
      
      // 1. Points (highest first)
      if (statsA.points !== statsB.points) {
        return statsB.points - statsA.points;
      }
      
      console.log(`Tie on points between ${teamA.name} and ${teamB.name} (${statsA.points} pts each)`);
      
      // 2. Goal Difference (highest first)
      if (statsA.goalDifference !== statsB.goalDifference) {
        console.log(`Decided by goal difference: ${teamA.name} (${statsA.goalDifference}) vs ${teamB.name} (${statsB.goalDifference})`);
        return statsB.goalDifference - statsA.goalDifference;
      }
      
      // 3. Goals For (highest first)
      if (statsA.goalsFor !== statsB.goalsFor) {
        console.log(`Decided by goals for: ${teamA.name} (${statsA.goalsFor}) vs ${teamB.name} (${statsB.goalsFor})`);
        return statsB.goalsFor - statsA.goalsFor;
      }
      
      // 4. Goals Against (lowest first)
      if (statsA.goalsAgainst !== statsB.goalsAgainst) {
        console.log(`Decided by goals against: ${teamA.name} (${statsA.goalsAgainst}) vs ${teamB.name} (${statsB.goalsAgainst})`);
        return statsA.goalsAgainst - statsB.goalsAgainst;
      }
      
      // 5. Head-to-Head comparison
      const teamAId = teamA._id.toString();
      const teamBId = teamB._id.toString();
      
      const headToHeadA = statsA.headToHeadResults[teamBId];
      const headToHeadB = statsB.headToHeadResults[teamAId];
      
      if (headToHeadA && headToHeadB) {
        // Compare head-to-head points
        if (headToHeadA.points !== headToHeadB.points) {
          console.log(`Decided by head-to-head points: ${teamA.name} (${headToHeadA.points}) vs ${teamB.name} (${headToHeadB.points})`);
          return headToHeadB.points - headToHeadA.points;
        }
        
        // Head-to-head goal difference
        const h2hGDA = headToHeadA.goalsFor - headToHeadA.goalsAgainst;
        const h2hGDB = headToHeadB.goalsFor - headToHeadB.goalsAgainst;
        
        if (h2hGDA !== h2hGDB) {
          console.log(`Decided by head-to-head goal difference: ${teamA.name} (${h2hGDA}) vs ${teamB.name} (${h2hGDB})`);
          return h2hGDB - h2hGDA;
        }
      }
      
      // 6. Fair Play (lowest points first - fewer cards is better)
      if (statsA.fairPlayPoints !== statsB.fairPlayPoints) {
        console.log(`Decided by fair play: ${teamA.name} (${statsA.fairPlayPoints}) vs ${teamB.name} (${statsB.fairPlayPoints})`);
        return statsA.fairPlayPoints - statsB.fairPlayPoints;
      }
      
      // 7. Alphabetical as final tie-breaker
      console.log(`Final tie-breaker - alphabetical: ${teamA.name} vs ${teamB.name}`);
      return teamA.name.localeCompare(teamB.name);
    });
    
    // Apply limit if specified
    let finalTeams = sortedTeams;
    if (limit && !isNaN(parseInt(limit))) {
      finalTeams = sortedTeams.slice(0, parseInt(limit));
    }
    
    // Add position information
    const teamsWithPositions = finalTeams.map((team, index) => ({
      ...team,
      position: index + 1,
      // Add tie-breaking info for display
      tieBreakingInfo: {
        goalDifference: team.enhancedStats.goalDifference,
        goalsFor: team.enhancedStats.goalsFor,
        goalsAgainst: team.enhancedStats.goalsAgainst,
        fairPlayPoints: team.enhancedStats.fairPlayPoints
      }
    }));
    
    console.log('Final standings calculated:', teamsWithPositions.slice(0, 5).map(t => ({
      pos: t.position,
      name: t.name,
      pts: t.enhancedStats.points,
      gd: t.enhancedStats.goalDifference,
      gf: t.enhancedStats.goalsFor,
      ga: t.enhancedStats.goalsAgainst,
      fp: t.enhancedStats.fairPlayPoints
    })));
    
    res.status(200).json(teamsWithPositions);
  } catch (error) {
    console.error('Standings API error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
