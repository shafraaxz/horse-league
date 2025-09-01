// ===========================================
// FILE: pages/api/public/matches.js (ENHANCED - Logo Fix + Live Support)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { status, limit, seasonId, teamId, live } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by season
    if (seasonId) {
      query.season = seasonId;
    }
    
    // Filter by team (for team profiles)
    if (teamId) {
      query.$or = [
        { homeTeam: teamId },
        { awayTeam: teamId }
      ];
    }
    
    // Special filter for live matches
    if (live === 'true') {
      query.status = 'live';
      query['liveData.isLive'] = true;
    }
    
    let matchQuery = Match.find(query)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('season', 'name isActive');
    
    // Sort by date - recent first for live/completed, upcoming first for scheduled
    if (status === 'live' || status === 'completed') {
      matchQuery = matchQuery.sort({ matchDate: -1, 'liveData.lastUpdate': -1 });
    } else {
      matchQuery = matchQuery.sort({ matchDate: 1 });
    }
    
    // Apply limit if specified
    if (limit) {
      matchQuery = matchQuery.limit(parseInt(limit));
    }
    
    const matches = await matchQuery.lean();
    
    // Normalize logo data for consistent frontend display
    const normalizedMatches = matches.map(match => ({
      ...match,
      homeTeam: {
        ...match.homeTeam,
        logo: normalizeLogoData(match.homeTeam.logo)
      },
      awayTeam: {
        ...match.awayTeam,
        logo: normalizeLogoData(match.awayTeam.logo)
      },
      // Ensure liveData exists with defaults
      liveData: match.liveData || {
        currentMinute: 0,
        isLive: false,
        lastUpdate: match.updatedAt || match.createdAt
      },
      // Ensure events array exists
      events: match.events || []
    }));
    
    console.log(`Public matches API: Found ${matches.length} matches`);
    console.log(`Query filters:`, { status, limit, seasonId, teamId, live });
    
    res.status(200).json(normalizedMatches);
    
  } catch (error) {
    console.error('Public matches API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch matches', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

// Helper function to normalize logo data
function normalizeLogoData(logo) {
  if (!logo) return null;
  
  // If it's already a string URL, return as is
  if (typeof logo === 'string') {
    return logo;
  }
  
  // If it's a Cloudinary object, extract the URL
  if (typeof logo === 'object') {
    return logo.secure_url || logo.url || null;
  }
  
  return null;
}