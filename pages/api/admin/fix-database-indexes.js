// ===========================================
// FILE: pages/api/admin/fix-database-indexes.js
// Clean up problematic database indexes
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    console.log('Starting database index cleanup...');
    
    // Get the collection directly
    const collection = Player.collection;
    
    // List all current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes on Player collection:');
    indexes.forEach(idx => {
      console.log('- Index:', JSON.stringify(idx.key), 'Unique:', idx.unique, 'Sparse:', idx.sparse);
    });
    
    const results = [];
    
    // Drop all problematic jersey-related indexes
    const problematicIndexes = [
      { jerseyNumber: 1 },
      'jerseyNumber_1',
      { jerseyNumber: 1, unique: true }
    ];
    
    for (const indexSpec of problematicIndexes) {
      try {
        await collection.dropIndex(indexSpec);
        console.log(`✅ Dropped index: ${JSON.stringify(indexSpec)}`);
        results.push(`Dropped: ${JSON.stringify(indexSpec)}`);
      } catch (dropError) {
        console.log(`⚠️ Could not drop index ${JSON.stringify(indexSpec)}: ${dropError.message}`);
        results.push(`Could not drop: ${JSON.stringify(indexSpec)} - ${dropError.message}`);
      }
    }
    
    // Ensure the correct compound index exists
    try {
      const correctIndex = await collection.createIndex(
        { currentTeam: 1, jerseyNumber: 1 }, 
        { 
          unique: true,
          sparse: true,
          partialFilterExpression: { 
            jerseyNumber: { $exists: true, $ne: null },
            currentTeam: { $exists: true, $ne: null }
          }
        }
      );
      console.log('✅ Created/verified correct compound index');
      results.push('Created correct compound index: currentTeam + jerseyNumber');
    } catch (createError) {
      console.log('⚠️ Could not create compound index:', createError.message);
      results.push(`Could not create compound index: ${createError.message}`);
    }
    
    // Test the fix by trying to create players with null jersey numbers
    const testResults = [];
    
    try {
      // Test 1: Create player with null jersey
      const testPlayer1 = new Player({
        name: 'Test Player 1 - DELETE ME',
        jerseyNumber: null,
        currentTeam: null,
        status: 'active'
      });
      await testPlayer1.save();
      await Player.findByIdAndDelete(testPlayer1._id);
      console.log('✅ Test 1 passed: null jersey number works');
      testResults.push('Test 1 passed: null jersey numbers allowed');
    } catch (test1Error) {
      console.log('❌ Test 1 failed:', test1Error.message);
      testResults.push(`Test 1 failed: ${test1Error.message}`);
    }
    
    try {
      // Test 2: Create two players with null jersey numbers
      const testPlayer2a = new Player({
        name: 'Test Player 2a - DELETE ME',
        jerseyNumber: null,
        currentTeam: null,
        status: 'active'
      });
      const testPlayer2b = new Player({
        name: 'Test Player 2b - DELETE ME', 
        jerseyNumber: null,
        currentTeam: null,
        status: 'active'
      });
      
      await testPlayer2a.save();
      await testPlayer2b.save();
      
      await Player.findByIdAndDelete(testPlayer2a._id);
      await Player.findByIdAndDelete(testPlayer2b._id);
      
      console.log('✅ Test 2 passed: multiple null jersey numbers work');
      testResults.push('Test 2 passed: multiple null jersey numbers allowed');
    } catch (test2Error) {
      console.log('❌ Test 2 failed:', test2Error.message);
      testResults.push(`Test 2 failed: ${test2Error.message}`);
    }
    
    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:');
    finalIndexes.forEach(idx => {
      console.log('- Index:', JSON.stringify(idx.key), 'Unique:', idx.unique, 'Sparse:', idx.sparse);
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Database index cleanup completed',
      results,
      testResults,
      finalIndexes: finalIndexes.map(idx => ({
        key: idx.key,
        unique: idx.unique,
        sparse: idx.sparse,
        partialFilterExpression: idx.partialFilterExpression
      }))
    });
    
  } catch (error) {
    console.error('Database cleanup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clean up database indexes',
      error: error.message 
    });
  }
}
