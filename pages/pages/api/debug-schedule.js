// Add this debug endpoint to test your database: pages/api/debug-schedule.js

import connectDB from '../../lib/mongodb';
import { Team, Match, League } from '../../lib/models';
import { authMiddleware } from '../../lib/auth';

async function handler(req, res) {
  try {
    console.log('🔍 Starting comprehensive debug...');
    
    // Test database connection
    await connectDB();
    console.log('✅ Database connected');
    
    const { leagueId } = req.query;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'leagueId required' });
    }
    
    // Check league
    const league = await League.findById(leagueId);
    console.log('🏆 League:', league ? league.name : 'NOT FOUND');
    
    // Check teams
    const teams = await Team.find({ league: leagueId });
    console.log('👥 Teams found:', teams.length);
    teams.forEach(team => console.log(`  - ${team.name} (${team._id})`));
    
    // Check matches
    const matches = await Match.find({ league: leagueId });
    console.log('⚽ Matches found:', matches.length);
    
    // Test match creation
    console.log('🧪 Testing single match creation...');
    
    if (teams.length >= 2) {
      const testMatch = {
        homeTeam: teams[0]._id,
        awayTeam: teams[1]._id,
        league: leagueId,
        date: '2024-12-01',
        time: '18:00',
        round: 999, // Test round
        matchday: 999,
        venue: 'Test Venue',
        status: 'scheduled',
        score: { home: 0, away: 0, halfTime: { home: 0, away: 0 } },
        events: [],
        liveData: { currentMinute: 0, isLive: false, period: 'first_half' },
        statistics: {
          home: { possession: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 },
          away: { possession: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 }
        }
      };
      
      try {
        const savedTestMatch = await Match.create(testMatch);
        console.log('✅ Test match created:', savedTestMatch._id);
        
        // Clean up test match
        await Match.findByIdAndDelete(savedTestMatch._id);
        console.log('🗑️ Test match cleaned up');
        
      } catch (createError) {
        console.error('❌ Test match creation failed:', createError);
      }
    }
    
    return res.status(200).json({
      success: true,
      debug: {
        database: 'connected',
        league: league ? league.name : null,
        teamsCount: teams.length,
        matchesCount: matches.length,
        teams: teams.map(t => ({ id: t._id, name: t.name })),
        sampleMatch: matches[0] || null
      }
    });
    
  } catch (error) {
    console.error('💥 Debug error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}

export default authMiddleware(handler);