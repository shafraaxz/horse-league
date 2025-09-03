// ===========================================
// FILE: pages/api/admin/players.js (SIMPLIFIED - NO JERSEY VALIDATION)
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
      
      console.log('=== SIMPLIFIED PLAYER CREATION ===');
      console.log('Raw player data:', JSON.stringify(playerData, null, 2));
      
      // Validate required fields
      if (!playerData.name || !playerData.name.trim()) {
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
      
      // Process jersey number - SIMPLIFIED
      let jerseyNumber = undefined; // Don't include the field at all if no number
      if (playerData.jerseyNumber && 
          playerData.jerseyNumber !== '' && 
          playerData.jerseyNumber !== 'null' && 
          playerData.jerseyNumber !== null) {
        const parsedJersey = parseInt(playerData.jerseyNumber);
        if (!isNaN(parsedJersey) && parsedJersey > 0) {
          jerseyNumber = parsedJersey;
        }
      }
      
      // Process current team - SIMPLIFIED
      let currentTeam = undefined; // Don't include if no team
      if (playerData.currentTeam && 
          playerData.currentTeam !== '' && 
          playerData.currentTeam !== 'null') {
        currentTeam = playerData.currentTeam;
      }
      
      // Build clean player data - ONLY include fields that have values
      const cleanPlayerData = {
        name: playerData.name.trim(),
        status: playerData.status || 'active'
      };
      
      // Add optional fields only if they have values
      if (playerData.idCardNumber && playerData.idCardNumber.trim()) {
        cleanPlayerData.idCardNumber = playerData.idCardNumber.trim();
      }
      if (playerData.email && playerData.email.trim()) {
        cleanPlayerData.email = playerData.email.trim();
      }
      if (playerData.phone && playerData.phone.trim()) {
        cleanPlayerData.phone = playerData.phone.trim();
      }
      if (playerData.dateOfBirth) {
        cleanPlayerData.dateOfBirth = playerData.dateOfBirth;
      }
      if (playerData.nationality && playerData.nationality.trim()) {
        cleanPlayerData.nationality = playerData.nationality.trim();
      }
      if (playerData.position && playerData.position.trim()) {
        cleanPlayerData.position = playerData.position.trim();
      }
      if (jerseyNumber !== undefined) {
        cleanPlayerData.jerseyNumber = jerseyNumber;
      }
      if (playerData.height) {
        cleanPlayerData.height = parseFloat(playerData.height);
      }
      if (playerData.weight) {
        cleanPlayerData.weight = parseFloat(playerData.weight);
      }
      if (photoUrl) {
        cleanPlayerData.photo = photoUrl;
      }
      if (currentTeam) {
        cleanPlayerData.currentTeam = currentTeam;
      }
      
      // Add nested objects if they exist
      if (playerData.emergencyContact) {
        cleanPlayerData.emergencyContact = {
          name: playerData.emergencyContact.name || '',
          phone: playerData.emergencyContact.phone || '',
          relationship: playerData.emergencyContact.relationship || ''
        };
      }
      
      if (playerData.medicalInfo) {
        cleanPlayerData.medicalInfo = {
          bloodType: playerData.medicalInfo.bloodType || '',
          allergies: Array.isArray(playerData.medicalInfo.allergies) 
            ? playerData.medicalInfo.allergies 
            : (playerData.medicalInfo.allergies ? [playerData.medicalInfo.allergies] : []),
          conditions: Array.isArray(playerData.medicalInfo.conditions) 
            ? playerData.medicalInfo.conditions 
            : (playerData.medicalInfo.conditions ? [playerData.medicalInfo.conditions] : []),
          notes: playerData.medicalInfo.notes || ''
        };
      }
      
      if (playerData.notes && playerData.notes.trim()) {
        cleanPlayerData.notes = playerData.notes.trim();
      }
      
      console.log('Clean player data:', JSON.stringify(cleanPlayerData, null, 2));
      
      // SKIP ALL JERSEY NUMBER VALIDATION - Let MongoDB handle it
      console.log('Skipping jersey number validation - letting database handle constraints');
      
      // Check for duplicate ID card number only
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
      
      // Create the player directly without jersey validation
      try {
        console.log('Creating player directly in database...');
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
            console.error('Transfer record failed:', transferError);
          }
        }
        
        // Return populated player
        const populatedPlayer = await Player.findById(player._id)
          .populate('currentTeam', 'name')
          .lean();
        
        return res.status(201).json(populatedPlayer);
        
      } catch (saveError) {
        console.error('❌ Database save error:', saveError);
        
        // Handle specific MongoDB errors
        if (saveError.code === 11000) {
          const field = Object.keys(saveError.keyPattern || {})[0];
          const value = saveError.keyValue?.[field];
          
          if (field === 'jerseyNumber') {
            return res.status(400).json({ 
              message: `Jersey number ${value} is already taken in this team`
            });
          }
          
          return res.status(400).json({ 
            message: `A player with this ${field} already exists`
          });
        }
        
        if (saveError.name === 'ValidationError') {
          const errors = Object.values(saveError.errors).map(err => err.message);
          return res.status(400).json({ 
            message: 'Player validation failed', 
            errors
          });
        }
        
        // Generic error
        return res.status(500).json({
          message: 'Failed to create player',
          error: saveError.message
        });
      }
    }

    // Simplified PUT method
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updateData = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }
      
      // Just update without complex validation
      const updatedPlayer = await Player.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: false }
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
      error: error.message
    });
  }
}
