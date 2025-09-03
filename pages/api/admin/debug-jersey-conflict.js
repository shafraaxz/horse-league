// ===========================================
// FILE: pages/api/admin/debug-jersey-conflict.js
// Find exactly what's causing the jersey number conflict
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    console.log('🔍 Starting jersey number conflict investigation...');
    
    const collection = Player.collection;
    
    // 1. Show all current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(idx => {
      console.log(`- ${JSON.stringify(idx.key)} | unique: ${idx.unique} | sparse: ${idx.sparse}`);
    });
    
    // 2. Find ALL players and their jersey number status
    const allPlayers = await Player.find({}).lean();
    console.log(`\nTotal players in database: ${allPlayers.length}`);
    
    // Group players by jersey number characteristics
    const jerseyAnalysis = {
      withNumbers: [],
      withNull: [],
      withUndefined: [],
      noJerseyField: []
    };
    
    allPlayers.forEach(player => {
      if (player.hasOwnProperty('jerseyNumber')) {
        if (player.jerseyNumber === null) {
          jerseyAnalysis.withNull.push({
            id: player._id,
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            currentTeam: player.currentTeam
          });
        } else if (player.jerseyNumber === undefined) {
          jerseyAnalysis.withUndefined.push({
            id: player._id,
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            currentTeam: player.currentTeam
          });
        } else {
          jerseyAnalysis.withNumbers.push({
            id: player._id,
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            currentTeam: player.currentTeam
          });
        }
      } else {
        jerseyAnalysis.noJerseyField.push({
          id: player._id,
          name: player.name,
          currentTeam: player.currentTeam
        });
      }
    });
    
    console.log('\n📊 Jersey Number Analysis:');
    console.log(`Players with actual numbers: ${jerseyAnalysis.withNumbers.length}`);
    console.log(`Players with null: ${jerseyAnalysis.withNull.length}`);
    console.log(`Players with undefined: ${jerseyAnalysis.withUndefined.length}`);
    console.log(`Players with no jersey field: ${jerseyAnalysis.noJerseyField.length}`);
    
    // 3. Look for specific conflicts
    const conflicts = [];
    
    // Check for null conflicts
    if (jerseyAnalysis.withNull.length > 1) {
      conflicts.push({
        type: 'multiple_null',
        count: jerseyAnalysis.withNull.length,
        players: jerseyAnalysis.withNull
      });
    }
    
    // Check for same number conflicts
    const numberGroups = {};
    jerseyAnalysis.withNumbers.forEach(player => {
      const key = `${player.currentTeam}-${player.jerseyNumber}`;
      if (!numberGroups[key]) {
        numberGroups[key] = [];
      }
      numberGroups[key].push(player);
    });
    
    Object.entries(numberGroups).forEach(([key, players]) => {
      if (players.length > 1) {
        conflicts.push({
          type: 'duplicate_number',
          key,
          count: players.length,
          players
        });
      }
    });
    
    console.log(`\n⚠️ Found ${conflicts.length} conflicts:`, conflicts);
    
    // 4. Test what happens when we try to create a player
    console.log('\n🧪 Testing player creation...');
    
    const testResults = [];
    
    // Test 1: Player with no jersey field
    try {
      const testData1 = {
        name: 'TEST PLAYER 1 - DELETE ME',
        status: 'active'
        // No jerseyNumber field
      };
      
      const testPlayer1 = new Player(testData1);
      await testPlayer1.save();
      await Player.findByIdAndDelete(testPlayer1._id);
      testResults.push('✅ Test 1 passed: No jersey field');
    } catch (test1Error) {
      testResults.push(`❌ Test 1 failed: ${test1Error.message}`);
      console.log('Test 1 error details:', test1Error);
    }
    
    // Test 2: Player with explicit null jersey
    try {
      const testData2 = {
        name: 'TEST PLAYER 2 - DELETE ME',
        jerseyNumber: null,
        status: 'active'
      };
      
      const testPlayer2 = new Player(testData2);
      await testPlayer2.save();
      await Player.findByIdAndDelete(testPlayer2._id);
      testResults.push('✅ Test 2 passed: Explicit null jersey');
    } catch (test2Error) {
      testResults.push(`❌ Test 2 failed: ${test2Error.message}`);
      console.log('Test 2 error details:', test2Error);
    }
    
    // Test 3: Player with team but no jersey
    try {
      const testData3 = {
        name: 'TEST PLAYER 3 - DELETE ME',
        currentTeam: allPlayers[0]?.currentTeam, // Use an existing team
        status: 'active'
        // No jerseyNumber field
      };
      
      const testPlayer3 = new Player(testData3);
      await testPlayer3.save();
      await Player.findByIdAndDelete(testPlayer3._id);
      testResults.push('✅ Test 3 passed: Team but no jersey');
    } catch (test3Error) {
      testResults.push(`❌ Test 3 failed: ${test3Error.message}`);
      console.log('Test 3 error details:', test3Error);
    }
    
    // 5. Raw MongoDB query to check what the database actually sees
    const rawQuery = await collection.find({
      $or: [
        { jerseyNumber: null },
        { jerseyNumber: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`\n🔍 Raw MongoDB query found ${rawQuery.length} players with null/missing jersey numbers`);
    
    res.status(200).json({
      success: true,
      message: 'Jersey conflict investigation completed',
      analysis: {
        totalPlayers: allPlayers.length,
        jerseyBreakdown: {
          withNumbers: jerseyAnalysis.withNumbers.length,
          withNull: jerseyAnalysis.withNull.length,
          withUndefined: jerseyAnalysis.withUndefined.length,
          noJerseyField: jerseyAnalysis.noJerseyField.length
        },
        conflicts,
        testResults,
        rawQueryResults: rawQuery.length
      },
      indexes: indexes.map(idx => ({
        key: idx.key,
        unique: idx.unique,
        sparse: idx.sparse,
        partialFilterExpression: idx.partialFilterExpression
      })),
      sampleConflicts: {
        nullPlayers: jerseyAnalysis.withNull.slice(0, 3),
        duplicateNumbers: conflicts.filter(c => c.type === 'duplicate_number').slice(0, 2)
      }
    });
    
  } catch (error) {
    console.error('Jersey conflict investigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Investigation failed',
      error: error.message
    });
  }
}
