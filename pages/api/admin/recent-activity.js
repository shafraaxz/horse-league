// FILE: pages/api/admin/recent-activity.js (FIXED)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('Fetching recent activity...');

    const activity = [];

    try {
      // Get recent transfers (last 10)
      const recentTransfers = await Transfer.find({})
        .populate('player', 'name')
        .populate('toTeam', 'name')
        .populate('fromTeam', 'name')
        .sort({ transferDate: -1 })
        .limit(10)
        .lean();

      console.log(`Found ${recentTransfers.length} recent transfers`);

      // Add transfer activities
      recentTransfers.forEach(transfer => {
        try {
          let description = '';
          
          if (transfer.player && transfer.toTeam) {
            if (transfer.fromTeam) {
              description = `${transfer.player.name} transferred from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`;
            } else {
              description = `${transfer.player.name} joined ${transfer.toTeam.name}`;
            }
          } else if (transfer.player) {
            description = `${transfer.player.name} - transfer activity`;
          } else {
            description = 'Transfer activity (player details unavailable)';
          }

          activity.push({
            type: 'transfer',
            description,
            timestamp: formatDate(transfer.transferDate || transfer.createdAt),
            date: transfer.transferDate || transfer.createdAt
          });
        } catch (transferError) {
          console.warn('Error processing transfer:', transfer._id, transferError);
          // Skip this transfer if there's an error
        }
      });
    } catch (transferError) {
      console.error('Error fetching transfers:', transferError);
      // Continue with other activities
    }

    try {
      // Get recent matches (last 10)
      const recentMatches = await Match.find({})
        .populate('homeTeam', 'name')
        .populate('awayTeam', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      console.log(`Found ${recentMatches.length} recent matches`);

      // Add match activities
      recentMatches.forEach(match => {
        try {
          let description = '';
          
          if (match.homeTeam && match.awayTeam) {
            if (match.status === 'completed') {
              description = `Match completed: ${match.homeTeam.name} ${match.homeScore || 0}-${match.awayScore || 0} ${match.awayTeam.name}`;
            } else if (match.status === 'live') {
              description = `Live match: ${match.homeTeam.name} vs ${match.awayTeam.name}`;
            } else {
              description = `Match scheduled: ${match.homeTeam.name} vs ${match.awayTeam.name}`;
            }
          } else {
            description = 'Match activity (team details unavailable)';
          }

          activity.push({
            type: 'match',
            description,
            timestamp: formatDate(match.createdAt),
            date: match.createdAt
          });
        } catch (matchError) {
          console.warn('Error processing match:', match._id, matchError);
          // Skip this match if there's an error
        }
      });
    } catch (matchError) {
      console.error('Error fetching matches:', matchError);
      // Continue with other activities
    }

    try {
      // Get recent teams (last 5)
      const recentTeams = await Team.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      console.log(`Found ${recentTeams.length} recent teams`);

      // Add team activities
      recentTeams.forEach(team => {
        try {
          activity.push({
            type: 'team',
            description: `New team registered: ${team.name}`,
            timestamp: formatDate(team.createdAt),
            date: team.createdAt
          });
        } catch (teamError) {
          console.warn('Error processing team:', team._id, teamError);
          // Skip this team if there's an error
        }
      });
    } catch (teamError) {
      console.error('Error fetching teams:', teamError);
      // Continue with other activities
    }

    try {
      // Get recent players (last 5)
      const recentPlayers = await Player.find({})
        .populate('currentTeam', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      console.log(`Found ${recentPlayers.length} recent players`);

      // Add player activities
      recentPlayers.forEach(player => {
        try {
          let description = '';
          
          if (player.currentTeam) {
            description = `New player registered: ${player.name} joined ${player.currentTeam.name}`;
          } else {
            description = `New player registered: ${player.name}`;
          }

          activity.push({
            type: 'player',
            description,
            timestamp: formatDate(player.createdAt),
            date: player.createdAt
          });
        } catch (playerError) {
          console.warn('Error processing player:', player._id, playerError);
          // Skip this player if there's an error
        }
      });
    } catch (playerError) {
      console.error('Error fetching players:', playerError);
      // Continue
    }

    // Sort by date (newest first) and limit to 15 items
    activity.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedActivity = activity.slice(0, 15);

    console.log(`Returning ${limitedActivity.length} activity items`);
    
    res.status(200).json(limitedActivity);
    
  } catch (error) {
    console.error('Recent activity API error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Helper function to format dates safely
function formatDate(date) {
  try {
    if (!date) return 'Unknown date';
    
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    // Simple date formatting without external dependencies
    const options = {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Date formatting error';
  }
}
