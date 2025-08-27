// pages/api/teams/[id]/players.js - Get players for a specific team
import dbConnect from '../../../../lib/mongodb';
import Player from '../../../../models/Player';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Team ID is required' 
    });
  }

  await dbConnect();

  try {
    switch (req.method) {
      case 'GET':
        // Verify team exists
        const team = await Team.findById(id);
        if (!team) {
          return res.status(404).json({
            success: false,
            message: 'Team not found'
          });
        }

        // Get all players for this team
        const players = await Player.find({ 
          currentTeam: id,
          isActive: true 
        })
        .select('name position age nationality height weight statistics jerseyNumber dateOfBirth')
        .sort({ jerseyNumber: 1, name: 1 })
        .lean();

        // Calculate age for players if dateOfBirth exists
        const playersWithAge = players.map(player => ({
          ...player,
          age: player.dateOfBirth ? 
            Math.floor((new Date() - new Date(player.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
            null
        }));

        res.status(200).json({
          success: true,
          data: playersWithAge,
          count: playersWithAge.length,
          team: {
            id: team._id,
            name: team.name
          }
        });
        break;

      case 'POST':
        // Add player to team (assign existing player or create new one)
        const { playerId, playerData } = req.body;

        if (playerId) {
          // Assign existing player to team
          const player = await Player.findById(playerId);
          if (!player) {
            return res.status(404).json({
              success: false,
              message: 'Player not found'
            });
          }

          // Check if player is already assigned to another team
          if (player.currentTeam && player.currentTeam.toString() !== id) {
            return res.status(400).json({
              success: false,
              message: 'Player is already assigned to another team'
            });
          }

          player.currentTeam = id;
          await player.save();

          res.status(200).json({
            success: true,
            data: player,
            message: 'Player assigned to team successfully'
          });
        } else if (playerData) {
          // Create new player and assign to team
          const newPlayer = new Player({
            ...playerData,
            currentTeam: id
          });

          await newPlayer.save();

          res.status(201).json({
            success: true,
            data: newPlayer,
            message: 'Player created and assigned to team successfully'
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Either playerId or playerData is required'
          });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Team players API error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}