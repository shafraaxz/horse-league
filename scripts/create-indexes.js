// scripts/create-indexes.js - Run this to create all necessary indexes
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function createIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    console.log('\n📊 Creating indexes...\n');
    
    // Leagues indexes
    console.log('Creating indexes for leagues collection...');
    await db.collection('leagues').createIndexes([
      { key: { status: 1, createdAt: -1 }, name: 'status_createdAt' },
      { key: { sport: 1 }, name: 'sport' },
      { key: { type: 1 }, name: 'type' },
      { key: { createdBy: 1 }, name: 'createdBy' },
      { key: { name: 'text' }, name: 'text_search' } // Text search
    ]);
    console.log('✅ Leagues indexes created');
    
    // Teams indexes
    console.log('Creating indexes for teams collection...');
    await db.collection('teams').createIndexes([
      { key: { leagues: 1 }, name: 'leagues' },
      { key: { name: 1 }, name: 'name' },
      { key: { 'statistics.points': -1 }, name: 'points_desc' },
      { key: { name: 'text', coach: 'text' }, name: 'text_search' }
    ]);
    console.log('✅ Teams indexes created');
    
    // Players indexes
    console.log('Creating indexes for players collection...');
    await db.collection('players').createIndexes([
      { key: { team: 1, jerseyNumber: 1 }, name: 'team_jersey', unique: true },
      { key: { position: 1 }, name: 'position' },
      { key: { 'statistics.goals': -1 }, name: 'goals_desc' },
      { key: { 'statistics.assists': -1 }, name: 'assists_desc' },
      { key: { isActive: 1 }, name: 'active' },
      { key: { name: 'text' }, name: 'text_search' }
    ]);
    console.log('✅ Players indexes created');
    
    // Matches indexes
    console.log('Creating indexes for matches collection...');
    await db.collection('matches').createIndexes([
      { key: { league: 1, matchDate: -1 }, name: 'league_date' },
      { key: { homeTeam: 1, awayTeam: 1 }, name: 'teams' },
      { key: { status: 1 }, name: 'status' },
      { key: { matchDate: -1 }, name: 'date_desc' },
      { key: { isLive: 1 }, name: 'live_matches' },
      { key: { league: 1, round: 1 }, name: 'league_round' }
    ]);
    console.log('✅ Matches indexes created');
    
    // Admins indexes
    console.log('Creating indexes for admins collection...');
    await db.collection('admins').createIndexes([
      { key: { email: 1 }, name: 'email', unique: true },
      { key: { role: 1 }, name: 'role' },
      { key: { isActive: 1 }, name: 'active' },
      { key: { assignedLeagues: 1 }, name: 'assigned_leagues' }
    ]);
    console.log('✅ Admins indexes created');
    
    // Standings indexes
    console.log('Creating indexes for standings collection...');
    await db.collection('standings').createIndexes([
      { key: { league: 1, team: 1 }, name: 'league_team', unique: true },
      { key: { league: 1, points: -1, goalDifference: -1 }, name: 'league_ranking' },
      { key: { updatedAt: -1 }, name: 'updated' }
    ]);
    console.log('✅ Standings indexes created');
    
    // List all indexes
    console.log('\n📋 Listing all indexes:\n');
    const collections = ['leagues', 'teams', 'players', 'matches', 'admins', 'standings'];
    
    for (const collection of collections) {
      const indexes = await db.collection(collection).indexes();
      console.log(`\n${collection}:`);
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
    console.log('\n✅ All indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

createIndexes();
