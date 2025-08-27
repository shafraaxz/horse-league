// pages/api/transfers/index.js - Real Transfer Market API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import League from '../../../models/League';

export default async function handler(req, res) {
  const { method } = req;
  
  console.log(`Transfer Market API: ${method} /api/transfers`);
  
  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  try {
    const { type = 'available', position, team, limit = 50, season } = req.query;

    // Get main league
    const league = await League.findOne({ 
      $or: [
        { isDefault: true }, 
        { slug: 'the-horse-futsal-league' }
      ],
      isActive: true 
    });

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Build query based on type
    let query = { 
      league: league._id, 
      isActive: true,
      registrationStatus: 'registered' 
    };

    switch (type) {
      case 'available':
        // Free agents - players not assigned to any team
        query.currentTeam = null;
        query.marketStatus = 'available';
        break;
        
      case 'assigned':
        // Players currently assigned to teams
        query.currentTeam = { $ne: null };
        query.marketStatus = 'assigned';
        break;
        
      case 'transfer_listed':
        // Players specifically listed for transfer
        query.transferListed = true;
        break;
        
      case 'all':
      default:
        // All registered players
        break;
    }

    // Apply filters
    if (position) {
      query.position = position;
    }
    
    if (team) {
      query.currentTeam = team;
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    const players = await Player.find(query)
      .populate('currentTeam', 'name shortName logo')
      .populate('league', 'name shortName')
      .select(`
        name firstName lastName position dateOfBirth nationality height weight
        preferredFoot photo jerseyNumber marketStatus registrationStatus
        transferPrice lastTransferDate contractEndDate currentTeam league
        statistics.totalMatches statistics.totalGoals statistics.totalAssists
        transferListed isAvailableForTransfer status
      `)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    // Add computed fields
    const playersWithDetails = players.map(player => {
      const age = player.dateOfBirth ? 
        Math.floor((new Date() - new Date(player.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
        null;

      return {
        ...player,
        age,
        displayName: player.firstName && player.lastName 
          ? `${player.firstName} ${player.lastName}` 
          : player.name,
        teamName: player.currentTeam?.name || 'Free Agent',
        isAvailable: !player.currentTeam && player.marketStatus === 'available',
        contractStatus: getContractStatus(player.contractEndDate)
      };
    });

    return res.status(200).json({
      success: true,
      data: playersWithDetails,
      count: playersWithDetails.length,
      filters: { type, position, team, limit },
      league: {
        id: league._id,
        name: league.name,
        currentSeason: league.currentSeason
      }
    });
      
  } catch (error) {
    console.error('Error fetching transfer market:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer market data',
      error: error.message
    });
  }
}

// Helper function for contract status
function getContractStatus(contractEndDate) {
  if (!contractEndDate) return 'no_contract';
  
  const today = new Date();
  const endDate = new Date(contractEndDate);
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  if (endDate < today) return 'expired';
  if (endDate < thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}