// ===========================================
// FILE: pages/api/public/players.js (FIXED - Free Agents Always Visible)
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
    const { seasonId, teamId, search } = req.query;
    
    let query = { status: { $in: ['active', 'injured', 'suspended'] } }; // Only show active players
    
    // Filter by season - FIXED TO INCLUDE FREE AGENTS
    if (seasonId && seasonId !== 'all') {
      const teams = await Team.find({ season: seasonId }).select('_id');
      const teamIds = teams.map(team => team._id);
      console.log(`Season ${seasonId} has teams:`, teamIds);
      
      if (teamIds.length > 0) {
        // Show both players on teams in this season AND free agents
        // (Free agents could potentially join teams in this season)
        query.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null } // Include free agents
        ];
      } else {
        // No teams in this season, show only free agents
        console.log('No teams found for season, showing free agents only');
        query.currentTeam = null;
      }
    }
    
    // Filter by team - ENHANCED TO HANDLE FREE AGENTS
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
        // Remove any season-based team filtering when specifically looking for free agents
        if (query.$or) {
          delete query.$or;
        }
        console.log('Filtering for free agents only');
      } else {
        query.currentTeam = teamId;
        // Remove any season-based OR logic when filtering by specific team
        if (query.$or) {
          delete query.$or;
        }
        console.log('Filtering by team:', teamId);
      }
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    console.log('Public players API - Query parameters:', { seasonId, teamId, search });
    console.log('Public players API - MongoDB query:', JSON.stringify(query));

    const players = await Player.find(query)
      .select('-idCardNumber -medicalInfo -emergencyContact -notes -email -phone') // EXCLUDE PRIVATE DATA
      .populate('currentTeam', 'name season logo') // Added logo for display
      .sort({ name: 1 })
      .lean();

    console.log(`Public players API - Raw results: ${players.length} players`);
    console.log('First few players:', players.slice(0, 2).map(p => ({ 
      name: p.name, 
      currentTeam: p.currentTeam?.name || 'Free Agent',
      teamSeason: p.currentTeam?.season 
    })));

    // Transform data for public consumption - MATCH YOUR EXISTING FORMAT
    const publicPlayers = players.map(player => ({
      _id: player._id,
      name: player.name,
      position: player.position || 'Outfield Player',
      jerseyNumber: player.jerseyNumber || null,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality || '',
      height: player.height,
      weight: player.weight,
      photo: normalizePhoto(player.photo), // Normalize photo data
      currentTeam: player.currentTeam ? {
        _id: player.currentTeam._id,
        name: player.currentTeam.name,
        season: player.currentTeam.season,
        logo: normalizePhoto(player.currentTeam.logo)
      } : null,
      status: player.status,
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
      // Add computed stats for display - ENHANCED
      stats: {
        goals: player.careerStats?.goals || 0,
        assists: player.careerStats?.assists || 0,
        matchesPlayed: player.careerStats?.appearances || 0,
        yellowCards: player.careerStats?.yellowCards || 0,
        redCards: player.careerStats?.redCards || 0
      }
    }));

    console.log(`Public players API: Found ${publicPlayers.length} players`);
    console.log('Team breakdown:', {
      withTeams: publicPlayers.filter(p => p.currentTeam).length,
      freeAgents: publicPlayers.filter(p => !p.currentTeam).length
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
