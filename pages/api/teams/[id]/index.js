// Create these additional folders for complete API structure:

// 1. pages/api/teams/[id]/index.js - Individual team operations
import connectDB from '../../../../lib/mongodb';
import { Team, Player } from '../../../../lib/models';
import { authMiddleware } from '../../../../lib/auth';

export default async function handler(req, res) {
  await connectDB();
  
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      return await getTeam(req, res, id);
    case 'PUT':
      return await authMiddleware(updateTeam)(req, res, id);
    case 'DELETE':
      return await authMiddleware(deleteTeam)(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTeam(req, res, id) {
  try {
    const team = await Team.findById(id)
      .populate('league', 'name season')
      .populate('captain', 'name number');
      
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get team players
    const players = await Player.find({ team: id }).sort({ number: 1 });
    
    return res.status(200).json({
      team,
      players,
      playersCount: players.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch team' });
  }
}

async function updateTeam(req, res, id) {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData.id; // Remove id from update data
    
    const team = await Team.findByIdAndUpdate(id, updateData, { new: true })
      .populate('league', 'name season');
      
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    return res.status(200).json({ message: 'Team updated successfully', team });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update team' });
  }
}

async function deleteTeam(req, res, id) {
  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Delete all players in this team
    await Player.deleteMany({ team: id });
    
    // Delete the team
    await Team.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Team and all players deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete team' });
  }
}