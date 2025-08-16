// 3. pages/api/matches/[id]/index.js - Individual match operations
import connectDB from '../../../../lib/mongodb';
import { Match, Team } from '../../../../lib/models';
import { authMiddleware } from '../../../../lib/auth';

export default async function handler(req, res) {
  await connectDB();
  
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      return await getMatch(req, res, id);
    case 'PUT':
      return await authMiddleware(updateMatch)(req, res, id);
    case 'DELETE':
      return await authMiddleware(deleteMatch)(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getMatch(req, res, id) {
  try {
    const match = await Match.findById(id)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name season')
      .populate('events.player', 'name number')
      .populate('events.team', 'name');
      
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    return res.status(200).json(match);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch match' });
  }
}

async function updateMatch(req, res, id) {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData.id; // Remove id from update data
    
    // Validate teams exist if being updated
    if (updateData.homeTeam || updateData.awayTeam) {
      const match = await Match.findById(id);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      const homeTeamId = updateData.homeTeam || match.homeTeam;
      const awayTeamId = updateData.awayTeam || match.awayTeam;
      
      if (homeTeamId.toString() === awayTeamId.toString()) {
        return res.status(400).json({ error: 'Home team and away team cannot be the same' });
      }
      
      const [homeTeam, awayTeam] = await Promise.all([
        Team.findById(homeTeamId),
        Team.findById(awayTeamId)
      ]);
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: 'One or both teams not found' });
      }
    }
    
    const match = await Match.findByIdAndUpdate(id, updateData, { new: true })
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('league', 'name season');
      
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    return res.status(200).json({ message: 'Match updated successfully', match });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update match' });
  }
}

async function deleteMatch(req, res, id) {
  try {
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Don't allow deletion of live matches
    if (match.status === 'live') {
      return res.status(400).json({ error: 'Cannot delete a live match' });
    }
    
    await Match.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Match deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete match' });
  }
}