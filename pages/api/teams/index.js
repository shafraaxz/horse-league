import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Team, League, Player } from '../../../lib/models';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Database connection
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for teams');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        // Allow public access for GET requests
        return getTeams(req, res);
      case 'POST':
      case 'PUT':
      case 'DELETE':
        // Require authentication for modify operations
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        if (req.method === 'POST') {
          return createTeam(req, res, decoded);
        } else if (req.method === 'PUT') {
          return updateTeam(req, res);
        } else if (req.method === 'DELETE') {
          return deleteTeam(req, res);
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Teams API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function getTeams(req, res) {
  try {
    const { leagueId } = req.query;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    const teams = await Team.find({ league: leagueId })
      .populate({
        path: 'league',
        select: 'name'
      })
      .sort({ name: 1 });

    // Get player counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const playersCount = await Player.countDocuments({ team: team._id });
        return {
          ...team.toObject(),
          playersCount
        };
      })
    );

    res.status(200).json(teamsWithCounts);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

async function createTeam(req, res, decoded) {
  try {
    const { name, logo, leagueId, stadium, coach, founded } = req.body;

    if (!name || !leagueId) {
      return res.status(400).json({ error: 'Team name and league are required' });
    }

    // Check if team name already exists in the league
    const existingTeam = await Team.findOne({ name, league: leagueId });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists in this league' });
    }

    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const team = new Team({
      name,
      logo,
      league: leagueId,
      stadium,
      coach,
      founded: founded ? new Date(founded) : undefined,
      playersCount: 0
    });

    const savedTeam = await team.save();

    // Update league teams count
    await League.findByIdAndUpdate(leagueId, {
      $inc: { teamsCount: 1 }
    });

    const populatedTeam = await Team.findById(savedTeam._id)
      .populate('league', 'name');

    res.status(201).json({
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
}

async function updateTeam(req, res) {
  try {
    const { id, name, logo, stadium, coach, founded } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (stadium !== undefined) updateData.stadium = stadium;
    if (coach !== undefined) updateData.coach = coach;
    if (founded !== undefined) updateData.founded = founded ? new Date(founded) : null;

    const team = await Team.findByIdAndUpdate(id, updateData, { new: true })
      .populate('league', 'name');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.status(200).json({
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
}

async function deleteTeam(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Delete all players in the team
    await Player.deleteMany({ team: id });
    
    // Delete the team
    await Team.findByIdAndDelete(id);

    // Update league teams count
    await League.findByIdAndUpdate(team.league, {
      $inc: { teamsCount: -1 }
    });

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
}
