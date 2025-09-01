// ===========================================
// FILE: pages/api/admin/players.js (FIXED WITH PHOTO VALIDATION)
// ===========================================
import dbConnect from '../../../lib/mongodb';
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
    await dbConnect();
    
    // Session validation (commented out for debugging)
    // const session = await getServerSession(req, res, authOptions);
    // if (!session) {
    //   return res.status(401).json({ message: 'Authentication required' });
    // }

    if (req.method === 'GET') {
      const { seasonId, teamId, search } = req.query;
      
      let query = {};
      
      // Filter by season
      if (seasonId) {
        const teams = await Team.find({ season: seasonId }).select('_id');
        const teamIds = teams.map(team => team._id);
        query.currentTeam = { $in: teamIds };
      }
      
      // Filter by team
      if (teamId) {
        query.currentTeam = teamId;
      }
      
      // Search by name
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const players = await Player.find(query)
        .populate('currentTeam', 'name')
        .sort({ name: 1 })
        .lean();

      console.log(`Found ${players.length} players`);
      return res.status(200).json(players || []);
    }

    if (req.method === 'POST') {
      const playerData = req.body;
      
      console.log('Creating player with data:', JSON.stringify(playerData, null, 2));
      
      // Validate required fields
      if (!playerData.name || !playerData.name.trim()) {
        console.log('Validation failed: Name is required');
        return res.status(400).json({ message: 'Player name is required' });
      }
      
      // Handle photo data - normalize to string URL
      let photoUrl = null;
      if (playerData.photo) {
        if (typeof playerData.photo === 'string' && playerData.photo.startsWith('http')) {
          photoUrl = playerData.photo;
        } else if (playerData.photo.url) {
          photoUrl = playerData.photo.url;
        } else if (playerData.photo.secure_url) {
          photoUrl = playerData.photo.secure_url;
        }
      }
      
      // Prepare clean player data matching Player model schema
      const cleanPlayerData = {
        name: playerData.name.trim(),
        idCardNumber: playerData.idCardNumber ? playerData.idCardNumber.trim() : undefined, // Private SKU
        email: playerData.email || undefined, // Optional field
        phone: playerData.phone || undefined,
        dateOfBirth: playerData.dateOfBirth || null,
        nationality: playerData.nationality || '',
        position: playerData.position || undefined, // Optional in futsal model
        jerseyNumber: playerData.jerseyNumber ? parseInt(playerData.jerseyNumber) : undefined, // Fixed: undefined instead of null
        height: playerData.height ? parseFloat(playerData.height) : undefined,
        weight: playerData.weight ? parseFloat(playerData.weight) : undefined,
        photo: photoUrl, // Store as string URL
        currentTeam: playerData.currentTeam || null,
        status: playerData.status || 'active',
        
        // Emergency contact - exactly as model expects
        emergencyContact: {
          name: playerData.emergencyContact?.name || '',
          phone: playerData.emergencyContact?.phone || '',
          relationship: playerData.emergencyContact?.relationship || ''
        },
        
        // Medical info - match model structure (arrays for allergies/conditions)
        medicalInfo: {
          bloodType: playerData.medicalInfo?.bloodType || '',
          allergies: Array.isArray(playerData.medicalInfo?.allergies) 
            ? playerData.medicalInfo.allergies 
            : (playerData.medicalInfo?.allergies ? [playerData.medicalInfo.allergies] : []),
          conditions: Array.isArray(playerData.medicalInfo?.conditions) 
            ? playerData.medicalInfo.conditions 
            : (playerData.medicalInfo?.conditions ? [playerData.medicalInfo.conditions] : []),
          notes: playerData.medicalInfo?.notes || ''
        },
        
        // Career stats - use model structure
        careerStats: {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0
        },
        
        notes: playerData.notes || ''
      };
      
      // Remove undefined values to prevent MongoDB issues
      Object.keys(cleanPlayerData).forEach(key => {
        if (cleanPlayerData[key] === undefined) {
          delete cleanPlayerData[key];
        }
      });
      
      console.log('Clean player data:', JSON.stringify(cleanPlayerData, null, 2));
      
      // Validate team exists if provided
      if (cleanPlayerData.currentTeam) {
        if (!mongoose.Types.ObjectId.isValid(cleanPlayerData.currentTeam)) {
          return res.status(400).json({ message: 'Invalid team ID format' });
        }
        
        const team = await Team.findById(cleanPlayerData.currentTeam);
        if (!team) {
          return res.status(400).json({ message: 'Team not found' });
        }
      }
      
      // Check for duplicate jersey number in the same team (only if both team and jersey exist)
      if (cleanPlayerData.currentTeam && cleanPlayerData.jerseyNumber) {
        const existingPlayer = await Player.findOne({
          currentTeam: cleanPlayerData.currentTeam,
          jerseyNumber: cleanPlayerData.jerseyNumber,
          status: { $in: ['active', 'injured', 'suspended'] }
        });
        
        if (existingPlayer) {
          return res.status(400).json({ 
            message: `Jersey number ${cleanPlayerData.jerseyNumber} is already taken by another player in this team` 
          });
        }
      }
      
      // Check for duplicate ID card number
      if (cleanPlayerData.idCardNumber) {
        const existingPlayer = await Player.findOne({
          idCardNumber: cleanPlayerData.idCardNumber
        });
        
        if (existingPlayer) {
          return res.status(400).json({ 
            message: 'A player with this ID card number already exists' 
          });
        }
      }
      
      // Create the player
      try {
        const player = new Player(cleanPlayerData);
        await player.save();
        
        console.log('Player created successfully:', player._id);
        
        // AUTO-CREATE TRANSFER RECORD if player has a team
        if (cleanPlayerData.currentTeam) {
          try {
            const Transfer = require('../../../models/Transfer');
            const Season = require('../../../models/Season');
            
            // Get active season
            const activeSeason = await Season.findOne({ isActive: true });
            
            if (activeSeason) {
              const transferRecord = new Transfer({
                player: player._id,
                fromTeam: null, // New registration
                toTeam: cleanPlayerData.currentTeam,
                season: activeSeason._id,
                transferType: 'registration',
                transferDate: new Date(),
                transferFee: 0,
                notes: 'Initial player registration'
              });
              
              await transferRecord.save();
              console.log('Transfer record created for new player:', transferRecord._id);
            }
          } catch (transferError) {
            console.error('Failed to create transfer record:', transferError);
            // Don't fail the whole operation if transfer creation fails
          }
        }
        
        // Return populated player
        const populatedPlayer = await Player.findById(player._id)
          .populate('currentTeam', 'name')
          .lean();
        
        return res.status(201).json(populatedPlayer);
      } catch (saveError) {
        console.error('Player save error:', saveError);
        
        if (saveError.code === 11000) {
          // Duplicate key error
          const field = Object.keys(saveError.keyPattern)[0];
          return res.status(400).json({ 
            message: `A player with this ${field} already exists` 
          });
        }
        
        if (saveError.name === 'ValidationError') {
          const errors = Object.values(saveError.errors).map(err => err.message);
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors 
          });
        }
        
        throw saveError;
      }
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const updateData = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }
      
      // Handle photo data for updates
      if (updateData.photo) {
        if (typeof updateData.photo === 'string' && updateData.photo.startsWith('http')) {
          updateData.photo = updateData.photo;
        } else if (updateData.photo.url) {
          updateData.photo = updateData.photo.url;
        } else if (updateData.photo.secure_url) {
          updateData.photo = updateData.photo.secure_url;
        }
      }
      
      const updatedPlayer = await Player.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('currentTeam', 'name');

      if (!updatedPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      return res.status(200).json(updatedPlayer);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }

      const deletedPlayer = await Player.findByIdAndDelete(id);
      if (!deletedPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      return res.status(200).json({ message: 'Player deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Admin players API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
