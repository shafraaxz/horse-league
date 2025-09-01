// ===========================================
// FILE: pages/api/public/teams/index.js (FIXED LOGO SUPPORT)
// ===========================================
import connectDB from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { seasonId, limit = 50 } = req.query;
    let query = {};

    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    }

    const teams = await Team.find(query)
      .populate('season', 'name isActive')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    // Add player count and ensure logo format
    const teamsWithData = await Promise.all(teams.map(async (team) => {
      // Count players for this team
      const playerCount = await Player.countDocuments({ 
        currentTeam: team._id, 
        status: { $in: ['active', 'injured', 'suspended'] }
      });

      // Ensure logo is in correct format for frontend
      let logoUrl = null;
      if (team.logo) {
        if (typeof team.logo === 'string') {
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
    }));

    console.log('Public teams API - Logo debug:', teamsWithData.slice(0, 3).map(t => ({
      name: t.name,
      logo: t.logo,
      logoType: typeof t.logo
    })));

    return res.status(200).json(teamsWithData);

  } catch (error) {
    console.error('Public teams API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ===========================================
// FILE: pages/api/public/teams/[id].js (FIXED SINGLE TEAM)
// ===========================================
import connectDB from '../../../../lib/mongodb';
import Team from '../../../../models/Team';
import Player from '../../../../models/Player';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await connectDB();

    const team = await Team.findById(id)
      .populate('season', 'name isActive')
      .lean();

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Count players
    const playerCount = await Player.countDocuments({ 
      currentTeam: team._id, 
      status: { $in: ['active', 'injured', 'suspended'] }
    });

    // Fix logo format
    let logoUrl = null;
    if (team.logo) {
      if (typeof team.logo === 'string') {
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
      logo: logoUrl, // Consistent format
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

    return res.status(200).json(teamWithData);

  } catch (error) {
    console.error('Public team by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
