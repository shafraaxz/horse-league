// pages/api/transfers/register-player.js - Player Registration API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import League from '../../../models/League';
import Season from '../../../models/Season';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }
  
  console.log('📝 Player Registration API: POST /api/transfers/register-player');
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify authentication
  let user;
  try {
    user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const {
      name,
      firstName,
      lastName,
      position,
      dateOfBirth,
      nationality,
      email,
      phone,
      height,
      weight,
      preferredFoot,
      photo,
      previousClubs,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!name || !position || !dateOfBirth || !nationality) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, position, dateOfBirth, nationality'
      });
    }

    // Validate position
    const validPositions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Pivot', 'Wing'];
    if (!validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid position'
      });
    }

    // Validate age (must be at least 16)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      return res.status(400).json({
        success: false,
        message: 'Player must be at least 16 years old'
      });
    }

    // Get main league
    const league = await League.findOne({ isDefault: true, isActive: true });
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Get current season
    const currentSeason = await Season.findOne({
      league: league._id,
      status: 'active'
    });

    // Check if player already exists (by name and date of birth)
    const existingPlayer = await Player.findOne({
      $or: [
        { name: name, dateOfBirth: birthDate },
        { email: email }
      ],
      league: league._id,
      isActive: true
    });

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'Player with this name and birth date already exists, or email is already registered'
      });
    }

    // Create new player
    const newPlayer = new Player({
      name: name.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      position,
      dateOfBirth: birthDate,
      nationality: nationality.trim(),
      email: email?.toLowerCase(),
      phone: phone?.trim(),
      height: height ? parseInt(height) : undefined,
      weight: weight ? parseInt(weight) : undefined,
      preferredFoot: preferredFoot || 'Right',
      photo,
      
      // League and season association
      league: league._id,
      currentSeason: currentSeason?._id,
      
      // Registration details
      registrationStatus: 'registered',
      marketStatus: 'available',
      isAvailableForTransfer: true,
      registrationDate: new Date(),
      
      // Emergency contact
      emergencyContact: emergencyContact ? {
        name: emergencyContact.name,
        relationship: emergencyContact.relationship,
        phone: emergencyContact.phone,
        email: emergencyContact.email
      } : undefined,
      
      // Previous experience
      previousClubs: previousClubs || [],
      
      // Administrative
      createdBy: user.id,
      status: 'active',
      isActive: true
    });

    // Register player to league (generates registration number)
    await newPlayer.registerToLeague(league._id, user.id);

    // Return player data without sensitive information
    const playerResponse = {
      _id: newPlayer._id,
      name: newPlayer.name,
      firstName: newPlayer.firstName,
      lastName: newPlayer.lastName,
      position: newPlayer.position,
      age: newPlayer.age,
      nationality: newPlayer.nationality,
      photo: newPlayer.photo,
      registrationNumber: newPlayer.registrationNumber,
      registrationStatus: newPlayer.registrationStatus,
      marketStatus: newPlayer.marketStatus,
      registrationDate: newPlayer.registrationDate
    };

    console.log(`✅ Player registered successfully: ${newPlayer.name} (${newPlayer.registrationNumber})`);

    return res.status(201).json({
      success: true,
      message: 'Player registered successfully to The Horse Futsal League',
      data: playerResponse
    });

  } catch (error) {
    console.error('Error registering player:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register player',
      error: error.message
    });
  }
}

// pages/api/transfers/assign-player.js - Player Team Assignment API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Team from '../../../models/Team';
import Season from '../../../models/Season';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }
  
  console.log('🔄 Player Assignment API: POST /api/transfers/assign-player');
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify authentication
  let user;
  try {
    user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const {
      playerId,
      teamId,
      jerseyNumber,
      transferType = 'assignment',
      notes
    } = req.body;

    // Validate required fields
    if (!playerId || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Player ID and Team ID are required'
      });
    }

    // Find player
    const player = await Player.findOne({
      _id: playerId,
      isActive: true,
      registrationStatus: 'registered'
    }).populate('currentTeam', 'name shortName');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found or not registered'
      });
    }

    // Check if player is available
    if (player.marketStatus !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Player is not available for assignment (current status: ${player.marketStatus})`
      });
    }

    // Find team
    const team = await Team.findOne({
      _id: teamId,
      isActive: true
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Get current season
    const currentSeason = await Season.findOne({
      league: team.league,
      status: 'active'
    });

    if (!currentSeason) {
      return res.status(400).json({
        success: false,
        message: 'No active season found'
      });
    }

    // Check team player limit
    const teamPlayersCount = await Player.countDocuments({
      currentTeam: teamId,
      isActive: true
    });

    if (teamPlayersCount >= currentSeason.maxPlayersPerTeam) {
      return res.status(400).json({
        success: false,
        message: `Team has reached maximum players limit (${currentSeason.maxPlayersPerTeam})`
      });
    }

    // Validate jersey number if provided
    if (jerseyNumber) {
      const existingJersey = await Player.findOne({
        currentTeam: teamId,
        jerseyNumber: jerseyNumber,
        isActive: true,
        _id: { $ne: playerId }
      });

      if (existingJersey) {
        return res.status(400).json({
          success: false,
          message: `Jersey number ${jerseyNumber} is already taken by ${existingJersey.name}`
        });
      }
    }

    // Assign player to team
    await player.assignToTeam(teamId, currentSeason._id, user.id, jerseyNumber);

    // Populate the updated player data
    await player.populate('currentTeam', 'name shortName logo');

    console.log(`✅ Player assigned: ${player.name} → ${team.name}`);

    return res.status(200).json({
      success: true,
      message: `${player.name} has been successfully assigned to ${team.name}`,
      data: {
        player: {
          _id: player._id,
          name: player.name,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          marketStatus: player.marketStatus,
          currentTeam: player.currentTeam
        },
        transfer: {
          type: transferType,
          date: new Date(),
          notes: notes
        }
      }
    });

  } catch (error) {
    console.error('Error assigning player:', error);
    
    // Handle specific errors
    if (error.message.includes('Jersey number')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to assign player to team',
      error: error.message
    });
  }
}

// pages/api/transfers/release-player.js - Player Release API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }
  
  console.log('🔓 Player Release API: POST /api/transfers/release-player');
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  // Verify authentication
  let user;
  try {
    user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const { playerId, reason } = req.body;

    // Validate required fields
    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'Player ID is required'
      });
    }

    // Find player
    const player = await Player.findOne({
      _id: playerId,
      isActive: true
    }).populate('currentTeam', 'name shortName');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if player is assigned to a team
    if (!player.currentTeam) {
      return res.status(400).json({
        success: false,
        message: 'Player is already a free agent'
      });
    }

    const teamName = player.currentTeam.name;

    // Release player from team
    await player.releaseFromTeam(reason || 'Released to market', user.id);

    console.log(`🔓 Player released: ${player.name} from ${teamName}`);

    return res.status(200).json({
      success: true,
      message: `${player.name} has been released from ${teamName} and is now available in the transfer market`,
      data: {
        player: {
          _id: player._id,
          name: player.name,
          position: player.position,
          marketStatus: player.marketStatus,
          previousTeam: teamName
        },
        release: {
          reason: reason || 'Released to market',
          date: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Error releasing player:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to release player',
      error: error.message
    });
  }
}

// pages/api/transfers/history.js - Transfer History API
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import Transfer from '../../../models/Transfer';
import League from '../../../models/League';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }
  
  console.log('📜 Transfer History API: GET /api/transfers/history');
  
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
    const { 
      playerId, 
      teamId, 
      limit = 50, 
      page = 1,
      days = 30 
    } = req.query;

    // Get main league
    const league = await League.findOne({ isDefault: true, isActive: true });
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Build query
    let query = { league: league._id };
    
    // Filter by date range
    if (days) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(days));
      query.createdAt = { $gte: fromDate };
    }

    // Filter by player or team
    if (playerId) {
      // Get player's transfer history from their transferHistory field
      const player = await Player.findById(playerId)
        .populate('transferHistory.fromTeam transferHistory.toTeam', 'name shortName logo')
        .populate('transferHistory.season', 'name')
        .select('name transferHistory');
      
      if (!player) {
        return res.status(404).json({
          success: false,
          message: 'Player not found'
        });
      }

      const transfers = player.transferHistory
        .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate))
        .slice(0, parseInt(limit))
        .map(transfer => ({
          ...transfer.toObject(),
          player: {
            _id: player._id,
            name: player.name
          }
        }));

      return res.status(200).json({
        success: true,
        data: transfers,
        count: transfers.length,
        player: player.name
      });
    }

    if (teamId) {
      query.$or = [
        { 'transferHistory.fromTeam': teamId },
        { 'transferHistory.toTeam': teamId }
      ];
    }

    // Get transfers from players
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const players = await Player.aggregate([
      { $match: { league: league._id, isActive: true } },
      { $unwind: '$transferHistory' },
      { $match: teamId ? {
          $or: [
            { 'transferHistory.fromTeam': mongoose.Types.ObjectId(teamId) },
            { 'transferHistory.toTeam': mongoose.Types.ObjectId(teamId) }
          ]
        } : {} },
      {
        $lookup: {
          from: 'teams',
          localField: 'transferHistory.fromTeam',
          foreignField: '_id',
          as: 'transferHistory.fromTeam'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'transferHistory.toTeam',
          foreignField: '_id',
          as: 'transferHistory.toTeam'
        }
      },
      {
        $lookup: {
          from: 'seasons',
          localField: 'transferHistory.season',
          foreignField: '_id',
          as: 'transferHistory.season'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          position: 1,
          photo: 1,
          transferHistory: 1
        }
      },
      { $sort: { 'transferHistory.transferDate': -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Format the response
    const transfers = players.map(player => ({
      _id: player.transferHistory._id,
      player: {
        _id: player._id,
        name: player.name,
        position: player.position,
        photo: player.photo
      },
      fromTeam: player.transferHistory.fromTeam[0] || null,
      toTeam: player.transferHistory.toTeam[0] || null,
      season: player.transferHistory.season[0] || null,
      transferDate: player.transferHistory.transferDate,
      transferType: player.transferHistory.transferType,
      transferFee: player.transferHistory.transferFee || 0,
      reason: player.transferHistory.reason,
      notes: player.transferHistory.notes
    }));

    return res.status(200).json({
      success: true,
      data: transfers,
      count: transfers.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching transfer history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer history',
      error: error.message
    });
  }
}
