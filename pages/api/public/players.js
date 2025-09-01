// ===========================================
// FILE: pages/api/public/players.js (FIXED - EXCLUDE ID CARD NUMBER)
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
    
    // Filter by season
    if (seasonId && seasonId !== 'all') {
      const teams = await Team.find({ season: seasonId }).select('_id');
      const teamIds = teams.map(team => team._id);
      if (teamIds.length > 0) {
        query.currentTeam = { $in: teamIds };
      } else {
        // No teams in this season, return empty array
        return res.status(200).json([]);
      }
    }
    
    // Filter by team
    if (teamId && teamId !== 'all') {
      query.currentTeam = teamId;
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const players = await Player.find(query)
      .select('-idCardNumber -medicalInfo -emergencyContact -notes -email -phone') // EXCLUDE PRIVATE DATA
      .populate('currentTeam', 'name season')
      .sort({ name: 1 })
      .lean();

    // Transform data for public consumption - MATCH FRONTEND EXPECTATIONS
    const publicPlayers = players.map(player => ({
      _id: player._id,
      name: player.name, // Use single name field
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      height: player.height,
      weight: player.weight,
      photo: player.photo, // Keep as string URL for consistency
      currentTeam: player.currentTeam,
      status: player.status,
      careerStats: player.careerStats || {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      },
      // Add computed stats for display - MATCH PUBLIC PAGE EXPECTATIONS
      stats: {
        goals: player.careerStats?.goals || 0,
        assists: player.careerStats?.assists || 0,
        matchesPlayed: player.careerStats?.appearances || 0
      }
    }));

    console.log(`Public players API: Found ${publicPlayers.length} players`);
    
    res.status(200).json(publicPlayers);
  } catch (error) {
    console.error('Public players API error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
