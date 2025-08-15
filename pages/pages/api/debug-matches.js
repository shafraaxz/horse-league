// pages/api/debug-matches.js - Debug endpoint to diagnose match loading issues

import connectDB from '../../lib/mongodb';
import { Match, Team, League } from '../../lib/models';
import { authMiddleware } from '../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { leagueId } = req.query;
    
    console.log('🔍 Debug matches request for league:', leagueId);
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID required' });
    }

    // 1. Check if league exists
    const league = await League.findById(leagueId);
    console.log('🏆 League found:', league ? league.name : 'NOT FOUND');
    
    // 2. Check different match queries to find which field is used
    const queries = [
      { name: 'matches_with_league_field', query: { league: leagueId } },
      { name: 'matches_with_leagueId_field', query: { leagueId: leagueId } },
      { name: 'all_matches_in_db', query: {} }
    ];
    
    const results = {};
    
    for (const { name, query } of queries) {
      try {
        const count = await Match.countDocuments(query);
        const matches = await Match.find(query)
          .populate('homeTeam', 'name')
          .populate('awayTeam', 'name')
          .limit(3)
          .lean();
        
        results[name] = {
          count,
          sample_matches: matches.map(m => ({
            _id: m._id,
            homeTeam: m.homeTeam?.name || 'Unknown',
            awayTeam: m.awayTeam?.name || 'Unknown',
            date: m.date,
            status: m.status,
            league_field: m.league,
            leagueId_field: m.leagueId,
            has_league_field: !!m.league,
            has_leagueId_field: !!m.leagueId
          }))
        };
        
        console.log(`📊 ${name}: Found ${count} matches`);
      } catch (error) {
        results[name] = { error: error.message };
        console.error(`❌ ${name} failed:`, error.message);
      }
    }
    
    // 3. Check teams in this league
    const teams = await Team.find({ league: leagueId }, 'name').lean();
    console.log('👥 Teams in league:', teams.length);
    
    // 4. Get a sample match document to understand schema
    const sampleMatch = await Match.findOne({}).lean();
    console.log('📄 Sample match structure:', sampleMatch ? Object.keys(sampleMatch) : 'No matches exist');
    
    // 5. Database collection info
    const allMatchesCount = await Match.countDocuments({});
    console.log('📊 Total matches in database:', allMatchesCount);
    
    // 6. Check what field names are actually used in matches
    const distinctLeagueFields = await Match.distinct('league');
    const distinctLeagueIdFields = await Match.distinct('leagueId');
    
    // 7. Get the exact API endpoints that should work
    const recommendations = generateRecommendations(results, teams.length, allMatchesCount);
    
    res.status(200).json({
      debug_info: {
        requested_league_id: leagueId,
        league_exists: !!league,
        league_name: league?.name || null,
        teams_in_league: teams.length,
        total_matches_in_db: allMatchesCount
      },
      field_analysis: {
        distinct_league_values: distinctLeagueFields.length,
        distinct_leagueId_values: distinctLeagueIdFields.length,
        league_field_sample: distinctLeagueFields.slice(0, 3),
        leagueId_field_sample: distinctLeagueIdFields.slice(0, 3)
      },
      query_results: results,
      sample_match_fields: sampleMatch ? Object.keys(sampleMatch) : [],
      recommendations: recommendations,
      api_endpoints_to_try: [
        `/api/matches?league=${leagueId}`,
        `/api/matches?leagueId=${leagueId}`,
        `/api/matches/${leagueId}`,
        `/api/league/${leagueId}/matches`
      ]
    });
    
  } catch (error) {
    console.error('💥 Debug error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

function generateRecommendations(results, teamsCount, totalMatches) {
  const recommendations = [];
  
  // Check which query found matches
  if (results.matches_with_league_field?.count > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Matches use "league" field',
      fix: 'Your frontend should query: /api/matches?league=LEAGUE_ID',
      example: 'await apiCall(`/matches?league=${selectedLeague}`)'
    });
  }
  
  if (results.matches_with_leagueId_field?.count > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Matches use "leagueId" field',
      fix: 'Your frontend should query: /api/matches?leagueId=LEAGUE_ID',
      example: 'await apiCall(`/matches?leagueId=${selectedLeague}`)'
    });
  }
  
  if (results.all_matches_in_db?.count > 0 && 
      results.matches_with_league_field?.count === 0 && 
      results.matches_with_leagueId_field?.count === 0) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'Matches exist but not linked to leagues properly',
      fix: 'Check your schedule generation code - league field not being set',
      example: 'Ensure match creation sets either "league" or "leagueId" field'
    });
  }
  
  if (teamsCount >= 2 && totalMatches === 0) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'No matches found despite having teams',
      fix: 'Schedule generation is completely failing',
      example: 'Check /api/matches/generate-schedule endpoint'
    });
  }
  
  if (totalMatches > 0 && results.matches_with_league_field?.count === 0 && results.matches_with_leagueId_field?.count === 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Matches exist but league references are broken',
      fix: 'Update existing matches to include proper league reference',
      example: 'Run: db.matches.updateMany({}, {$set: {league: ObjectId("LEAGUE_ID")}})'
    });
  }
  
  // Add specific frontend fixes
  if (results.matches_with_league_field?.count > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Update AdminPanel loadMatchesWithFallback function',
      fix: 'Prioritize "/matches?league=" endpoint first',
      example: 'const endpoints = [`/matches?league=${leagueId}`, ...others]'
    });
  }
  
  return recommendations;
}

export default authMiddleware(handler);