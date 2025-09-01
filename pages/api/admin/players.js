// ===========================================
// FILE: pages/api/admin/players.js (FIXED - POSITION OPTIONAL)
// ===========================================
import connectDB from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';

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
    await connectDB();
    
    // Get session with better error handling
    const session = await getServerSession(req, res, authOptions);
    console.log('Session check:', { 
      hasSession: !!session, 
      userRole: session?.user?.role,
      userId: session?.user?.id 
    });
    
    if (!session) {
      console.log('No session found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'admin') {
      console.log('User is not admin:', session.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        try {
          const { seasonId, teamId, status = 'all' } = req.query;

          let query = {};
          
          if (seasonId && seasonId !== 'all') {
            query.currentTeamHistory = {
              $elemMatch: { season: new mongoose.Types.ObjectId(seasonId) }
            };
          }
          
          if (teamId && teamId !== 'all') {
            query.currentTeam = new mongoose.Types.ObjectId(teamId);
          }
          
          if (status !== 'all') {
            query.status = status;
          }

          const players = await Player.find(query)
            .populate('currentTeam', 'name logo')
            .populate('currentTeamHistory.team', 'name logo')
            .populate('currentTeamHistory.season', 'name')
            .sort({ createdAt: -1 })
            .lean();

          console.log(`Found ${players.length} players`);
          
          // Always return an array, even if empty
          return res.status(200).json(Array.isArray(players) ? players : []);
          
        } catch (error) {
          console.error('Error fetching players:', error);
          return res.status(500).json({ 
            message: 'Failed to fetch players',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'POST':
        try {
          const playerData = req.body;
          console.log('Creating player:', playerData.name);

          // FIXED: Only validate name is required (no position required for futsal)
          if (!playerData.name || !playerData.name.trim()) {
            return res.status(400).json({ 
              message: 'Player name is required' 
            });
          }

          // Validate jersey number uniqueness if provided and team assigned
          if (playerData.jerseyNumber && playerData.currentTeam) {
            const existingPlayer = await Player.findOne({
              currentTeam: playerData.currentTeam,
              jerseyNumber: playerData.jerseyNumber,
              status: { $in: ['active', 'injured', 'suspended'] }
            });

            if (existingPlayer) {
              return res.status(400).json({
                message: `Jersey number ${playerData.jerseyNumber} is already taken in this team`
              });
            }
          }

          const player = new Player({
            ...playerData,
            status: playerData.status || 'active'
          });

          await player.save();
          
          const populatedPlayer = await Player.findById(player._id)
            .populate('currentTeam', 'name logo')
            .lean();

          console.log('Player created successfully:', player._id);
          return res.status(201).json(populatedPlayer);
          
        } catch (error) {
          console.error('Error creating player:', error);
          
          // Handle duplicate jersey number error
          if (error.code === 'DUPLICATE_JERSEY') {
            return res.status(400).json({ message: error.message });
          }
          
          // Handle mongoose validation errors
          if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ 
              message: 'Validation failed', 
              details: errors 
            });
          }
          
          return res.status(500).json({ 
            message: 'Failed to create player',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'PUT':
        try {
          const { id, ...updateData } = req.body;
          console.log('Updating player:', id);

          if (!id) {
            return res.status(400).json({ message: 'Player ID is required' });
          }

          // Validate name if provided
          if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
            return res.status(400).json({ message: 'Player name cannot be empty' });
          }

          // Validate jersey number uniqueness if being updated
          if (updateData.jerseyNumber && updateData.currentTeam) {
            const existingPlayer = await Player.findOne({
              currentTeam: updateData.currentTeam,
              jerseyNumber: updateData.jerseyNumber,
              _id: { $ne: id },
              status: { $in: ['active', 'injured', 'suspended'] }
            });

            if (existingPlayer) {
              return res.status(400).json({
                message: `Jersey number ${updateData.jerseyNumber} is already taken in this team`
              });
            }
          }

          const player = await Player.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
          ).populate('currentTeam', 'name logo').lean();

          if (!player) {
            return res.status(404).json({ message: 'Player not found' });
          }

          console.log('Player updated successfully:', id);
          return res.status(200).json(player);
          
        } catch (error) {
          console.error('Error updating player:', error);
          
          // Handle duplicate jersey number error
          if (error.code === 'DUPLICATE_JERSEY') {
            return res.status(400).json({ message: error.message });
          }
          
          // Handle mongoose validation errors
          if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ 
              message: 'Validation failed', 
              details: errors 
            });
          }
          
          return res.status(500).json({ 
            message: 'Failed to update player',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'DELETE':
        try {
          const { id } = req.query;
          console.log('Deleting player:', id);

          if (!id) {
            return res.status(400).json({ message: 'Player ID is required' });
          }

          const player = await Player.findByIdAndDelete(id);
          
          if (!player) {
            return res.status(404).json({ message: 'Player not found' });
          }

          console.log('Player deleted successfully:', id);
          return res.status(200).json({ message: 'Player deleted successfully' });
          
        } catch (error) {
          console.error('Error deleting player:', error);
          return res.status(500).json({ 
            message: 'Failed to delete player',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}
