// ===========================================
// FILE: pages/api/public/players.js (FIXED - Handles players without ID cards)
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
      search,
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
    
    // PRIVACY PROTECTION: Public search ONLY by name
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      if (query.$or) {
        const existingOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: existingOr },
          { name: searchRegex }
        ];
      } else {
        query.name = searchRegex;
      }
    }
    
    // Only show active players to public
    query.status = { $in: ['active', 'injured'] };

    console.log('Public players query:', JSON.stringify(query, null, 2));

    // FIXED: Don't exclude fields in the query, just don't send them in response
    const players = await Player.find(query)
      .populate('currentTeam', 'name logo season')
      .populate('currentContract.team', 'name logo')
      .populate('currentContract.season', 'name isActive startDate endDate')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`Found ${players.length} players before processing`);

    // Process players and REMOVE private data in the response (not the query)
    const publicPlayers = players.map(player => ({
      _id: player._id,
      name: player.name,
      // ID card is intentionally excluded from public response
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
        contractValue: player.currentContract.contractValue,
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

    console.log(`Public API returned ${publicPlayers.length} players (private data excluded from response)`);

    return res.status(200).json(publicPlayers);

  } catch (error) {
    console.error('Error fetching public players:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch players',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
