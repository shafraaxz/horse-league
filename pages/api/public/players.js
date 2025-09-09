// ===========================================
// FILE: pages/api/public/players.js (UPDATED - ID Card Search Support)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { 
      seasonId, 
      teamId, 
      position, 
      contractStatus, 
      search, // NEW: Search parameter
      limit = 50 
    } = req.query;

    let query = {};
    
    // Season-based filtering
    if (seasonId && seasonId !== 'all') {
      const teams = await Team.find({ season: seasonId }).select('_id');
      const teamIds = teams.map(team => team._id);
      
      if (teamIds.length > 0) {
        query.$or = [
          { currentTeam: { $in: teamIds } },
          { currentTeam: null } // Include free agents
        ];
      } else {
        query.currentTeam = null;
      }
    }
    
    // Team filtering
    if (teamId && teamId !== 'all') {
      if (teamId === 'free-agents') {
        query.currentTeam = null;
        if (query.$or) delete query.$or;
      } else if (mongoose.Types.ObjectId.isValid(teamId)) {
        query.currentTeam = new mongoose.Types.ObjectId(teamId);
        if (query.$or) delete query.$or;
      }
    }
    
    // Position filtering
    if (position && position !== 'all') {
      query.position = position;
    }
    
    // Contract status filtering
    if (contractStatus && contractStatus !== 'all') {
      query.contractStatus = contractStatus;
      if (query.$or) delete query.$or;
    }
    
    // NEW: Search functionality (name, ID card, email)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      // If query already has $or, we need to combine it with search
      if (query.$or) {
        // Store the existing $or condition
        const existingOr = query.$or;
        delete query.$or;
        
        // Create a new compound query
        query.$and = [
          { $or: existingOr }, // Existing season/team conditions
          { 
            $or: [ // Search conditions
              { name: searchRegex },
              { idCardNumber: searchRegex },
              { email: searchRegex }
            ]
          }
        ];
      } else {
        // Simple search without existing $or
        query.$or = [
          { name: searchRegex },
          { idCardNumber: searchRegex },
          { email: searchRegex }
        ];
      }
    }
    
    // Only show active players to public
    query.status = { $in: ['active', 'injured'] };

    console.log('Public players query:', JSON.stringify(query, null, 2));

    const players = await Player.find(query)
      .populate('currentTeam', 'name logo season')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive startDate endDate')
      .select('-email -phone -emergencyContact -medicalInfo -notes -transferHistory -contractHistory') // Hide private data
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    // Process players for public consumption
    const publicPlayers = players.map(player => ({
      _id: player._id,
      name: player.name,
      idCardNumber: player.idCardNumber, // NOW VISIBLE for verification purposes
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      height: player.height,
      weight: player.weight,
      photo: player.photo,
      currentTeam: player.currentTeam,
      status: player.status,
      
      // Contract information
      contractStatus: player.contractStatus || 'free_agent',
      currentContract: player.currentContract ? {
        team: player.currentContract.team,
        season: player.currentContract.season,
        contractType: player.currentContract.contractType,
        contractValue: player.currentContract.contractValue, // Public for transparency
        startDate: player.currentContract.startDate,
        endDate: player.currentContract.endDate
      } : null,
      
      // Statistics
      careerStats: player.careerStats || {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      },
      seasonStats: player.seasonStats ? Object.fromEntries(player.seasonStats) : {},
      
      // Computed fields
      age: player.age,
      isTransferEligible: player.isTransferEligible,
      
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    }));

    console.log(`Public API returned ${publicPlayers.length} players`);

    return res.status(200).json(publicPlayers);

  } catch (error) {
    console.error('Error fetching public players:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch players',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
