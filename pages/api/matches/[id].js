// pages/api/matches/[id].js - Get, update, and delete specific match
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import League from '../../../models/League';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Match ID is required' 
    });
  }

  await dbConnect();

  try {
    switch (req.method) {
      case 'GET':
        // Get single match
        const match = await Match.findById(id)
          .populate('homeTeam', 'name shortName logo primaryColor')
          .populate('awayTeam', 'name shortName logo primaryColor')
          .populate('league', 'name type sport')
          .lean();

        if (!match) {
          return res.status(404).json({
            success: false,
            message: 'Match not found'
          });
        }

        res.status(200).json({
          success: true,
          data: match
        });
        break;

      case 'PUT':
        // Update match
        const updateData = req.body;
        
        // Validate required fields for update
        if (updateData.homeTeam && updateData.awayTeam && updateData.homeTeam === updateData.awayTeam) {
          return res.status(400).json({
            success: false,
            message: 'Home team and away team cannot be the same'
          });
        }

        // Check if teams exist if they're being updated
        if (updateData.homeTeam) {
          const homeTeam = await Team.findById(updateData.homeTeam);
          if (!homeTeam) {
            return res.status(400).json({
              success: false,
              message: 'Home team not found'
            });
          }
        }

        if (updateData.awayTeam) {
          const awayTeam = await Team.findById(updateData.awayTeam);
          if (!awayTeam) {
            return res.status(400).json({
              success: false,
              message: 'Away team not found'
            });
          }
        }

        // Check if league exists if it's being updated
        if (updateData.league) {
          const league = await League.findById(updateData.league);
          if (!league) {
            return res.status(400).json({
              success: false,
              message: 'League not found'
            });
          }
        }

        // Validate match date if provided
        if (updateData.matchDate) {
          const matchDate = new Date(updateData.matchDate);
          if (isNaN(matchDate.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Invalid match date'
            });
          }
        }

        const updatedMatch = await Match.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        ).populate([
          { path: 'homeTeam', select: 'name shortName logo primaryColor' },
          { path: 'awayTeam', select: 'name shortName logo primaryColor' },
          { path: 'league', select: 'name type sport' }
        ]);

        if (!updatedMatch) {
          return res.status(404).json({
            success: false,
            message: 'Match not found'
          });
        }

        res.status(200).json({
          success: true,
          data: updatedMatch,
          message: 'Match updated successfully'
        });
        break;

      case 'DELETE':
        // Delete match
        const matchToDelete = await Match.findById(id);

        if (!matchToDelete) {
          return res.status(404).json({
            success: false,
            message: 'Match not found'
          });
        }

        // Check if match can be deleted (only scheduled matches)
        if (matchToDelete.status === 'live') {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete a live match. End the match first.'
          });
        }

        if (matchToDelete.status === 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete a completed match. Historical data must be preserved.'
          });
        }

        await Match.findByIdAndDelete(id);

        res.status(200).json({
          success: true,
          message: 'Match deleted successfully'
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Match API error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}