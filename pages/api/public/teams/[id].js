// ===========================================
// FILE: pages/api/public/teams/[id].js (UPDATED WITH LOGO FIX)
// ===========================================
import dbConnect from '../../../../lib/mongodb';
import Team from '../../../../models/Team';
import Player from '../../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Team ID is required' });
  }

  await dbConnect();

  try {
    const team = await Team.findById(id)
      .populate('season', 'name isActive')
      .lean();

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Count players for this team
    const playerCount = await Player.countDocuments({ 
      currentTeam: team._id,
      status: { $in: ['active', 'injured', 'suspended'] }
    });

    // LOGO FIX: Ensure logo is in correct format for frontend
    let logoUrl = null;
    if (team.logo) {
      if (typeof team.logo === 'string' && team.logo.startsWith('http')) {
        logoUrl = team.logo;
      } else if (team.logo.url) {
        logoUrl = team.logo.url;
      } else if (team.logo.secure_url) {
        logoUrl = team.logo.secure_url;
      }
    }

    const teamWithData = {
      ...team,
      playerCount,
      logo: logoUrl, // Always return as string URL or null
      stats: team.stats || {
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        matchesPlayed: 0
      }
    };

    console.log('Public team by ID - Logo debug:', {
      name: team.name,
      logo: teamWithData.logo,
      logoType: typeof teamWithData.logo
    });

    res.status(200).json(teamWithData);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
