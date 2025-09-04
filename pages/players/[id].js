// ===========================================
// FILE: pages/api/players/[id].js (UPDATED WITH CONTRACT INFORMATION)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Player ID is required' });
  }

  await dbConnect();

  try {
    // Fetch player with populated contract data
    const player = await Player.findById(id)
      .populate('currentTeam', 'name logo season')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive startDate endDate')
      .lean();

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    console.log('Individual player API - Contract debug:', {
      playerId: player._id,
      name: player.name,
      contractStatus: player.contractStatus,
      currentContract: player.currentContract
    });

    // Remove private/sensitive data before sending to frontend
    const publicPlayerData = {
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
      
      // Include contract information
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

    console.log(`Individual player API: Found player ${player.name} with contract status: ${publicPlayerData.contractStatus}`);
    
    res.status(200).json(publicPlayerData);
    
  } catch (error) {
    console.error('Individual player API error:', error);
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
