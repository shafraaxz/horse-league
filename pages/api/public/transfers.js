// ===========================================
// FILE: pages/api/public/transfers.js (ENHANCED - Show Free Agent Moves)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { limit, seasonId, playerId, teamId } = req.query;
    
    let query = {};
    
    // Filter by season
    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    }
    
    // Filter by player
    if (playerId && playerId !== 'all') {
      query.player = playerId;
    }
    
    // Filter by team (either from or to)
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        // Show transfers involving free agency
        query.$or = [
          { fromTeam: null },
          { toTeam: null }
        ];
      } else {
        query.$or = [
          { fromTeam: teamId },
          { toTeam: teamId }
        ];
      }
    }
    
    let transferQuery = Transfer.find(query)
      .populate('player', 'name photo')
      .populate('fromTeam', 'name logo')
      .populate('toTeam', 'name logo')
      .populate('season', 'name isActive')
      .sort({ transferDate: -1 });
    
    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit))) {
      transferQuery = transferQuery.limit(parseInt(limit));
    }
    
    const transfers = await transferQuery.lean();
    
    // Enhance transfer data with better descriptions
    const enhancedTransfers = transfers.map(transfer => {
      let description = '';
      let direction = '';
      
      if (!transfer.fromTeam && transfer.toTeam) {
        description = `${transfer.player.name} joined ${transfer.toTeam.name}`;
        direction = 'incoming';
      } else if (transfer.fromTeam && !transfer.toTeam) {
        description = `${transfer.player.name} released from ${transfer.fromTeam.name}`;
        direction = 'outgoing';
      } else if (transfer.fromTeam && transfer.toTeam) {
        description = `${transfer.player.name} transferred from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`;
        direction = 'transfer';
      } else {
        description = `${transfer.player.name} registered as free agent`;
        direction = 'registration';
      }
      
      return {
        ...transfer,
        description,
        direction,
        // Normalize team logos
        fromTeam: transfer.fromTeam ? {
          ...transfer.fromTeam,
          logo: normalizeLogoData(transfer.fromTeam.logo)
        } : null,
        toTeam: transfer.toTeam ? {
          ...transfer.toTeam,
          logo: normalizeLogoData(transfer.toTeam.logo)
        } : null,
        // Normalize player photo
        player: {
          ...transfer.player,
          photo: normalizeLogoData(transfer.player.photo)
        }
      };
    });
    
    console.log(`Public transfers API: Found ${transfers.length} transfers`);
    
    res.status(200).json(enhancedTransfers);
    
  } catch (error) {
    console.error('Public transfers API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch transfers', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
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
