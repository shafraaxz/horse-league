// ===========================================
// FILE: pages/api/public/teams.js (UPDATED WITH LOGO FIX)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Season from '../../../models/Season';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId } = req.query;
    
    let query = {};
    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    } else {
      // Get active season by default
      const activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        query.season = activeSeason._id;
      }
    }
    
    const teams = await Team.find(query)
      .populate('season', 'name isActive')
      .sort({ name: 1 })
      .lean();

    // Get player count for each team and normalize logo format
    const teamsWithData = await Promise.all(
      teams.map(async (team) => {
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
        
        return {
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
      })
    );

    console.log('Public teams API - Logo debug:', teamsWithData.slice(0, 2).map(t => ({
      name: t.name,
      logo: t.logo,
      logoType: typeof t.logo
    })));
    
    res.status(200).json(teamsWithData);
  } catch (error) {
    console.error('Public teams API error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
