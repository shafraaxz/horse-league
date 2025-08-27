// pages/api/leagues/[id].js - League CRUD Operations
import connectDB from '../../../lib/db';
import League from '../../../models/League';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  await connectDB();
  
  const { id } = req.query;
  const { method } = req;

  // Validate MongoDB ObjectId format
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid league ID format'
    });
  }

  try {
    switch (method) {
      case 'GET':
        return await getLeague(req, res, id);
      case 'PUT':
        return await updateLeague(req, res, id);
      case 'DELETE':
        return await deleteLeague(req, res, id);
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error(`❌ League API Error (${method} ${id}):`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Get single league with populated data
async function getLeague(req, res, id) {
  try {
    const league = await League.findById(id)
      .populate('teams')
      .populate('createdBy', 'name email')
      .lean();

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Get additional statistics
    const [teamCount, playerCount, matchCount] = await Promise.all([
      Team.countDocuments({ league: id }),
      Player.countDocuments({ league: id }),
      Match.countDocuments({ league: id })
    ]);

    const enrichedLeague = {
      ...league,
      teamCount,
      playerCount,
      matchCount
    };

    console.log('✅ League retrieved:', league.name);
    return res.status(200).json({
      success: true,
      data: enrichedLeague
    });
  } catch (error) {
    throw error;
  }
}

// Update league
async function updateLeague(req, res, id) {
  try {
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Validate required fields
    if (updateData.name && updateData.name.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'League name must be at least 3 characters'
      });
    }

    // Validate date logic
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.startDate) >= new Date(updateData.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    const updatedLeague = await League.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { 
        new: true, 
        runValidators: true,
        lean: true
      }
    );

    if (!updatedLeague) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    console.log('✅ League updated:', updatedLeague.name);
    return res.status(200).json({
      success: true,
      data: updatedLeague,
      message: 'League updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    throw error;
  }
}

// Delete league
async function deleteLeague(req, res, id) {
  try {
    const league = await League.findById(id);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Check if league has associated data
    const [teamCount, matchCount] = await Promise.all([
      Team.countDocuments({ league: id }),
      Match.countDocuments({ league: id })
    ]);

    if (teamCount > 0 || matchCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete league with ${teamCount} teams and ${matchCount} matches. Please remove all associated data first.`
      });
    }

    await League.findByIdAndDelete(id);
    
    console.log('✅ League deleted:', league.name);
    return res.status(200).json({
      success: true,
      message: 'League deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}