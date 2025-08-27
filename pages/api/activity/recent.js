// pages/api/activity/recent.js - Recent Activity API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import League from '../../../models/League';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  try {
    const { limit = 10, days = 7 } = req.query;

    // Get main league
    const league = await League.findOne({ 
      $or: [
        { isDefault: true }, 
        { slug: 'the-horse-futsal-league' }
      ],
      isActive: true 
    });

    if (!league) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const activities = [];

    // Get recent player registrations
    const recentPlayers = await Player.find({
      league: league._id,
      isActive: true,
      createdAt: { $gte: fromDate }
    })
    .populate('currentTeam', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    recentPlayers.forEach(player => {
      activities.push({
        id: `player_${player._id}`,
        type: 'player_registered',
        title: 'New Player Registered',
        description: `${player.name} joined as ${player.position}`,
        timeAgo: getTimeAgo(player.createdAt),
        timestamp: player.createdAt
      });
    });

    // Get recent team creations
    const recentTeams = await Team.find({
      league: league._id,
      isActive: true,
      createdAt: { $gte: fromDate }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    recentTeams.forEach(team => {
      activities.push({
        id: `team_${team._id}`,
        type: 'team_created',
        title: 'New Team Added',
        description: `${team.name} joined the league`,
        timeAgo: getTimeAgo(team.createdAt),
        timestamp: team.createdAt
      });
    });

    // Get recent transfers (players with recent transfer history)
    const recentTransfers = await Player.find({
      league: league._id,
      isActive: true,
      'transferHistory.transferDate': { $gte: fromDate }
    })
    .populate('currentTeam', 'name')
    .sort({ 'transferHistory.transferDate': -1 })
    .limit(parseInt(limit))
    .lean();

    recentTransfers.forEach(player => {
      const latestTransfer = player.transferHistory
        .filter(t => new Date(t.transferDate) >= fromDate)
        .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate))[0];

      if (latestTransfer) {
        let description;
        switch (latestTransfer.transferType) {
          case 'new_registration':
            description = 'Registered to the league';
            break;
          case 'transfer':
            description = player.currentTeam ? `Transferred to ${player.currentTeam.name}` : 'Released from team';
            break;
          case 'free_agent_signing':
            description = player.currentTeam ? `Signed by ${player.currentTeam.name}` : 'Became free agent';
            break;
          case 'release':
            description = 'Released to transfer market';
            break;
          default:
            description = 'Transfer activity';
        }

        activities.push({
          id: `transfer_${player._id}_${latestTransfer._id}`,
          type: 'transfer',
          title: 'Player Transfer',
          description: `${player.name}: ${description}`,
          timeAgo: getTimeAgo(latestTransfer.transferDate),
          timestamp: latestTransfer.transferDate
        });
      }
    });

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      data: sortedActivities
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
}

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}