// ===========================================
// FILE: pages/api/public/players.js (UPDATED WITH CONTRACT STATUS)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId, teamId, search, limit = 50 } = req.query;
    
    let query = {};
    
    // Handle search by player ID or name
    if (search) {
      if (search.length === 24) { // MongoDB ObjectId length
        // Search by ID first
        query._id = search;
      } else {
        // Search by name
        query.name = { $regex: search, $options: 'i' };
      }
    }
    
    // Filter by season (through teams)
    if (seasonId && seasonId !== 'all') {
      const teams = await Team.find({ season: seasonId }).select('_id');
      const teamIds = teams.map(team => team._id);
      
      if (teamIds.length > 0) {
        query.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null } // Include free agents
        ];
      } else {
        query.currentTeam = null;
      }
    }
    
    // Filter by team
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
        if (query.$or) delete query.$or; // Remove season filtering
      } else {
        query.currentTeam = teamId;
        if (query.$or) delete query.$or; // Remove season filtering
      }
    }

    console.log('Public players API query:', JSON.stringify(query, null, 2));
    
    const players = await Player.find(query)
      .populate('currentTeam', 'name logo season')
      .populate('currentContract.team', 'name logo') // NEW: Populate contract team
      .populate('currentContract.season', 'name isActive startDate endDate') // NEW: Populate contract season
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`Public players API: Found ${players.length} players`);

    // Remove private/sensitive data and ensure contract status is included
    const publicPlayers = players.map(player => {
      // Debug contract data
      if (player._id.toString() === search) {
        console.log('Player contract debug:', {
          playerId: player._id,
          name: player.name,
          contractStatus: player.contractStatus,
          currentContract: player.currentContract
        });
      }

      return {
        _id: player._id,
        name: player.name,
        position: player.position || 'Outfield Player',
        jerseyNumber: player.jerseyNumber,
        dateOfBirth: player.dateOfBirth,
        nationality: player.nationality || '',
        height: player.height,
        weight: player.weight,
        photo: normalizePhoto(player.photo),
        currentTeam: player.currentTeam ? {
          _id: player.currentTeam._id,
          name: player.currentTeam.name,
          logo: normalizePhoto(player.currentTeam.logo),
          season: player.currentTeam.season
        } : null,
        status: player.status,
        
        // NEW: Include contract information (public safe data)
        contractStatus: player.contractStatus || 'free_agent',
        currentContract: player.currentContract && player.currentContract.team ? {
          team: player.currentContract.team ? {
            _id: player.currentContract.team._id,
            name: player.currentContract.team.name,
            logo: normalizePhoto(player.currentContract.team.logo)
          } : null,
          season: player.currentContract.season ? {
            _id: player.currentContract.season._id,
            name: player.currentContract.season.name,
            isActive: player.currentContract.season.isActive,
            startDate: player.currentContract.season.startDate,
            endDate: player.currentContract.season.endDate
          } : null,
          contractType: player.currentContract.contractType,
          startDate: player.currentContract.startDate,
          endDate: player.currentContract.endDate,
          contractValue: player.currentContract.contractValue || 0,
          notes: player.currentContract.notes || ''
        } : null,
        
        careerStats: player.careerStats || {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0
        },
        
        // Computed stats for display
        stats: {
          goals: player.careerStats?.goals || 0,
          assists: player.careerStats?.assists || 0,
          matchesPlayed: player.careerStats?.appearances || 0,
          yellowCards: player.careerStats?.yellowCards || 0,
          redCards: player.careerStats?.redCards || 0,
          minutesPlayed: player.careerStats?.minutesPlayed || 0
        }
      };
    });

    res.status(200).json(publicPlayers);
    
  } catch (error) {
    console.error('Public players API error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Helper function to normalize photo/logo data
function normalizePhoto(photo) {
  if (!photo) return null;
  
  if (typeof photo === 'string') {
    return photo;
  }
  
  if (typeof photo === 'object') {
    return photo.secure_url || photo.url || null;
  }
  
  return null;
}
