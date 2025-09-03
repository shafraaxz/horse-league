// ===========================================
// FILE: pages/api/public/transfers.js (FIXED - Better Error Handling)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    const { seasonId, limit = 20, teamId, playerId } = req.query;
    
    console.log('Public transfers API called with:', { seasonId, limit, teamId, playerId });
    
    let query = {};
    
    // Filter by season
    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    }
    
    // ENHANCED: Filter by player (for player profiles)
    if (playerId && playerId !== 'all') {
      query.player = playerId;
      console.log('Filtering transfers by player:', playerId);
    }
    
    // ENHANCED: Filter by team (including free agent moves)
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        // Show transfers involving free agency (either from or to null)
        query.$or = [
          { fromTeam: null },
          { toTeam: null }
        ];
      } else {
        // Show transfers involving specific team
        query.$or = [
          { fromTeam: teamId },
          { toTeam: teamId }
        ];
      }
    }
    
    console.log('Transfer query:', JSON.stringify(query, null, 2));
    
    // FIXED: Better error handling and population
    const transfers = await Transfer.find(query)
      .populate({
        path: 'player',
        select: 'name photo position',
        // Handle cases where player might be deleted
        options: { strictPopulate: false }
      })
      .populate({
        path: 'fromTeam',
        select: 'name logo',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'toTeam', 
        select: 'name logo',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'season',
        select: 'name',
        options: { strictPopulate: false }
      })
      .sort({ transferDate: -1 })
      .limit(parseInt(limit))
      .lean()
      .catch(error => {
        console.error('Transfer query error:', error);
        return []; // Return empty array on database error
      });
    
    console.log(`Raw transfers found: ${transfers?.length || 0}`);
    
    // Ensure we have an array
    if (!Array.isArray(transfers)) {
      console.error('Transfers is not an array:', typeof transfers);
      return res.status(200).json([]);
    }
    
    // FIXED: Better filtering of orphaned transfers
    const validTransfers = transfers.filter(transfer => {
      // Keep transfers that have valid player data OR are system transfers
      const hasValidPlayer = transfer.player && transfer.player._id;
      const isSystemTransfer = transfer.notes && transfer.notes.includes('system');
      
      if (!hasValidPlayer && !isSystemTransfer) {
        console.log('Filtering out orphaned transfer:', transfer._id);
        return false;
      }
      
      return true;
    });
    
    if (transfers.length !== validTransfers.length) {
      console.log(`Filtered out ${transfers.length - validTransfers.length} orphaned/invalid transfers`);
    }
    
    // ENHANCED: Add transfer descriptions for better display
    const enhancedTransfers = validTransfers.map(transfer => {
      try {
        let description = '';
        let transferDirection = '';
        
        const playerName = transfer.player?.name || 'Unknown Player (Deleted)';
        
        // Determine transfer type and create description
        if (!transfer.fromTeam && transfer.toTeam) {
          // Joining from free agency
          description = `${playerName} joined ${transfer.toTeam.name}`;
          transferDirection = 'incoming';
        } else if (transfer.fromTeam && !transfer.toTeam) {
          // Released to free agency
          description = `${playerName} released from ${transfer.fromTeam.name}`;
          transferDirection = 'outgoing';
        } else if (transfer.fromTeam && transfer.toTeam) {
          // Team to team transfer
          description = `${playerName} transferred from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`;
          transferDirection = 'transfer';
        } else {
          // Initial registration as free agent
          description = `${playerName} registered as free agent`;
          transferDirection = 'registration';
        }
        
        return {
          ...transfer,
          description,
          transferDirection,
          // Normalize logo data for consistent display
          fromTeam: transfer.fromTeam ? {
            ...transfer.fromTeam,
            logo: normalizeLogoData(transfer.fromTeam.logo)
          } : null,
          toTeam: transfer.toTeam ? {
            ...transfer.toTeam,
            logo: normalizeLogoData(transfer.toTeam.logo)
          } : null,
          player: transfer.player ? {
            ...transfer.player,
            photo: normalizeLogoData(transfer.player.photo)
          } : {
            _id: null,
            name: 'Unknown Player (Deleted)',
            photo: null,
            position: 'Player'
          }
        };
      } catch (enhanceError) {
        console.error('Error enhancing transfer:', transfer._id, enhanceError);
        // Return basic transfer data if enhancement fails
        return {
          ...transfer,
          description: `Transfer activity`,
          transferDirection: 'unknown',
          player: transfer.player || { name: 'Unknown Player', photo: null }
        };
      }
    });
    
    console.log(`Public transfers API: Returning ${enhancedTransfers.length} enhanced transfers${playerId ? ' for player ' + playerId : ''}`);
    
    res.status(200).json(enhancedTransfers);
    
  } catch (error) {
    console.error('Public transfers API error:', error);
    console.error('Error stack:', error.stack);
    
    // ALWAYS return empty array on error to prevent frontend crashes
    res.status(200).json([]);
  }
}

// Helper function to normalize logo/photo data
function normalizeLogoData(data) {
  if (!data) return null;
  
  try {
    if (typeof data === 'string') {
      return data;
    }
    
    if (typeof data === 'object') {
      return data.secure_url || data.url || null;
    }
    
    return null;
  } catch (error) {
    console.error('Logo normalization error:', error);
    return null;
  }
}
