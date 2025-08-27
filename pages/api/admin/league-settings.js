// pages/api/admin/league-settings.js - League Settings API
import dbConnect from '../../../lib/mongodb';
import League from '../../../models/League';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  console.log(`League Settings API: ${method} /api/admin/league-settings`);
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify admin authentication
  try {
    const user = await verifyAuth(req);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (method === 'GET') {
    try {
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

      return res.status(200).json({
        success: true,
        data: {
          name: league.name,
          shortName: league.shortName,
          description: league.description,
          currentSeason: league.currentSeason,
          maxTeams: league.maxTeams,
          maxPlayersPerTeam: league.maxPlayersPerTeam,
          minPlayersPerTeam: league.minPlayersPerTeam,
          matchDuration: league.rules?.matchDuration || 40,
          pointsForWin: league.pointsForWin,
          pointsForDraw: league.pointsForDraw,
          pointsForLoss: league.pointsForLoss,
          logo: league.logo,
          banner: league.banner,
          settings: league.settings
        }
      });
    } catch (error) {
      console.error('Error fetching league settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch league settings'
      });
    }
  }

  if (method === 'POST') {
    try {
      const {
        name,
        shortName,
        description,
        currentSeason,
        maxTeams,
        maxPlayersPerTeam,
        minPlayersPerTeam,
        matchDuration,
        pointsForWin,
        pointsForDraw,
        pointsForLoss,
        logo,
        banner
      } = req.body;

      let league = await League.findOne({ 
        $or: [
          { isDefault: true }, 
          { slug: 'the-horse-futsal-league' }
        ],
        isActive: true 
      });

      if (!league) {
        // Create default league if it doesn't exist
        league = new League({
          name: name || 'The Horse Futsal League',
          shortName: shortName || 'HFL',
          slug: 'the-horse-futsal-league',
          isDefault: true,
          sport: 'futsal',
          isActive: true
        });
      }

      // Update league settings
      league.name = name || league.name;
      league.shortName = shortName || league.shortName;
      league.description = description || league.description;
      league.currentSeason = currentSeason || league.currentSeason;
      league.maxTeams = maxTeams !== undefined ? parseInt(maxTeams) : league.maxTeams;
      league.maxPlayersPerTeam = maxPlayersPerTeam !== undefined ? parseInt(maxPlayersPerTeam) : league.maxPlayersPerTeam;
      league.minPlayersPerTeam = minPlayersPerTeam !== undefined ? parseInt(minPlayersPerTeam) : league.minPlayersPerTeam;
      league.pointsForWin = pointsForWin !== undefined ? parseInt(pointsForWin) : league.pointsForWin;
      league.pointsForDraw = pointsForDraw !== undefined ? parseInt(pointsForDraw) : league.pointsForDraw;
      league.pointsForLoss = pointsForLoss !== undefined ? parseInt(pointsForLoss) : league.pointsForLoss;
      
      if (logo !== undefined) league.logo = logo;
      if (banner !== undefined) league.banner = banner;

      // Update rules
      if (!league.rules) league.rules = {};
      league.rules.matchDuration = matchDuration !== undefined ? parseInt(matchDuration) : league.rules.matchDuration || 40;

      await league.save();

      console.log('League settings updated successfully');

      return res.status(200).json({
        success: true,
        message: 'League settings updated successfully',
        data: {
          name: league.name,
          shortName: league.shortName,
          description: league.description,
          currentSeason: league.currentSeason,
          maxTeams: league.maxTeams,
          maxPlayersPerTeam: league.maxPlayersPerTeam,
          minPlayersPerTeam: league.minPlayersPerTeam,
          matchDuration: league.rules?.matchDuration,
          pointsForWin: league.pointsForWin,
          pointsForDraw: league.pointsForDraw,
          pointsForLoss: league.pointsForLoss,
          logo: league.logo,
          banner: league.banner
        }
      });
    } catch (error) {
      console.error('Error updating league settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update league settings',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${method} not allowed`
  });
}