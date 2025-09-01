// ===========================================
// FILE: pages/api/admin/cleanup-transfers.js
// Remove orphaned transfer records (where player no longer exists)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Find all transfers
    const allTransfers = await Transfer.find({});
    console.log(`Found ${allTransfers.length} total transfers`);

    let deletedCount = 0;
    const orphanedTransfers = [];

    // Check each transfer for orphaned player references
    for (const transfer of allTransfers) {
      const playerExists = await Player.findById(transfer.player);
      
      if (!playerExists) {
        orphanedTransfers.push({
          id: transfer._id,
          playerId: transfer.player,
          toTeam: transfer.toTeam,
          date: transfer.transferDate
        });
      }
    }

    console.log(`Found ${orphanedTransfers.length} orphaned transfers`);

    // Delete orphaned transfers
    if (orphanedTransfers.length > 0) {
      const orphanedIds = orphanedTransfers.map(t => t.id);
      await Transfer.deleteMany({ _id: { $in: orphanedIds } });
      deletedCount = orphanedTransfers.length;
      
      console.log(`Deleted ${deletedCount} orphaned transfers`);
    }

    const remainingTransfers = await Transfer.countDocuments({});

    const result = {
      message: 'Transfer cleanup completed',
      results: {
        totalOriginal: allTransfers.length,
        orphanedFound: orphanedTransfers.length,
        orphanedDeleted: deletedCount,
        remainingTransfers: remainingTransfers
      },
      orphanedDetails: orphanedTransfers
    };

    console.log('Cleanup result:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error cleaning up transfers:', error);
    res.status(500).json({ 
      message: 'Error cleaning up transfers',
      error: error.message 
    });
  }
}
