// ===========================================
// FILE: pages/api/admin/fairplay.js (NEW - Fair Play Management API)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import FairPlayRecord from '../../../models/FairPlayRecord';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await dbConnect();
    
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        try {
          const { seasonId, teamId, playerId } = req.query;
          
          let query = {};
          
          if (seasonId && seasonId !== 'all') {
            query.season = seasonId;
          }
          
          if (teamId && teamId !== 'all') {
            query.team = teamId;
          }
          
          if (playerId && playerId !== 'all') {
            query.player = playerId;
          }

          const fairPlayRecords = await FairPlayRecord.find(query)
            .populate('team', 'name logo')
            .populate('player', 'name position photo')
            .populate('season', 'name isActive')
            .populate('addedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

          console.log(`Found ${fairPlayRecords.length} fair play records`);
          return res.status(200).json(fairPlayRecords);
          
        } catch (error) {
          console.error('Error fetching fair play records:', error);
          return res.status(500).json({ 
            message: 'Failed to fetch fair play records',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'POST':
        try {
          const {
            team,
            player, // Optional - can be team-wide penalty
            season,
            actionType,
            points,
            description,
            actionDate,
            reference // Optional reference number
          } = req.body;

          // Validate required fields
          if (!team || !season || !actionType || !points || !description) {
            return res.status(400).json({ 
              message: 'Team, season, action type, points, and description are required' 
            });
          }

          if (typeof points !== 'number' || points <= 0) {
            return res.status(400).json({ 
              message: 'Points must be a positive number' 
            });
          }

          // Verify team exists
          const teamExists = await Team.findById(team);
          if (!teamExists) {
            return res.status(400).json({ message: 'Team not found' });
          }

          // Verify player exists if provided
          if (player) {
            const playerExists = await Player.findById(player);
            if (!playerExists) {
              return res.status(400).json({ message: 'Player not found' });
            }
          }

          // Verify season exists
          const seasonExists = await Season.findById(season);
          if (!seasonExists) {
            return res.status(400).json({ message: 'Season not found' });
          }

          // Create fair play record
          const fairPlayRecord = new FairPlayRecord({
            team,
            player: player || null,
            season,
            actionType,
            points,
            description,
            actionDate: actionDate ? new Date(actionDate) : new Date(),
            reference: reference || null,
            addedBy: session.user.id
          });

          await fairPlayRecord.save();
          
          // Populate the response
          const populatedRecord = await FairPlayRecord.findById(fairPlayRecord._id)
            .populate('team', 'name logo')
            .populate('player', 'name position photo')
            .populate('season', 'name isActive')
            .populate('addedBy', 'name email')
            .lean();

          console.log('Fair play record created:', populatedRecord._id);
          return res.status(201).json(populatedRecord);
          
        } catch (error) {
          console.error('Error creating fair play record:', error);
          return res.status(500).json({ 
            message: 'Failed to create fair play record',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'PUT':
        try {
          const { id, ...updateData } = req.body;

          if (!id) {
            return res.status(400).json({ message: 'Record ID is required' });
          }

          // Validate points if being updated
          if (updateData.points && (typeof updateData.points !== 'number' || updateData.points <= 0)) {
            return res.status(400).json({ 
              message: 'Points must be a positive number' 
            });
          }

          const fairPlayRecord = await FairPlayRecord.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
          ).populate('team', 'name logo')
           .populate('player', 'name position photo')
           .populate('season', 'name isActive')
           .populate('addedBy', 'name email')
           .lean();

          if (!fairPlayRecord) {
            return res.status(404).json({ message: 'Fair play record not found' });
          }

          console.log('Fair play record updated:', id);
          return res.status(200).json(fairPlayRecord);
          
        } catch (error) {
          console.error('Error updating fair play record:', error);
          return res.status(500).json({ 
            message: 'Failed to update fair play record',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'DELETE':
        try {
          const { id } = req.query;

          if (!id) {
            return res.status(400).json({ message: 'Record ID is required' });
          }

          const fairPlayRecord = await FairPlayRecord.findByIdAndDelete(id);
          
          if (!fairPlayRecord) {
            return res.status(404).json({ message: 'Fair play record not found' });
          }

          console.log('Fair play record deleted:', id);
          return res.status(200).json({ message: 'Fair play record deleted successfully' });
          
        } catch (error) {
          console.error('Error deleting fair play record:', error);
          return res.status(500).json({ 
            message: 'Failed to delete fair play record',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
    
  } catch (error) {
    console.error('Fair Play API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}
