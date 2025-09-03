// ===========================================
// FILE: pages/api/admin/players.js (AUTO CREATES TRANSFER RECORDS)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Transfer from '../../../models/Transfer';
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

    // Check authentication for non-GET requests
    if (req.method !== 'GET') {
      const session = await getServerSession(req, res, authOptions);
      if (!session || session.user.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    console.log('=== ADMIN PLAYERS API ===');
    console.log('Method:', req.method);
    console.log('Query:', req.query);
    
    if (req.method === 'GET') {
      const { seasonId, teamId, search } = req.query;
      
      let query = {};
      
      // Season filtering - include free agents
      if (seasonId && seasonId !== 'all') {
        const teams = await Team.find({ season: seasonId }).select('_id');
        const teamIds = teams.map(team => team._id);
        
        if (teamIds.length > 0) {
          query.$or = [
            { currentTeam: { $in: teamIds } },
            { currentTeam: null } // Include free agents
          ];
        } else {
          query.currentTeam = null;
        }
      }
      
      // Team filtering
      if (teamId && teamId !== 'all') {
        if (teamId === 'free-agents') {
          query.currentTeam = null;
          if (query.$or) delete query.$or;
        } else {
          query.currentTeam = teamId;
          if (query.$or) delete query.$or;
        }
      }
      
      // Search filtering
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      console.log('Admin players query:', JSON.stringify(query));

      const players = await Player.find(query)
        .populate('currentTeam', 'name season logo')
        .sort({ name: 1 })
        .lean();

      console.log(`Admin players API: Found ${players.length} players`);
      res.status(200).json(players);
      
    } else if (req.method === 'POST') {
      console.log('=== CREATING NEW PLAYER ===');
      const playerData = req.body;
      console.log('Player data:', { name: playerData.name, currentTeam: playerData.currentTeam });
      
      // Validate required fields
      if (!playerData.name) {
        return res.status(400).json({ message: 'Player name is required' });
      }
      
      // Get active season for transfer record
      const activeSeason = await Season.findOne({ isActive: true });
      if (!activeSeason) {
        return res.status(400).json({ message: 'No active season found' });
      }

      console.log('Active season:', activeSeason.name);

      // Create the player first
      const newPlayer = new Player(playerData);
      const savedPlayer = await newPlayer.save();
      
      console.log('✅ Player created:', savedPlayer._id, savedPlayer.name);

      // AUTO-CREATE TRANSFER RECORD
      try {
        const transferData = {
          player: savedPlayer._id,
          fromTeam: null, // New registration
          toTeam: playerData.currentTeam || null,
          season: activeSeason._id,
          transferDate: new Date(),
          transferType: 'registration',
          notes: playerData.currentTeam 
            ? `Initial registration - joined team`
            : `Initial registration - free agent`
        };

        console.log('Creating transfer record:', transferData);

        const transfer = new Transfer(transferData);
        await transfer.save();
        
        console.log('✅ Transfer record created:', transfer._id);
      } catch (transferError) {
        console.error('❌ Transfer creation failed:', transferError);
        // Don't fail player creation if transfer fails
      }

      // Return populated player
      const populatedPlayer = await Player.findById(savedPlayer._id)
        .populate('currentTeam', 'name season logo')
        .lean();

      console.log('=== PLAYER CREATION COMPLETED ===');
      res.status(201).json(populatedPlayer);
      
    } else if (req.method === 'PUT') {
      console.log('=== UPDATING PLAYER ===');
      const { _id, ...updateData } = req.body;
      console.log('Updating player:', _id);
      console.log('Update data:', { currentTeam: updateData.currentTeam });
      
      if (!_id) {
        return res.status(400).json({ message: 'Player ID is required' });
      }

      // Get current player data to detect team changes
      const currentPlayer = await Player.findById(_id);
      if (!currentPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      const oldTeamId = currentPlayer.currentTeam?.toString();
      const newTeamId = updateData.currentTeam?.toString();
      
      console.log('Team change check:', { 
        oldTeam: oldTeamId || 'null', 
        newTeam: newTeamId || 'null',
        changed: oldTeamId !== newTeamId 
      });

      // Update the player
      const updatedPlayer = await Player.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      ).populate('currentTeam', 'name season logo');

      if (!updatedPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      console.log('✅ Player updated successfully');

      // AUTO-CREATE TRANSFER RECORD IF TEAM CHANGED
      if (oldTeamId !== newTeamId) {
        console.log('=== TEAM CHANGED - CREATING TRANSFER ===');
        
        const activeSeason = await Season.findOne({ isActive: true });
        if (activeSeason) {
          try {
            let transferType = 'transfer';
            let notes = '';
            
            if (!oldTeamId && newTeamId) {
              transferType = 'registration';
              notes = 'Joined team from free agency';
              console.log('Transfer type: Free agent → Team');
            } else if (oldTeamId && !newTeamId) {
              transferType = 'release';
              notes = 'Released to free agency';
              console.log('Transfer type: Team → Free agent');
            } else if (oldTeamId && newTeamId) {
              transferType = 'transfer';
              notes = 'Transfer between teams';
              console.log('Transfer type: Team → Team');
            }

            const transferData = {
              player: _id,
              fromTeam: oldTeamId || null,
              toTeam: newTeamId || null,
              season: activeSeason._id,
              transferDate: new Date(),
              transferType: transferType,
              notes: notes
            };

            console.log('Creating transfer record:', transferData);

            const transfer = new Transfer(transferData);
            await transfer.save();
            
            console.log('✅ Transfer record created:', transfer._id, `(${transferType})`);
          } catch (transferError) {
            console.error('❌ Transfer creation failed:', transferError);
            // Don't fail player update if transfer fails
          }
        } else {
          console.log('❌ No active season found - transfer record not created');
        }
      } else {
        console.log('No team change - no transfer record needed');
      }

      console.log('=== PLAYER UPDATE COMPLETED ===');
      res.status(200).json(updatedPlayer);
      
    } else if (req.method === 'DELETE') {
      console.log('=== DELETING PLAYER ===');
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Player ID is required' });
      }

      const deletedPlayer = await Player.findByIdAndDelete(id);
      
      if (!deletedPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      console.log('✅ Player deleted:', id);
      
      // Note: We preserve transfer records for historical data
      
      res.status(200).json({ message: 'Player deleted successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ Admin players API error:', error);
    console.error('Error stack:', error.stack);
    
    let statusCode = 500;
    let message = 'Internal server error';
    
    // Handle specific mongoose errors
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
    }
    
    res.status(statusCode).json({ 
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
