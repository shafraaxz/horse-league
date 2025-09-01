// ===========================================
// FILE: pages/api/admin/matches.js (FIXED WITH CORS & AUTH)
// ===========================================
import connectDB from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
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
    await connectDB();
    
    // Get session with better error handling
    const session = await getServerSession(req, res, authOptions);
    console.log('Session check:', { 
      hasSession: !!session, 
      userRole: session?.user?.role,
      userId: session?.user?.id 
    });
    
    if (!session) {
      console.log('No session found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'admin') {
      console.log('User is not admin:', session.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        try {
          const { seasonId, status = 'all', teamId } = req.query;

          let query = {};
          
          if (seasonId && seasonId !== 'all') {
            query.season = new mongoose.Types.ObjectId(seasonId);
          }
          
          if (status !== 'all') {
            query.status = status;
          }
          
          if (teamId) {
            query.$or = [
              { homeTeam: new mongoose.Types.ObjectId(teamId) },
              { awayTeam: new mongoose.Types.ObjectId(teamId) }
            ];
          }

          const matches = await Match.find(query)
            .populate('homeTeam', 'name logo')
            .populate('awayTeam', 'name logo')
            .populate('season', 'name isActive')
            .sort({ matchDate: 1 })
            .lean();

          console.log(`Found ${matches.length} matches`);
          
          // Always return an array, even if empty
          return res.status(200).json(Array.isArray(matches) ? matches : []);
          
        } catch (error) {
          console.error('Error fetching matches:', error);
          return res.status(500).json({ 
            message: 'Failed to fetch matches',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'POST':
        try {
          const matchData = req.body;
          console.log('Creating match:', matchData.homeTeam, 'vs', matchData.awayTeam);

          // Validate required fields
          if (!matchData.homeTeam || !matchData.awayTeam || !matchData.matchDate || !matchData.season) {
            return res.status(400).json({ 
              message: 'Home team, away team, match date, and season are required' 
            });
          }

          // Validate teams are different
          if (matchData.homeTeam === matchData.awayTeam) {
            return res.status(400).json({ 
              message: 'Home and away teams cannot be the same' 
            });
          }

          // Check if teams exist
          const homeTeam = await Team.findById(matchData.homeTeam);
          const awayTeam = await Team.findById(matchData.awayTeam);
          const season = await Season.findById(matchData.season);

          if (!homeTeam || !awayTeam || !season) {
            return res.status(400).json({ 
              message: 'Invalid team or season selected' 
            });
          }

          const match = new Match({
            ...matchData,
            status: matchData.status || 'scheduled'
          });

          await match.save();
          
          const populatedMatch = await Match.findById(match._id)
            .populate('homeTeam', 'name logo')
            .populate('awayTeam', 'name logo')
            .populate('season', 'name isActive')
            .lean();

          console.log('Match created successfully:', match._id);
          return res.status(201).json(populatedMatch);
          
        } catch (error) {
          console.error('Error creating match:', error);
          return res.status(500).json({ 
            message: 'Failed to create match',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'PUT':
        try {
          const { id, ...updateData } = req.body;
          console.log('Updating match:', id);

          if (!id) {
            return res.status(400).json({ message: 'Match ID is required' });
          }

          // Validate teams are different if both provided
          if (updateData.homeTeam && updateData.awayTeam && 
              updateData.homeTeam === updateData.awayTeam) {
            return res.status(400).json({ 
              message: 'Home and away teams cannot be the same' 
            });
          }

          const match = await Match.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
          ).populate('homeTeam', 'name logo')
           .populate('awayTeam', 'name logo')
           .populate('season', 'name isActive')
           .lean();

          if (!match) {
            return res.status(404).json({ message: 'Match not found' });
          }

          console.log('Match updated successfully:', id);
          return res.status(200).json(match);
          
        } catch (error) {
          console.error('Error updating match:', error);
          return res.status(500).json({ 
            message: 'Failed to update match',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      case 'DELETE':
        try {
          const { id } = req.query;
          console.log('Deleting match:', id);

          if (!id) {
            return res.status(400).json({ message: 'Match ID is required' });
          }

          const match = await Match.findByIdAndDelete(id);
          
          if (!match) {
            return res.status(404).json({ message: 'Match not found' });
          }

          console.log('Match deleted successfully:', id);
          return res.status(200).json({ message: 'Match deleted successfully' });
          
        } catch (error) {
          console.error('Error deleting match:', error);
          return res.status(500).json({ 
            message: 'Failed to delete match',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}
