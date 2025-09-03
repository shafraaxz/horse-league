// ===========================================
// FILE: pages/api/public/transfers.js (ENHANCED - Player Support)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  await dbConnect();
  
  try {
    const { seasonId, limit = 20, teamId, playerId } = req.query;
    
    let query = {};
    
    // Filter by season
    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    }
    
    // ENHANCED: Filter by player (for player profiles)
    if (playerId && playerId !== 'all') {
      query.player = playerId;
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
    
    const transfers = await Transfer.find(query)
      .populate('player', 'name photo position')
      .populate('fromTeam', 'name logo')
      .populate('toTeam', 'name logo')
      .populate('season', 'name')
      .sort({ transferDate: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Filter out orphaned transfers (where player is null)
    const validTransfers = transfers.filter(transfer => transfer.player);
    
    if (transfers.length !== validTransfers.length) {
      console.log(`Filtered out ${transfers.length - validTransfers.length} orphaned transfers`);
    }
    
    // ENHANCED: Add transfer descriptions for better display
    const enhancedTransfers = validTransfers.map(transfer => {
      let description = '';
      let transferDirection = '';
      
      // Determine transfer type and create description
      if (!transfer.fromTeam && transfer.toTeam) {
        // Joining from free agency
        description = `${transfer.player.name} joined ${transfer.toTeam.name}`;
        transferDirection = 'incoming';
      } else if (transfer.fromTeam && !transfer.toTeam) {
        // Released to free agency
        description = `${transfer.player.name} released from ${transfer.fromTeam.name}`;
        transferDirection = 'outgoing';
      } else if (transfer.fromTeam && transfer.toTeam) {
        // Team to team transfer
        description = `${transfer.player.name} transferred from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`;
        transferDirection = 'transfer';
      } else {
        // Initial registration as free agent
        description = `${transfer.player.name} registered as free agent`;
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
        player: {
          ...transfer.player,
          photo: normalizeLogoData(transfer.player.photo)
        }
      };
    });
    
    console.log(`Public transfers API: Found ${enhancedTransfers.length} valid transfers${playerId ? ' for player ' + playerId : ''}`);
    
    res.status(200).json(enhancedTransfers || []);
    
  } catch (error) {
    console.error('Public transfers API error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Helper function to normalize logo/photo data
function normalizeLogoData(data) {
  if (!data) return null;
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'object') {
    return data.secure_url || data.url || null;
  }
  
  return null;
}
