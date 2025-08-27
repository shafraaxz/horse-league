import connectDB from '../../../lib/db';
import Team from '../../../models/Team';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  await connectDB();
  
  const { id } = req.query;
  const { method } = req;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid team ID format'
    });
  }

  try {
    if (method === 'GET') {
      return await getTeam(req, res, id);
    } else if (method === 'PUT') {
      return await updateTeam(req, res, id);
    } else if (method === 'DELETE') {
      return await deleteTeam(req, res, id);
    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${method} not allowed`
      });
    }
  } catch (error) {
    console.error('Team API Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

async function getTeam(req, res, id) {
  try {
    const team = await Team.findById(id)
      .populate('league', 'name')
      .populate('captain', 'name position')
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const players = await Player.find({ 
      $or: [
        { team: id },
        { currentTeam: id }
      ]
    }).populate('league', 'name').lean();

    const enrichedTeam = {
      ...team,
      players,
      playerCount: players.length
    };

    console.log('Team retrieved:', team.name);
    return res.status(200).json({
      success: true,
      data: enrichedTeam
    });
  } catch (error) {
    throw error;
  }
}

async function updateTeam(req, res, id) {
  try {
    const updateData = req.body;
    
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('league', 'name')
     .populate('captain', 'name position');

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    console.log('Team updated:', updatedTeam.name);
    return res.status(200).json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
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

async function deleteTeam(req, res, id) {
  try {
    const team = await Team.findById(id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const playerCount = await Player.countDocuments({
      $or: [
        { team: id },
        { currentTeam: id }
      ]
    });

    if (playerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete team with ${playerCount} players. Please transfer players first.`
      });
    }

    await Team.findByIdAndDelete(id);
    
    console.log('Team deleted:', team.name);
    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}