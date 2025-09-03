// ===========================================
// FILE: pages/api/admin/players.js (HEAVY DEBUG VERSION)
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

    // HEAVY DEBUG LOGGING
    console.log('=== PLAYERS API REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    
    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
      // POST logic (player creation) - simplified for now
      console.log('POST: Creating new player');
      return res.status(200).json({ message: 'POST method - player creation would go here' });
    }

    if (req.method === 'PUT') {
      console.log('=== PUT REQUEST DEBUG ===');
      
      // Check all possible places the ID could be
      const bodyId = req.body.id;
      const queryId = req.query.id;
      const bodyPlayerId = req.body.playerId;
      const bodyPlayerField = req.body.player;
      
      console.log('ID sources:');
      console.log('- req.body.id:', bodyId);
      console.log('- req.query.id:', queryId); 
      console.log('- req.body.playerId:', bodyPlayerId);
      console.log('- req.body.player:', bodyPlayerField);
      
      // Try to determine the correct ID
      let playerId = bodyId || queryId || bodyPlayerId || bodyPlayerField;
      
      console.log('Determined player ID:', playerId);
      console.log('Player ID type:', typeof playerId);
      console.log('Player ID length:', playerId?.length);
      
      if (!playerId) {
        console.log('❌ No player ID found in request');
        return res.status(400).json({ 
          message: 'Player ID is required',
          debug: {
            bodyId,
            queryId,
            bodyPlayerId,
            bodyPlayerField,
            bodyKeys: Object.keys(req.body),
            queryKeys: Object.keys(req.query)
          }
        });
      }
      
      // Validate the ID format
      if (!mongoose.Types.ObjectId.isValid(playerId)) {
        console.log('❌ Invalid MongoDB ObjectId format');
        return res.status(400).json({ 
          message: 'Invalid player ID format',
          debug: {
            receivedId: playerId,
            idType: typeof playerId,
            idLength: playerId?.length,
            isValidObjectId: mongoose.Types.ObjectId.isValid(playerId)
          }
        });
      }
      
      // Try to find the player
      console.log('🔍 Looking up player in database...');
      const currentPlayer = await Player.findById(playerId);
      
      if (!currentPlayer) {
        console.log('❌ Player not found in database');
        return res.status(404).json({ 
          message: 'Player not found',
          debug: {
            searchedId: playerId,
            idType: typeof playerId
          }
        });
      }
      
      console.log('✅ Player found:', currentPlayer.name);
      
      // Process the update
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.playerId;
      delete updateData.player;
      
      console.log('Update data:', JSON.stringify(updateData, null, 2));
      
      // Track team changes for transfer records
      const oldTeam = currentPlayer.currentTeam?.toString();
      const newTeam = updateData.currentTeam && updateData.currentTeam !== '' && updateData.currentTeam !== 'null' 
        ? updateData.currentTeam 
        : null;
      
      console.log('Team change:', { oldTeam, newTeam });
      
      // Update the player
      const updatedPlayer = await Player.findByIdAndUpdate(
        playerId,
        updateData,
        { new: true, runValidators: false }
      ).populate('currentTeam', 'name');

      if (!updatedPlayer) {
        console.log('❌ Player update failed');
        return res.status(500).json({ message: 'Failed to update player' });
      }

      console.log('✅ Player updated successfully');

      // Create transfer record if team changed
      if (oldTeam !== newTeam) {
        try {
          const activeSeason = await Season.findOne({ isActive: true });
          
          if (activeSeason) {
            const transferRecord = new Transfer({
              player: updatedPlayer._id,
              fromTeam: oldTeam || null,
              toTeam: newTeam || null,
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
            console.log('✅ Transfer record created');
          }
        } catch (transferError) {
          console.error('Transfer record creation failed:', transferError);
        }
      }

      return res.status(200).json(updatedPlayer);
    }

    if (req.method === 'DELETE') {
      console.log('DELETE method called');
      return res.status(200).json({ message: 'DELETE method would go here' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Players API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
