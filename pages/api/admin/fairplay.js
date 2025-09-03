// ===========================================
// FILE: pages/api/admin/fairplay.js (CLEAN VERSION)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import FairPlayRecord from '../../../models/FairPlayRecord';
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
        return await getFairPlayRecords(req, res, session);
      case 'POST':
        return await createFairPlayRecord(req, res, session);
      case 'PUT':
        return await updateFairPlayRecord(req, res, session);
      case 'DELETE':
        return await deleteFairPlayRecord(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Fair Play API Error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// GET - Fetch fair play records with filters
async function getFairPlayRecords(req, res, session) {
  try {
    const { seasonId, teamId, status, playerId, limit = 100 } = req.query;
    
    let query = {};
    
    // Add filters
    if (seasonId && mongoose.Types.ObjectId.isValid(seasonId)) {
      query.season = new mongoose.Types.ObjectId(seasonId);
    }
    
    if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
      query.team = new mongoose.Types.ObjectId(teamId);
    }
    
    if (playerId && mongoose.Types.ObjectId.isValid(playerId)) {
      query.player = new mongoose.Types.ObjectId(playerId);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const records = await FairPlayRecord.find(query)
      .populate('team', 'name logo')
      .populate('player', 'name jerseyNumber photo')
      .populate('season', 'name')
      .populate('addedBy', 'name')
      .sort({ actionDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`Fetched ${records.length} fair play records`);
    
    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching fair play records:', error);
    throw error;
  }
}

// POST - Create new fair play record
async function createFairPlayRecord(req, res, session) {
  try {
    const {
      team,
      player,
      season,
      actionType,
      points,
      description,
      actionDate,
      reference
    } = req.body;

    // Validate required fields
    if (!team || !season || !actionType || !points || !description) {
      return res.status(400).json({ 
        message: 'Team, season, action type, points, and description are required' 
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(team) || 
        !mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({ message: 'Invalid team or season ID' });
    }

    if (player && !mongoose.Types.ObjectId.isValid(player)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    // Validate team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Validate season exists
    const seasonExists = await Season.findById(season);
    if (!seasonExists) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Validate player exists and belongs to team (if specified)
    if (player) {
      const playerExists = await Player.findById(player);
      if (!playerExists) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      if (playerExists.currentTeam?.toString() !== team) {
        return res.status(400).json({ 
          message: 'Player does not belong to the specified team' 
        });
      }
    }

    // Validate points
    if (points < 1 || points > 100) {
      return res.status(400).json({ message: 'Points must be between 1 and 100' });
    }

    // Create fair play record
    const recordData = {
      team: new mongoose.Types.ObjectId(team),
      season: new mongoose.Types.ObjectId(season),
      actionType,
      points: parseInt(points),
      description: description.trim(),
      actionDate: actionDate || new Date(),
      reference: reference?.trim() || null,
      addedBy: new mongoose.Types.ObjectId(session.user.id),
      status: 'active'
    };

    // Add optional fields
    if (player) {
      recordData.player = new mongoose.Types.ObjectId(player);
    }

    const newRecord = new FairPlayRecord(recordData);
    const savedRecord = await newRecord.save();

    // Populate the result for response
    const populatedRecord = await FairPlayRecord.findById(savedRecord._id)
      .populate('team', 'name logo')
      .populate('player', 'name jerseyNumber')
      .populate('season', 'name')
      .populate('addedBy', 'name')
      .lean();

    console.log('Fair play record created:', populatedRecord._id);

    return res.status(201).json({
      message: 'Fair play record created successfully',
      record: populatedRecord
    });

  } catch (error) {
    console.error('Error creating fair play record:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    throw error;
  }
}

// PUT - Update fair play record
async function updateFairPlayRecord(req, res, session) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Record ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID' });
    }

    const existingRecord = await FairPlayRecord.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: 'Fair play record not found' });
    }

    const {
      team,
      player,
      season,
      actionType,
      points,
      description,
      actionDate,
      reference,
      status,
      appealNotes
    } = req.body;

    // Validate required fields
    if (!team || !season || !actionType || !points || !description) {
      return res.status(400).json({ 
        message: 'Team, season, action type, points, and description are required' 
      });
    }

    // Prepare update data
    const updateData = {
      team: new mongoose.Types.ObjectId(team),
      season: new mongoose.Types.ObjectId(season),
      actionType,
      points: parseInt(points),
      description: description.trim(),
      actionDate: actionDate || existingRecord.actionDate,
      reference: reference?.trim() || null,
      status: status || existingRecord.status
    };

    // Handle status changes
    if (status && status !== existingRecord.status) {
      if (status === 'reduced' && !existingRecord.originalPoints) {
        updateData.originalPoints = existingRecord.points;
      }
      
      if (status === 'appealed' && !existingRecord.appealDate) {
        updateData.appealDate = new Date();
      }
    }

    // Add optional fields
    if (player) {
      updateData.player = new mongoose.Types.ObjectId(player);
    } else {
      updateData.player = null;
    }

    if (appealNotes) {
      updateData.appealNotes = appealNotes.trim();
    }

    const updatedRecord = await FairPlayRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('team', 'name logo')
     .populate('player', 'name jerseyNumber')
     .populate('season', 'name')
     .populate('addedBy', 'name');

    console.log('Fair play record updated:', updatedRecord._id);

    return res.status(200).json({
      message: 'Fair play record updated successfully',
      record: updatedRecord
    });

  } catch (error) {
    console.error('Error updating fair play record:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    throw error;
  }
}

// DELETE - Delete fair play record
async function deleteFairPlayRecord(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Record ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID' });
    }

    const record = await FairPlayRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Fair play record not found' });
    }

    await FairPlayRecord.findByIdAndDelete(id);

    console.log('Fair play record deleted:', id);

    return res.status(200).json({
      message: 'Fair play record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting fair play record:', error);
    throw error;
  }
}
