// 2. pages/api/players/[id]/index.js - Individual player operations
import connectDB from '../../../../lib/mongodb';
import { Player, Team } from '../../../../lib/models';
import { authMiddleware } from '../../../../lib/auth';

export default async function handler(req, res) {
  await connectDB();
  
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      return await getPlayer(req, res, id);
    case 'PUT':
      return await authMiddleware(updatePlayer)(req, res, id);
    case 'DELETE':
      return await authMiddleware(deletePlayer)(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getPlayer(req, res, id) {
  try {
    const player = await Player.findById(id)
      .populate('team', 'name logo league')
      .populate('league', 'name season');
      
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    return res.status(200).json(player);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch player' });
  }
}

async function updatePlayer(req, res, id) {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData.id; // Remove id from update data
    
    // Validate jersey number uniqueness within team
    if (updateData.number) {
      const existingPlayer = await Player.findOne({
        team: updateData.team,
        number: updateData.number,
        _id: { $ne: id }
      });
      
      if (existingPlayer) {
        return res.status(400).json({ error: 'Jersey number already taken in this team' });
      }
    }
    
    const player = await Player.findByIdAndUpdate(id, updateData, { new: true })
      .populate('team', 'name logo')
      .populate('league', 'name season');
      
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    return res.status(200).json({ message: 'Player updated successfully', player });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update player' });
  }
}

async function deletePlayer(req, res, id) {
  try {
    const player = await Player.findByIdAndDelete(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Update team player count
    await Team.findByIdAndUpdate(player.team, {
      $inc: { playersCount: -1 }
    });
    
    return res.status(200).json({ message: 'Player deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete player' });
  }
}