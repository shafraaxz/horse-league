// ===========================================
// FILE: pages/api/admin/players.js (FIXED COMPLETELY)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';
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
    await dbConnect();

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
          const { seasonId, teamId, search } = req.query;
          
          let query = {};
          
          if (seasonId) {
            const teams = await Team.find({ season: seasonId }).select('_id');
            const teamIds = teams.map(team => team._id);
            query.$or = [
              { currentTeam: { $in: teamIds } },
              { currentTeam: null }
            ];
          }
          
          if (teamId) {
            query.currentTeam = teamId === 'free-agents' ? null : teamId;
          }
          
          if (search) {
            query.name = { $regex: search, $options: 'i' };
          }

          const players = await Player.find(query)
            .populate('currentTeam', 'name')
            .sort({ name: 1 })
            .lean();

          console.log(`GET: Found ${players.length} players`);
          return res.status(200).json(players || []);
          
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
          console.log('Creating new player:', playerData);

          // Validate required fields
          if (!playerData.name || !playerData.name.trim()) {
            return res.status(400).json({ message: 'Player name is required' });
          }

          // Handle jersey number validation ONLY if team and jersey number are provided
          if (playerData.currentTeam && playerData.jerseyNumber && 
              playerData.jerseyNumber !== '' && playerData.jerseyNumber !== null) {
            
            const existingPlayer = await Player.findOne({
              currentTeam: playerData.currentTeam,
              jerseyNumber: playerData.jerseyNumber
            });

            if (existingPlayer) {
              return res.status(400).json({ 
                message: `Jersey number ${playerData.jerseyNumber} is already taken by another player in this team`
              });
            }
          }

          // Clean up data - handle empty strings
          const cleanData = {
            ...playerData,
            name: playerData.name.trim(),
            jerseyNumber: (playerData.jerseyNumber && playerData.jerseyNumber !== '') ? 
              parseInt(playerData.jerseyNumber) : null,
            currentTeam: (playerData.currentTeam && playerData.currentTeam !== '') ? 
              new mongoose.Types.ObjectId(playerData.currentTeam) : null,
            height: playerData.height ? parseFloat(playerData.height) : null,
            weight: playerData.weight ? parseFloat(playerData.weight) : null,
            dateOfBirth: playerData.dateOfBirth || null,
            status: playerData.status || 'active',
            careerStats: {
              appearances: 0,
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0,
              minutesPlayed: 0
            }
          };

          // Create new player
          const player = new Player(cleanData);
          await player.save();
          
          // Populate team data for response
          await player.populate('currentTeam', 'name');

          // Create transfer record if player joined a team
          if (cleanData.currentTeam) {
            try {
              const activeSeason = await Season.findOne({ isActive: true });
              if (activeSeason) {
                const transferRecord = new Transfer({
                  player: player._id,
                  fromTeam: null, // New registration
                  toTeam: cleanData.currentTeam,
                  season: activeSeason._id,
                  transferType: 'registration',
                  transferDate: new Date(),
                  transferFee: 0,
                  notes: 'Player registration'
                });
                
                await transferRecord.save();
                console.log('Transfer record created for new player');
              }
            } catch (transferError) {
              console.error('Transfer record creation failed:', transferError);
              // Don't fail the player creation if transfer record fails
            }
          }

          console.log('Player created successfully:', player._id);
          return res.status(201).json(player);
          
        } catch (error) {
          console.error('Error creating player:', error);
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

          // Validate MongoDB ObjectId
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid player ID format' });
          }

          // Get current player
          const currentPlayer = await Player.findById(id);
          if (!currentPlayer) {
            return res.status(404).json({ message: 'Player not found' });
          }

          // Handle jersey number validation for updates
          if (updateData.currentTeam && updateData.jerseyNumber && 
              updateData.jerseyNumber !== '' && updateData.jerseyNumber !== null) {
            
            const existingPlayer = await Player.findOne({
              _id: { $ne: id }, // Exclude current player
              currentTeam: updateData.currentTeam,
              jerseyNumber: updateData.jerseyNumber
            });

            if (existingPlayer) {
              return res.status(400).json({ 
                message: `Jersey number ${updateData.jerseyNumber} is already taken by another player in this team`
              });
            }
          }

          // Clean up update data
          const cleanUpdateData = {
            ...updateData,
            jerseyNumber: (updateData.jerseyNumber && updateData.jerseyNumber !== '') ? 
              parseInt(updateData.jerseyNumber) : null,
            currentTeam: (updateData.currentTeam && updateData.currentTeam !== '' && updateData.currentTeam !== 'null') ? 
              new mongoose.Types.ObjectId(updateData.currentTeam) : null,
            height: updateData.height ? parseFloat(updateData.height) : null,
            weight: updateData.weight ? parseFloat(updateData.weight) : null,
          };

          // Track team changes for transfer records
          const oldTeam = currentPlayer.currentTeam?.toString();
          const newTeam = cleanUpdateData.currentTeam?.toString();

          // Update player
          const updatedPlayer = await Player.findByIdAndUpdate(
            id,
            cleanUpdateData,
            { new: true, runValidators: false }
          ).populate('currentTeam', 'name');

          if (!updatedPlayer) {
            return res.status(500).json({ message: 'Failed to update player' });
          }

          // Create transfer record if team changed
          if (oldTeam !== newTeam) {
            try {
              const activeSeason = await Season.findOne({ isActive: true });
              
              if (activeSeason) {
                const transferRecord = new Transfer({
                  player: updatedPlayer._id,
                  fromTeam: oldTeam ? new mongoose.Types.ObjectId(oldTeam) : null,
                  toTeam: newTeam ? new mongoose.Types.ObjectId(newTeam) : null,
                  season: activeSeason._id,
                  transferType: oldTeam && newTeam ? 'transfer' : 
                               !oldTeam && newTeam ? 'registration' : 
                               'release',
                  transferDate: new Date(),
                  transferFee: 0,
                  notes: oldTeam && newTeam ? 'Player transfer between teams' :
                         !oldTeam && newTeam ? 'Player assigned to team from free agency' :
                         'Player released to free agency'
                });
                
                await transferRecord.save();
                console.log('Transfer record created for team change');
              }
            } catch (transferError) {
              console.error('Transfer record creation failed:', transferError);
              // Don't fail the update if transfer record fails
            }
          }

          console.log('Player updated successfully:', id);
          return res.status(200).json(updatedPlayer);
          
        } catch (error) {
          console.error('Error updating player:', error);
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

          // Clean up related transfer records
          await Transfer.deleteMany({ player: id });

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
