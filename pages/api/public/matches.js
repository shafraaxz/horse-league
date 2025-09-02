// ===========================================
// FILE: pages/api/public/matches.js (FIXED - Better Error Handling)
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

  try {
    await dbConnect();

    const { status, limit, seasonId, teamId, live } = req.query;
    
    console.log('Public matches API called with:', { status, limit, seasonId, teamId, live });
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by season
    if (seasonId && seasonId !== 'all') {
      query.season = seasonId;
    }
    
    // Filter by team (for team profiles)
    if (teamId && teamId !== 'all') {
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
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
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
    if (limit && !isNaN(parseInt(limit))) {
      matchQuery = matchQuery.limit(parseInt(limit));
    }
    
    const matches = await matchQuery.lean();
    
    console.log(`Found ${matches?.length || 0} matches`);
    
    // Ensure we always have an array
    if (!Array.isArray(matches)) {
      console.error('Matches is not an array:', typeof matches, matches);
      return res.status(200).json([]); // Return empty array instead of error
    }
    
    // Normalize logo data for consistent frontend display
    const normalizedMatches = matches.map(match => {
      try {
        return {
          ...match,
          homeTeam: {
            ...match.homeTeam,
            logo: normalizeLogoData(match.homeTeam?.logo)
          },
          awayTeam: {
            ...match.awayTeam,
            logo: normalizeLogoData(match.awayTeam?.logo)
          },
          // Ensure liveData exists with defaults
          liveData: match.liveData || {
            currentMinute: 0,
            isLive: false,
            lastUpdate: match.updatedAt || match.createdAt
          },
          // Ensure events array exists
          events: Array.isArray(match.events) ? match.events : []
        };
      } catch (matchError) {
        console.error('Error processing match:', match._id, matchError);
        return match; // Return original match if processing fails
      }
    });
    
    console.log(`Returning ${normalizedMatches.length} normalized matches`);
    
    res.status(200).json(normalizedMatches);
    
  } catch (error) {
    console.error('Public matches API error:', error);
    console.error('Error stack:', error.stack);
    
    // ALWAYS return an empty array on error to prevent frontend crashes
    res.status(200).json([]);
  }
}

// Helper function to normalize logo data
function normalizeLogoData(logo) {
  if (!logo) return null;
  
  try {
    // If it's already a string URL, return as is
    if (typeof logo === 'string') {
      return logo;
    }
    
    // If it's a Cloudinary object, extract the URL
    if (typeof logo === 'object') {
      return logo.secure_url || logo.url || null;
    }
    
    return null;
  } catch (logoError) {
    console.error('Logo normalization error:', logoError);
    return null;
  }
}
