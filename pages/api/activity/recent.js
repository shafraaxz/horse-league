// pages/api/activity/recent.js - Recent Activity API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import League from '../../../models/League';
import Transfer from '../../../models/Transfer';

export default async function handler(req, res) {
  const { method } = req;

  console.log(`📊 Activity API: ${method} /api/activity/recent`);

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }

  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    const { 
      limit = 20,
      days = 7,
      type = 'all' // 'all', 'players', 'teams', 'leagues', 'transfers'
    } = req.query;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    console.log(`📊 Fetching recent activity from ${fromDate.toISOString()}`);

    const activities = [];

    // Get recent player registrations
    if (type === 'all' || type === 'players') {
      try {
        const recentPlayers = await Player.find({
          isActive: true,
          createdAt: { $gte: fromDate }
        })
        .populate('league', 'name')
        .populate('team', 'name')
        .populate('currentTeam', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

        recentPlayers.forEach(player => {
          activities.push({
            id: `player_${player._id}`,
            type: 'player_registered',
            title: 'New Player Registered',
            description: `${player.name} registered as ${player.position}`,
            details: {
              playerName: player.name,
              position: player.position,
              league: player.league?.name,
              team: player.currentTeam?.name || player.team?.name,
              nationality: player.nationality
            },
            timestamp: player.createdAt,
            icon: 'user-plus',
            color: 'green'
          });
        });
      } catch (error) {
        console.warn('Error fetching recent players:', error);
      }
    }

    // Get recent team creations
    if (type === 'all' || type === 'teams') {
      try {
        const recentTeams = await Team.find({
          isActive: true,
          createdAt: { $gte: fromDate }
        })
        .populate('league', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

        recentTeams.forEach(team => {
          activities.push({
            id: `team_${team._id}`,
            type: 'team_created',
            title: 'New Team Created',
            description: `${team.name} joined the league`,
            details: {
              teamName: team.name,
              league: team.league?.name,
              shortName: team.shortName,
              homeVenue: team.homeVenue
            },
            timestamp: team.createdAt,
            icon: 'users',
            color: 'blue'
          });
        });
      } catch (error) {
        console.warn('Error fetching recent teams:', error);
      }
    }

    // Get recent league creations
    if (type === 'all' || type === 'leagues') {
      try {
        const recentLeagues = await League.find({
          isActive: true,
          createdAt: { $gte: fromDate }
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

        recentLeagues.forEach(league => {
          activities.push({
            id: `league_${league._id}`,
            type: 'league_created',
            title: 'New League Created',
            description: `${league.name} league was established`,
            details: {
              leagueName: league.name,
              type: league.type,
              sport: league.sport,
              season: league.season
            },
            timestamp: league.createdAt,
            icon: 'trophy',
            color: 'purple'
          });
        });
      } catch (error) {
        console.warn('Error fetching recent leagues:', error);
      }
    }

    // Get recent transfers
    if (type === 'all' || type === 'transfers') {
      try {
        const recentTransfers = await Transfer.find({
          transferDate: { $gte: fromDate },
          status: 'completed'
        })
        .populate('player', 'name position')
        .populate('fromTeam', 'name')
        .populate('toTeam', 'name')
        .populate('league', 'name')
        .sort({ transferDate: -1 })
        .limit(parseInt(limit))
        .lean();

        recentTransfers.forEach(transfer => {
          let description;
          if (!transfer.fromTeam && transfer.toTeam) {
            description = `${transfer.player?.name} assigned to ${transfer.toTeam?.name}`;
          } else if (transfer.fromTeam && !transfer.toTeam) {
            description = `${transfer.player?.name} released from ${transfer.fromTeam?.name}`;
          } else if (transfer.fromTeam && transfer.toTeam) {
            description = `${transfer.player?.name} transferred from ${transfer.fromTeam?.name} to ${transfer.toTeam?.name}`;
          } else {
            description = `${transfer.player?.name} transfer processed`;
          }

          activities.push({
            id: `transfer_${transfer._id}`,
            type: 'player_transfer',
            title: 'Player Transfer',
            description,
            details: {
              playerName: transfer.player?.name,
              position: transfer.player?.position,
              fromTeam: transfer.fromTeam?.name,
              toTeam: transfer.toTeam?.name,
              league: transfer.league?.name,
              transferType: transfer.transferType,
              transferFee: transfer.transferFee
            },
            timestamp: transfer.transferDate,
            icon: 'arrow-right-left',
            color: 'orange'
          });
        });
      } catch (error) {
        console.warn('Error fetching recent transfers:', error);
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit the final results
    const limitedActivities = activities.slice(0, parseInt(limit));

    console.log(`✅ Found ${limitedActivities.length} recent activities`);

    return res.status(200).json({
      success: true,
      count: limitedActivities.length,
      data: limitedActivities,
      activities: limitedActivities, // backward compatibility
      filters: {
        limit: parseInt(limit),
        days: parseInt(days),
        type,
        fromDate: fromDate.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
}