// ===========================================
// FILE: pages/api/admin/players.js (FIXED IMPORTS)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
// Try different import patterns for your database connection
import dbConnect from '../../../lib/mongodb'; // Most common pattern
// Alternative patterns if the above doesn't work:
// import { connectToDatabase } from '../../../lib/mongodb';
// import clientPromise from '../../../lib/mongodb';

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

    // Try the most common database connection pattern
    await dbConnect();
    // Alternative if using different pattern:
    // await connectToDatabase();

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

// POST - Create new player with minimal requirements
async function createPlayer(req, res) {
  try {
    console.log('Creating player with data:', {
      ...req.body,
      idCardNumber: req.body.idCardNumber ? '***HIDDEN***' : undefined
    });

    const { name } = req.body;

    // Only require name for now
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Create minimal player data
    const playerData = {
      name: name.trim(),
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

    // Add optional fields only if they exist and are valid
    if (req.body.email && req.body.email.trim()) {
      playerData.email = req.body.email.toLowerCase().trim();
    }
    
    if (req.body.phone && req.body.phone.trim()) {
      playerData.phone = req.body.phone.trim();
    }
    
    if (req.body.dateOfBirth) {
      playerData.dateOfBirth = req.body.dateOfBirth;
    }
    
    if (req.body.nationality && req.body.nationality.trim()) {
      playerData.nationality = req.body.nationality.trim();
    }
    
    if (req.body.position) {
      playerData.position = req.body.position;
    }
    
    if (req.body.jerseyNumber && !isNaN(req.body.jerseyNumber)) {
      playerData.jerseyNumber = parseInt(req.body.jerseyNumber);
    }
    
    if (req.body.currentTeam && mongoose.Types.ObjectId.isValid(req.body.currentTeam)) {
      playerData.currentTeam = new mongoose.Types.ObjectId(req.body.currentTeam);
    }
    
    if (req.body.photo) {
      playerData.photo = req.body.photo;
    }
    
    if (req.body.status) {
      playerData.status = req.body.status;
    }
    
    if (req.body.idCardNumber && req.body.idCardNumber.trim()) {
      playerData.idCardNumber = req.body.idCardNumber.trim();
    }

    console.log('Final player data for creation:', {
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

    const { name } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Player name is required' });
    }

    // Prepare update data with only changed fields
    const updateData = {
      name: name.trim(),
      updatedAt: new Date()
    };

    // Add optional fields only if provided
    Object.keys(req.body).forEach(key => {
      if (key !== 'id' && key !== 'name' && req.body[key] !== undefined && req.body[key] !== '') {
        if (key === 'currentTeam' && mongoose.Types.ObjectId.isValid(req.body[key])) {
          updateData[key] = new mongoose.Types.ObjectId(req.body[key]);
        } else if (key === 'jerseyNumber') {
          updateData[key] = req.body[key] ? parseInt(req.body[key]) : null;
        } else if (key === 'email') {
          updateData[key] = req.body[key] ? req.body[key].toLowerCase().trim() : null;
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

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
