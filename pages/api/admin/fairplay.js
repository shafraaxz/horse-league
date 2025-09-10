// ===========================================
// FILE: pages/api/admin/fairplay.js (ENHANCED WITH OFFICIAL SUPPORT)
// ===========================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import FairPlayRecord from '../../../models/FairPlayRecord';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  try {
    await dbConnect();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        return await getFairPlayRecords(req, res);
      case 'POST':
        return await createFairPlayRecord(req, res, session);
      case 'PUT':
        return await updateFairPlayRecord(req, res);
      case 'DELETE':
        return await deleteFairPlayRecord(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Fair Play API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

// GET - Fetch fair play records with enhanced filtering
async function getFairPlayRecords(req, res) {
  try {
    const { season, team, status = 'all', subjectType = 'all' } = req.query;
    
    const filter = {};
    
    if (season) {
      filter.season = season;
    }
    
    if (team) {
      filter.team = team;
    }
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Enhanced subject type filtering
    if (subjectType !== 'all') {
      switch (subjectType) {
        case 'player':
          filter.isOfficial = false;
          filter.player = { $ne: null };
          break;
        case 'official':
          filter.isOfficial = true;
          break;
        case 'team':
          filter.isOfficial = false;
          filter.player = null;
          break;
      }
    }

    const records = await FairPlayRecord.find(filter)
      .populate('team', 'name logo')
      .populate('player', 'name jerseyNumber position')
      .populate('season', 'name isActive')
      .populate('addedBy', 'name')
      .sort({ actionDate: -1, createdAt: -1 });

    // Enhanced statistics
    const stats = {
      total: records.length,
      byStatus: {
        active: records.filter(r => r.status === 'active').length,
        appealed: records.filter(r => r.status === 'appealed').length,
        overturned: records.filter(r => r.status === 'overturned').length,
        reduced: records.filter(r => r.status === 'reduced').length
      },
      bySubject: {
        players: records.filter(r => !r.isOfficial && r.player).length,
        officials: records.filter(r => r.isOfficial).length,
        teams: records.filter(r => !r.isOfficial && !r.player).length
      },
      totalActivePoints: records
        .filter(r => r.status === 'active')
        .reduce((sum, r) => sum + r.points, 0)
    };

    return res.status(200).json({
      records,
      stats
    });

  } catch (error) {
    console.error('Error fetching fair play records:', error);
    throw error;
  }
}

// POST - Create new fair play record with enhanced validation
async function createFairPlayRecord(req, res, session) {
  try {
    const {
      team,
      player,
      customName,
      isOfficial,
      season,
      actionType,
      points,
      description,
      actionDate,
      reference
    } = req.body;

    // Enhanced validation
    if (!team || !season || !actionType || !points || !description || !actionDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: team, season, actionType, points, description, and actionDate are required' 
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(team) || !mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({ message: 'Invalid team or season ID' });
    }

    if (player && !mongoose.Types.ObjectId.isValid(player)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }

    // Enhanced subject validation
    if (isOfficial && !customName?.trim()) {
      return res.status(400).json({ 
        message: 'Custom name is required for official misconduct' 
      });
    }

    if (!isOfficial && !player && !customName?.trim()) {
      return res.status(400).json({ 
        message: 'Either player or custom name must be provided for non-official misconduct' 
      });
    }

    // Points validation
    if (points < 1 || points > 100) {
      return res.status(400).json({ 
        message: 'Points must be between 1 and 100' 
      });
    }

    // Create record
    const recordData = {
      team: new mongoose.Types.ObjectId(team),
      season: new mongoose.Types.ObjectId(season),
      actionType,
      points: parseInt(points),
      description: description.trim(),
      actionDate: new Date(actionDate),
      addedBy: new mongoose.Types.ObjectId(session.user.id),
      isOfficial: Boolean(isOfficial)
    };

    // Add optional fields based on subject type
    if (isOfficial) {
      recordData.customName = customName.trim();
      recordData.player = null;
    } else if (player) {
      recordData.player = new mongoose.Types.ObjectId(player);
      recordData.customName = null;
    } else {
      // Team penalty
      recordData.customName = customName?.trim() || null;
      recordData.player = null;
    }

    if (reference?.trim()) {
      recordData.reference = reference.trim();
    }

    const newRecord = new FairPlayRecord(recordData);
    await newRecord.save();

    // Populate for response
    const populatedRecord = await FairPlayRecord.findById(newRecord._id)
      .populate('team', 'name logo')
      .populate('player', 'name jerseyNumber')
      .populate('season', 'name')
      .populate('addedBy', 'name');

    console.log('Fair play record created:', {
      id: populatedRecord._id,
      team: populatedRecord.team.name,
      subject: populatedRecord.isOfficial ? 
        `Official: ${populatedRecord.customName}` : 
        populatedRecord.player ? 
          `Player: ${populatedRecord.player.name}` : 
          'Team penalty',
      points: populatedRecord.points
    });

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
async function updateFairPlayRecord(req, res) {
  try {
    const { id } = req.query;
    const {
      team,
      player,
      customName,
      isOfficial,
      season,
      actionType,
      points,
      description,
      actionDate,
      reference,
      status,
      appealNotes
    } = req.body;

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

    // Prepare update data
    const updateData = {};

    // Basic fields
    if (team) updateData.team = new mongoose.Types.ObjectId(team);
    if (season) updateData.season = new mongoose.Types.ObjectId(season);
    if (actionType) updateData.actionType = actionType;
    if (description) updateData.description = description.trim();
    if (actionDate) updateData.actionDate = new Date(actionDate);
    if (reference !== undefined) updateData.reference = reference?.trim() || null;

    // Enhanced subject handling
    if (isOfficial !== undefined) {
      updateData.isOfficial = Boolean(isOfficial);
      
      if (isOfficial) {
        if (!customName?.trim()) {
          return res.status(400).json({ 
            message: 'Custom name is required for official misconduct' 
          });
        }
        updateData.customName = customName.trim();
        updateData.player = null;
      } else {
        updateData.customName = customName?.trim() || null;
        if (player) {
          updateData.player = new mongoose.Types.ObjectId(player);
        }
      }
    }

    // Points with appeal handling
    if (points !== undefined) {
      const newPoints = parseInt(points);
      if (newPoints < 1 || newPoints > 100) {
        return res.status(400).json({ 
          message: 'Points must be between 1 and 100' 
        });
      }
      
      // Store original points if reducing for first time
      if (newPoints < existingRecord.points && !existingRecord.originalPoints) {
        updateData.originalPoints = existingRecord.points;
      }
      
      updateData.points = newPoints;
    }

    // Status handling
    if (status) {
      updateData.status = status;
      
      if (status === 'appealed' && !existingRecord.appealDate) {
        updateData.appealDate = new Date();
      }
    }

    // Appeal notes
    if (appealNotes !== undefined) {
      updateData.appealNotes = appealNotes?.trim() || null;
    }

    const updatedRecord = await FairPlayRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('team', 'name logo')
     .populate('player', 'name jerseyNumber')
     .populate('season', 'name')
     .populate('addedBy', 'name');

    console.log('Fair play record updated:', {
      id: updatedRecord._id,
      changes: Object.keys(updateData)
    });

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

    console.log('Fair play record deleted:', {
      id,
      subject: record.isOfficial ? 
        `Official: ${record.customName}` : 
        record.player ? 
          `Player: ${record.player}` : 
          'Team penalty'
    });

    return res.status(200).json({
      message: 'Fair play record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting fair play record:', error);
    throw error;
  }
}
