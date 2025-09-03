// ===========================================
// FILE: pages/api/admin/players.js (FIXED VERSION)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Season from '../../../models/Season';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return await getPlayers(req, res);
      case 'POST':
        return await createPlayer(req, res);
      case 'PUT':
        return await updatePlayer(req, res);
      case 'DELETE':
        return await deletePlayer(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin Players API Error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// GET - Fetch players with filters
async function getPlayers(req, res) {
  try {
    const { seasonId, teamId, search } = req.query;
    
    let query = {};
    
    // Add team filter
    if (teamId) {
      query.currentTeam = new mongoose.Types.ObjectId(teamId);
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { idCardNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const players = await Player.find(query)
      .populate('currentTeam', 'name logo')
      .sort({ name: 1 })
      .lean();

    // Process players and ensure proper data format
    const processedPlayers = players.map(player => ({
      _id: player._id,
      name: player.name,
      idCardNumber: player.idCardNumber,
      email: player.email,
      phone: player.phone,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      height: player.height,
      weight: player.weight,
      photo: player.photo,
      currentTeam: player.currentTeam,
      status: player.status,
      notes: player.notes,
      emergencyContact: player.emergencyContact,
      medicalInfo: player.medicalInfo,
      careerStats: player.careerStats || {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      },
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    }));

    console.log(`Admin fetched ${processedPlayers.length} players`);
    
    return res.status(200).json(processedPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
}

// POST - Create new player
async function createPlayer(req, res) {
  try {
    console.log('Creating player with data:', {
      ...req.body,
      idCardNumber: req.body.idCardNumber ? '***HIDDEN***' : undefined
    });

    const {
      name,
      idCardNumber,
      email,
      phone,
      dateOfBirth,
      nationality,
      position,
      jerseyNumber,
      height,
      weight,
      photo,
      currentTeam,
      status,
      notes,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate jersey number if provided
    if (jerseyNumber && (jerseyNumber < 1 || jerseyNumber > 99)) {
      return res.status(400).json({ message: 'Jersey number must be between 1 and 99' });
    }

    // Check for existing email
    if (email) {
      const existingEmail = await Player.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Check for existing ID card number
    if (idCardNumber) {
      const existingIdCard = await Player.findOne({ idCardNumber: idCardNumber.trim() });
      if (existingIdCard) {
        return res.status(400).json({ message: 'Player with this ID card number already exists' });
      }
    }

    // Validate team and jersey number combination
    if (currentTeam && jerseyNumber) {
      const existingJersey = await Player.findOne({
        currentTeam: new mongoose.Types.ObjectId(currentTeam),
        jerseyNumber: parseInt(jerseyNumber),
        status: { $in: ['active', 'injured', 'suspended'] }
      });

      if (existingJersey) {
        return res.status(400).json({ 
          message: `Jersey number ${jerseyNumber} is already taken in this team` 
        });
      }
    }

    // Prepare player data
    const playerData = {
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      dateOfBirth: dateOfBirth || undefined,
      nationality: nationality ? nationality.trim() : undefined,
      position: position || undefined,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      photo: photo || undefined,
      currentTeam: currentTeam ? new mongoose.Types.ObjectId(currentTeam) : undefined,
      status: status || 'active',
      notes: notes ? notes.trim() : undefined,
      idCardNumber: idCardNumber ? idCardNumber.trim() : undefined,
      emergencyContact: emergencyContact && (emergencyContact.name || emergencyContact.phone) ? {
        name: emergencyContact.name ? emergencyContact.name.trim() : undefined,
        phone: emergencyContact.phone ? emergencyContact.phone.trim() : undefined,
        relationship: emergencyContact.relationship ? emergencyContact.relationship.trim() : undefined
      } : undefined,
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
      }
    };

    // Remove undefined fields to avoid schema issues
    Object.keys(playerData).forEach(key => {
      if (playerData[key] === undefined) {
        delete playerData[key];
      }
    });

    console.log('Processed player data for creation:', {
      ...playerData,
      idCardNumber: playerData.idCardNumber ? '***HIDDEN***' : undefined
    });

    const newPlayer = new Player(playerData);
    const savedPlayer = await newPlayer.save();

    // Populate the result for response
    const populatedPlayer = await Player.findById(savedPlayer._id)
      .populate('currentTeam', 'name logo')
      .lean();

    console.log('Player created successfully:', populatedPlayer._id);

    return res.status(201).json({
      message: 'Player created successfully',
      player: populatedPlayer
    });

  } catch (error) {
    console.error('Error creating player:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    if (error.code === 11000) {
      // Handle duplicate key errors
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (error.keyPattern?.idCardNumber) {
        return res.status(400).json({ message: 'Player with this ID card number already exists' });
      }
      if (error.keyPattern?.jerseyNumber) {
        return res.status(400).json({ message: 'Jersey number already taken in this team' });
      }
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }

    throw error;
  }
}

// PUT - Update player
async function updatePlayer(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Player ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    const existingPlayer = await Player.findById(id);
    if (!existingPlayer) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const {
      name,
      idCardNumber,
      email,
      phone,
      dateOfBirth,
      nationality,
      position,
      jerseyNumber,
      height,
      weight,
      photo,
      currentTeam,
      status,
      notes,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check for existing email (excluding current player)
    if (email) {
      const existingEmail = await Player.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Check for existing ID card number (excluding current player)
    if (idCardNumber) {
      const existingIdCard = await Player.findOne({ 
        idCardNumber: idCardNumber.trim(),
        _id: { $ne: id }
      });
      if (existingIdCard) {
        return res.status(400).json({ message: 'Player with this ID card number already exists' });
      }
    }

    // Validate team and jersey number combination
    if (currentTeam && jerseyNumber) {
      const existingJersey = await Player.findOne({
        currentTeam: new mongoose.Types.ObjectId(currentTeam),
        jerseyNumber: parseInt(jerseyNumber),
        status: { $in: ['active', 'injured', 'suspended'] },
        _id: { $ne: id }
      });

      if (existingJersey) {
        return res.status(400).json({ 
          message: `Jersey number ${jerseyNumber} is already taken in this team` 
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: phone ? phone.trim() : null,
      dateOfBirth: dateOfBirth || null,
      nationality: nationality ? nationality.trim() : null,
      position: position || null,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      photo: photo || existingPlayer.photo, // Keep existing photo if none provided
      currentTeam: currentTeam ? new mongoose.Types.ObjectId(currentTeam) : null,
      status: status || 'active',
      notes: notes ? notes.trim() : null,
      idCardNumber: idCardNumber ? idCardNumber.trim() : null,
      emergencyContact: emergencyContact && (emergencyContact.name || emergencyContact.phone) ? {
        name: emergencyContact.name ? emergencyContact.name.trim() : null,
        phone: emergencyContact.phone ? emergencyContact.phone.trim() : null,
        relationship: emergencyContact.relationship ? emergencyContact.relationship.trim() : null
      } : null,
      updatedAt: new Date()
    };

    const updatedPlayer = await Player.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('currentTeam', 'name logo');

    console.log('Player updated successfully:', updatedPlayer._id);

    return res.status(200).json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating player:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    if (error.code === 11000) {
      // Handle duplicate key errors
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (error.keyPattern?.idCardNumber) {
        return res.status(400).json({ message: 'Player with this ID card number already exists' });
      }
      if (error.keyPattern?.jerseyNumber) {
        return res.status(400).json({ message: 'Jersey number already taken in this team' });
      }
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }

    throw error;
  }
}

// DELETE - Delete player
async function deletePlayer(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Player ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    await Player.findByIdAndDelete(id);

    console.log('Player deleted successfully:', id);

    return res.status(200).json({
      message: 'Player deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}
