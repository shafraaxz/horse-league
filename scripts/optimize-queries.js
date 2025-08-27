// scripts/optimize-queries.js - Query optimization helpers
const mongoose = require('mongoose');

// Optimized query patterns
class OptimizedQueries {
  // Use projection to limit fields
  static async getLeaguesLight() {
    return await League.find(
      { status: 'active' },
      'name type sport status startDate endDate' // Only select needed fields
    ).lean(); // Use lean() for better performance when not modifying
  }
  
  // Use pagination
  static async getTeamsPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [teams, total] = await Promise.all([
      Team.find()
        .skip(skip)
        .limit(limit)
        .sort({ 'statistics.points': -1 })
        .lean(),
      Team.countDocuments()
    ]);
    
    return {
      teams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // Use aggregation for complex queries
  static async getTopScorers(leagueId, limit = 10) {
    return await Player.aggregate([
      {
        $lookup: {
          from: 'teams',
          localField: 'team',
          foreignField: '_id',
          as: 'teamInfo'
        }
      },
      {
        $match: {
          'teamInfo.leagues': mongoose.Types.ObjectId(leagueId)
        }
      },
      {
        $sort: { 'statistics.goals': -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          jerseyNumber: 1,
          'statistics.goals': 1,
          'teamInfo.name': 1
        }
      }
    ]);
  }
  
  // Use caching for frequently accessed data
  static async getCachedStandings(leagueId) {
    const cacheKey = `standings_${leagueId}`;
    
    // Check cache (Redis, Memory, etc.)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // If not cached, fetch and cache
    const standings = await Standing.find({ league: leagueId })
      .populate('team', 'name logo')
      .sort({ points: -1, goalDifference: -1 })
      .lean();
    
    // Cache for 5 minutes
    await cache.set(cacheKey, standings, 300);
    
    return standings;
  }
}
