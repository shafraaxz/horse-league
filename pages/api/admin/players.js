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
    
    // Session validation (commented out for debugging - uncomment in production)
    // const session = await getServerSession(req, res, authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return res.status(401).json({ message: 'Authentication required' });
    // }

    if (req.method === 'GET') {
      const { seasonId, teamId, search } = req.query;
      
      let query = {};
      
      // Filter by season
      if (seasonId) {
        const teams = await Team.find({ season: seasonId }).select('_id');
        const teamIds = teams.map(team => team._id);
        // Include both team players and free agents for admin view
        query.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null }
        ];
      }
      
      // Filter by team
      if (teamId) {
        query.currentTeam = teamId === 'free-agents' ? null : teamId;
      }
      
      // Search by name
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const players = await Player.find(query)
        .populate('currentTeam', 'name')
        .sort({ name: 1 })
        .lean();

      console.log(`Admin players API: Found ${players.length} players`);
      return res.status(200).json(players || []);
    }

    if (req.method === 'POST') {
      const playerData = req.body;
      
      console.log('=== PLAYER CREATION DEBUG ===');
      console.log('Raw player data received:', JSON.stringify(playerData, null, 2));
      
      // Validate required fields
      if (!playerData.name || !playerData.name.trim()) {
        console.log('❌ Validation failed: Name is required');
        return res.status(400).json({ message: 'Player name is required' });
      }
      
      // DETAILED JERSEY NUMBER DEBUG
      console.log('=== JERSEY NUMBER PROCESSING ===');
      console.log('Original jerseyNumber value:', playerData.jerseyNumber);
      console.log('jerseyNumber type:', typeof playerData.jerseyNumber);
      console.log('jerseyNumber === null:', playerData.jerseyNumber === null);
      console.log('jerseyNumber === undefined:', playerData.jerseyNumber === undefined);
      console.log('jerseyNumber === "":', playerData.jerseyNumber === '');
      console.log('jerseyNumber == 0:', playerData.jerseyNumber == 0);
      
      let jerseyNumber = null;
      if (playerData.jerseyNumber !== undefined && 
          playerData.jerseyNumber !== null && 
          playerData.jerseyNumber !== '' &&
          playerData.jerseyNumber !== 0 &&
          playerData.jerseyNumber !== '0') {
        const parsedJersey = parseInt(playerData.jerseyNumber);
        console.log('Parsed jersey number:', parsedJersey);
        console.log('Is valid number:', !isNaN(parsedJersey) && parsedJersey > 0);
        if (!isNaN(parsedJersey) && parsedJersey > 0) {
          jerseyNumber = parsedJersey;
        }
      }
      
      console.log('Final processed jerseyNumber:', jerseyNumber);
      
      // DETAILED TEAM PROCESSING
      console.log('=== TEAM PROCESSING ===');
      console.log('Original currentTeam:', playerData.currentTeam);
      console.log('currentTeam type:', typeof playerData.currentTeam);
      
      let currentTeam = null;
      if (playerData.currentTeam && 
          playerData.currentTeam !== '' && 
          playerData.currentTeam !== 'null' &&
          playerData.currentTeam !== 'undefined') {
        currentTeam = playerData.currentTeam;
      }
      
      console.log('Final processed currentTeam:', currentTeam);
      
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
      
      // Prepare clean player data
      const cleanPlayerData = {
        name: playerData.name.trim(),
        idCardNumber: playerData.idCardNumber ? playerData.idCardNumber.trim() : undefined,
        email: playerData.email || undefined,
        phone: playerData.phone || undefined,
        dateOfBirth: playerData.dateOfBirth || null,
        nationality: playerData.nationality || '',
        position: playerData.position || undefined,
        jerseyNumber: jerseyNumber,
        height: playerData.height ? parseFloat(playerData.height) : undefined,
        weight: playerData.weight ? parseFloat(playerData.weight) : undefined,
        photo: photoUrl,
        currentTeam: currentTeam,
        status: playerData.status || 'active',
        
        emergencyContact: {
          name: playerData.emergencyContact?.name || '',
          phone: playerData.emergencyContact?.phone || '',
          relationship: playerData.emergencyContact?.relationship || ''
        },
        
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
        
        careerStats: {
          appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0,
          minutesPlayed: 0, wins: 0, losses: 0, draws: 0
        },
        
        notes: playerData.notes || ''
      };
      
      // Remove undefined values
      Object.keys(cleanPlayerData).forEach(key => {
        if (cleanPlayerData[key] === undefined) {
          delete cleanPlayerData[key];
        }
      });
      
      console.log('=== FINAL CLEAN DATA ===');
      console.log('Clean player data:', JSON.stringify(cleanPlayerData, null, 2));
      
      // Validate team exists if provided
      if (cleanPlayerData.currentTeam) {
        if (!mongoose.Types.ObjectId.isValid(cleanPlayerData.currentTeam)) {
          console.log('❌ Invalid team ID format');
          return res.status(400).json({ message: 'Invalid team ID format' });
        }
        
        const team = await Team.findById(cleanPlayerData.currentTeam);
        if (!team) {
          console.log('❌ Team not found');
          return res.status(400).json({ message: 'Team not found' });
        }
        console.log('✅ Team validated:', team.name);
      }
      
      // DETAILED JERSEY VALIDATION DEBUG
      console.log('=== JERSEY VALIDATION DEBUG ===');
      console.log('Should validate jersey?', !!(cleanPlayerData.currentTeam && cleanPlayerData.jerseyNumber));
      
      if (cleanPlayerData.currentTeam && cleanPlayerData.jerseyNumber) {
        console.log(`🔍 Checking for existing jersey ${cleanPlayerData.jerseyNumber} in team ${cleanPlayerData.currentTeam}`);
        
        // Find all players with this jersey number in this team
        const conflictingPlayers = await Player.find({
          currentTeam: cleanPlayerData.currentTeam,
          jerseyNumber: cleanPlayerData.jerseyNumber,
          status: { $in: ['active', 'injured', 'suspended'] }
        });
        
        console.log(`Found ${conflictingPlayers.length} conflicting players:`, conflictingPlayers.map(p => ({
          id: p._id,
          name: p.name,
          jerseyNumber: p.jerseyNumber,
          status: p.status
        })));
        
        if (conflictingPlayers.length > 0) {
          const conflictingPlayer = conflictingPlayers[0];
          console.log('❌ Jersey number conflict detected');
          return res.status(400).json({ 
            message: `Jersey number ${cleanPlayerData.jerseyNumber} is already taken by ${conflictingPlayer.name} in this team`,
            conflictingPlayer: {
              id: conflictingPlayer._id,
              name: conflictingPlayer.name,
              jerseyNumber: conflictingPlayer.jerseyNumber
            }
          });
        } else {
          console.log('✅ Jersey number is available');
        }
      } else {
        console.log('⏭️ Skipping jersey validation - no team or no jersey number');
      }
      
      // Check for duplicate ID card number
      if (cleanPlayerData.idCardNumber) {
        console.log('🔍 Checking for duplicate ID card number');
        const existingPlayer = await Player.findOne({
          idCardNumber: cleanPlayerData.idCardNumber
        });
        
        if (existingPlayer) {
          console.log('❌ ID card number conflict');
          return res.status(400).json({ 
            message: 'A player with this ID card number already exists' 
          });
        } else {
          console.log('✅ ID card number is available');
        }
      }
      
      // Create the player
      try {
        console.log('💾 Creating player in database...');
        const player = new Player(cleanPlayerData);
        await player.save();
        
        console.log('✅ Player created successfully:', player._id);
        
        // AUTO-CREATE TRANSFER RECORD if player has a team
        if (cleanPlayerData.currentTeam) {
          try {
            const activeSeason = await Season.findOne({ isActive: true });
            
            if (activeSeason) {
              const transferRecord = new Transfer({
                player: player._id,
                fromTeam: null,
                toTeam: cleanPlayerData.currentTeam,
                season: activeSeason._id,
                transferType: 'registration',
                transferDate: new Date(),
                transferFee: 0,
                notes: 'Initial player registration'
              });
              
              await transferRecord.save();
              console.log('✅ Transfer record created');
            }
          } catch (transferError) {
            console.error('⚠️ Failed to create transfer record:', transferError);
          }
        }
        
        // Return populated player
        const populatedPlayer = await Player.findById(player._id)
          .populate('currentTeam', 'name')
          .lean();
        
        console.log('✅ Returning populated player');
        return res.status(201).json(populatedPlayer);
        
      } catch (saveError) {
        console.error('❌ Player save error:', saveError);
        console.error('Error details:', {
          code: saveError.code,
          name: saveError.name,
          keyPattern: saveError.keyPattern,
          keyValue: saveError.keyValue
        });
        
        if (saveError.code === 11000) {
          const field = Object.keys(saveError.keyPattern || {})[0];
          const value = saveError.keyValue?.[field];
          console.log(`Duplicate key error - Field: ${field}, Value: ${value}`);
          
          // Special handling for jersey number duplicates
          if (field === 'jerseyNumber') {
            return res.status(400).json({ 
              message: `A player with jersey number ${value} already exists in the database`,
              field,
              value,
              errorType: 'duplicate_key'
            });
          }
          
          return res.status(400).json({ 
            message: `A player with this ${field} already exists`,
            field,
            value,
            errorType: 'duplicate_key'
          });
        }
        
        if (saveError.name === 'ValidationError') {
          const errors = Object.values(saveError.errors).map(err => err.message);
          console.log('Validation errors:', errors);
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors,
            errorType: 'validation'
          });
        }
        
        throw saveError;
      }
    }

    if (req.method === 'PUT') {
      // ... PUT method stays the same for now
      return res.status(405).json({ message: 'PUT method temporarily disabled for debugging' });
    }

    if (req.method === 'DELETE') {
      // ... DELETE method stays the same for now  
      return res.status(405).json({ message: 'DELETE method temporarily disabled for debugging' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Admin players API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      errorType: 'server_error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
