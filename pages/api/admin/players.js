import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Transfer from '../../../models/Transfer';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await dbConnect();

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
        
      res.status(200).json(players);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
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
      res.status(500).json({ message: 'Server error', error: error.message });
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
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}
