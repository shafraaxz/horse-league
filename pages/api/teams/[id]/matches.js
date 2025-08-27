// pages/api/teams/[id]/matches.js - Get matches for a specific team
import dbConnect from '../../../../lib/mongodb';
import Match from '../../../../models/Match';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  const { id } = req.query;
  const { status, limit = 20, page = 1 } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Team ID is required' 
    });
  }

  await dbConnect();

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }

    // Verify team exists
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Build query
    const query = {
      $or: [
        { homeTeam: id },
        { awayTeam: id }
      ]
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get matches with pagination
    const matches = await Match.find(query)
      .populate('homeTeam', 'name shortName logo')
      .populate('awayTeam', 'name shortName logo')
      .populate('league', 'name')
      .sort({ matchDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalMatches = await Match.countDocuments(query);
    const totalPages = Math.ceil(totalMatches / limitNum);

    // Calculate team-specific statistics
    const teamStats = {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };

    matches.forEach(match => {
      if (match.status === 'completed') {
        teamStats.played++;
        
        const isHome = match.homeTeam._id.toString() === id;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        teamStats.goalsFor += teamScore;
        teamStats.goalsAgainst += opponentScore;

        if (teamScore > opponentScore) teamStats.wins++;
        else if (teamScore === opponentScore) teamStats.draws++;
        else teamStats.losses++;
      }
    });

    // Add result information to each match
    const matchesWithResults = matches.map(match => {
      const isHome = match.homeTeam._id.toString() === id;
      const opponent = isHome ? match.awayTeam : match.homeTeam;
      
      let result = null;
      if (match.status === 'completed') {
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;
        
        if (teamScore > opponentScore) result = 'W';
        else if (teamScore === opponentScore) result = 'D';
        else result = 'L';
      }

      return {
        ...match,
        isHome,
        opponent,
        result,
        teamScore: isHome ? match.homeScore : match.awayScore,
        opponentScore: isHome ? match.awayScore : match.homeScore
      };
    });

    res.status(200).json({
      success: true,
      data: matchesWithResults,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalMatches,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      statistics: {
        ...teamStats,
        points: teamStats.wins * 3 + teamStats.draws,
        winPercentage: teamStats.played > 0 ? 
          ((teamStats.wins / teamStats.played) * 100).toFixed(1) : 0,
        goalDifference: teamStats.goalsFor - teamStats.goalsAgainst
      },
      team: {
        id: team._id,
        name: team.name
      }
    });

  } catch (error) {
    console.error('Team matches API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}