// scripts/check-performance.js - Check index usage
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkPerformance() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('🔍 Checking index usage...\n');
  
  // Example query with explain
  const explanation = await db.collection('matches')
    .find({ league: 'some-league-id', status: 'completed' })
    .explain('executionStats');
  
  console.log('Query Performance:');
  console.log('- Documents examined:', explanation.executionStats.totalDocsExamined);
  console.log('- Documents returned:', explanation.executionStats.nReturned);
  console.log('- Execution time:', explanation.executionStats.executionTimeMillis, 'ms');
  console.log('- Index used:', explanation.executionStats.executionStages.indexName || 'NONE');
  
  await mongoose.connection.close();
}

// Run if needed
// checkPerformance();