// FILE: pages/api/admin/players.js (PRODUCTION FIX)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Transfer from '../../../models/Transfer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Add CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to database first
    await dbConnect();

    // Check session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      console.log('No session found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'admin') {
      console.log('User role:', session.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (req.method === 'GET') {
      try {
        const { teamId, seasonId } = req.query;
        let query = {};
        
        if (teamId) query.currentTeam = teamId;
        if (seasonId) query.season = seasonId;
        
        const players = await Player.find(query)
          .populate('currentTeam', 'name')
          .populate('season', 'name')
          .sort({ lastName: 1 });
          
        // Always return an array, even if empty
        res.status(200).json(players || []);
      } catch (error) {
        console.error('GET players error:', error);
        res.status(500).json({ message: 'Failed to fetch players', error: error.message });
      }
    }

    if (req.method === 'POST') {
      try {
        const playerData = req.body;
        
        // Create player
        const player = await Player.create(playerData);
        
        // Create initial transfer record
        if (playerData.currentTeam) {
          await Transfer.create({
            player: player._id,
            toTeam: playerData.currentTeam,
            season: playerData.season,
            transferType: 'registration',
          });
        }
        
        const populatedPlayer = await Player.findById(player._id)
          .populate('currentTeam', 'name')
          .populate('season', 'name');
        
        res.status(201).json({
          message: 'Player created successfully',
          player: populatedPlayer,
        });
      } catch (error) {
        console.error('POST players error:', error);
        res.status(500).json({ message: 'Failed to create player', error: error.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const { id, ...updateData } = req.body;
        const originalPlayer = await Player.findById(id);
        
        if (!originalPlayer) {
          return res.status(404).json({ message: 'Player not found' });
        }

        // Check if team changed (transfer)
        if (updateData.currentTeam && 
            originalPlayer.currentTeam?.toString() !== updateData.currentTeam) {
          
          await Transfer.create({
            player: id,
            fromTeam: originalPlayer.currentTeam,
            toTeam: updateData.currentTeam,
            season: originalPlayer.season,
            transferType: 'transfer',
          });
        }
        
        const player = await Player.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        }).populate('currentTeam', 'name').populate('season', 'name');

        res.status(200).json({
          message: 'Player updated successfully',
          player,
        });
      } catch (error) {
        console.error('PUT players error:', error);
        res.status(500).json({ message: 'Failed to update player', error: error.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const { id } = req.query;
        
        const player = await Player.findByIdAndDelete(id);
        if (!player) {
          return res.status(404).json({ message: 'Player not found' });
        }

        res.status(200).json({ message: 'Player deleted successfully' });
      } catch (error) {
        console.error('DELETE players error:', error);
        res.status(500).json({ message: 'Failed to delete player', error: error.message });
      }
    }

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
