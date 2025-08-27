// pages/api/leagues/[id]/players.js - Get players in a specific league
import dbConnect from '../../../../lib/mongodb';
import League from '../../../../models/League';
import Player from '../../../../models/Player';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  console.log(`🏆 League Players API: ${method} /api/leagues/${id}/players`);

  // Validate ObjectId
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!id || !objectIdRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid league ID format'
    });
  }

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

  switch (method) {
    case 'GET':
      try {
        const {
          status = 'all', // 'all', 'free_agents', 'assigned'
          position,
          team,
          search,
          limit = 200
        } = req.query;

        // ✅ Verify league exists
        const league = await League.findById(id);
        if (!league) {
          return res.status(404).json({
            success: false,
            message: 'League not found'
          });
        }

        // ✅ Build query for players in this league
        let query = {
          league: id,
          isActive: true
        };

        // Filter by assignment status
        if (status === 'free_agents') {
          query.$and = [
            { $or: [{ team: { $exists: false } }, { team: null }] },
            { $or: [{ currentTeam: { $exists: false } }, { currentTeam: null }] }
          ];
        } else if (status === 'assigned') {
          query.$or = [
            { team: { $exists: true, $ne: null } },
            { currentTeam: { $exists: true, $ne: null } }
          ];
        }

        // Filter by position
        if (position) {
          query.position = position;
        }

        // Filter by specific team
        if (team) {
          query.$or = [
            { team: team },
            { currentTeam: team }
          ];
        }

        // Search functionality
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { nationality: { $regex: search, $options: 'i' } }
          ];
        }

        console.log('🔍 League players query:', JSON.stringify(query, null, 2));

        // ✅ Get players with populated team information
        const players = await Player.find(query)
          .populate('team', 'name shortName primaryColor logo')
          .populate('currentTeam', 'name shortName primaryColor logo')
          .populate('league', 'name type sport')
          .sort({ name: 1 })
          .limit(parseInt(limit))
          .lean();

        console.log(`✅ Found ${players.length} players in league ${league.name}`);

        // ✅ Enhance players with computed fields
        const enhancedPlayers = players.map(player => {
          const currentTeam = player.currentTeam || player.team;
          return {
            ...player,
            isAssigned: !!currentTeam,
            isFreeAgent: !currentTeam,
            currentTeamInfo: currentTeam,
            assignmentStatus: currentTeam ? 'assigned' : 'free_agent'
          };
        });

        // ✅ Calculate statistics
        const stats = {
          total: enhancedPlayers.length,
          freeAgents: enhancedPlayers.filter(p => p.isFreeAgent).length,
          assigned: enhancedPlayers.filter(p => p.isAssigned).length,
          byPosition: {
            goalkeeper: enhancedPlayers.filter(p => p.position === 'Goalkeeper').length,
            defender: enhancedPlayers.filter(p => p.position === 'Defender').length,
            midfielder: enhancedPlayers.filter(p => p.position === 'Midfielder').length,
            forward: enhancedPlayers.filter(p => p.position === 'Forward').length
          }
        };

        return res.status(200).json({
          success: true,
          count: enhancedPlayers.length,
          data: enhancedPlayers,
          players: enhancedPlayers, // backward compatibility
          stats,
          league: {
            id: league._id,
            name: league.name,
            type: league.type,
            sport: league.sport
          },
          filters: {
            status,
            position,
            team,
            search
          }
        });

      } catch (error) {
        console.error('Error fetching league players:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch league players',
          error: error.message
        });
      }

    case 'POST':
      try {
        // ✅ Register new player to this league
        const playerData = {
          ...req.body,
          league: id, // Associate with this league
          team: null, // Start as free agent
          currentTeam: null,
          jerseyNumber: null, // No jersey until assigned to team
          status: 'active',
          registrationStatus: 'approved'
        };

        // Validate required fields
        if (!playerData.name || !playerData.name.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Player name is required'
          });
        }

        // Verify league exists
        const league = await League.findById(id);
        if (!league) {
          return res.status(404).json({
            success: false,
            message: 'League not found'
          });
        }

        // ✅ Create player
        const player = new Player({
          name: playerData.name.trim(),
          position: playerData.position || 'Forward',
          preferredFoot: playerData.preferredFoot || 'Right',
          league: id,
          team: null,
          currentTeam: null,
          jerseyNumber: null,
          status: 'active',
          registrationStatus: 'approved',
          isActive: true,
          registrationDate: new Date(),
          
          // Add optional fields
          ...(playerData.dateOfBirth && { dateOfBirth: new Date(playerData.dateOfBirth) }),
          ...(playerData.nationality && { nationality: playerData.nationality.trim() }),
          ...(playerData.height && { height: parseInt(playerData.height) }),
          ...(playerData.weight && { weight: parseInt(playerData.weight) }),
          ...(playerData.email && { email: playerData.email.trim() }),
          ...(playerData.phone && { phone: playerData.phone.trim() }),
          ...(playerData.photo && { photo: playerData.photo }),
          ...(playerData.previousClubs && { previousClubs: playerData.previousClubs.trim() }),
          ...(playerData.registrationFee && { registrationFee: parseFloat(playerData.registrationFee) }),
          ...(playerData.contractType && { contractType: playerData.contractType }),
          
          // Initialize statistics
          statistics: {
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            cleanSheets: 0,
            saves: 0,
            minutesPlayed: 0
          }
        });

        await player.save();

        // ✅ Populate for response
        const populatedPlayer = await Player.findById(player._id)
          .populate('league', 'name type sport');

        console.log(`✅ Player ${player.name} registered to league ${league.name}`);

        return res.status(201).json({
          success: true,
          message: 'Player registered to league successfully',
          data: populatedPlayer
        });

      } catch (error) {
        console.error('Error registering player to league:', error);
        
        if (error.name === 'ValidationError') {
          const validationMessages = Object.values(error.errors).map(err => err.message);
          return res.status(400).json({
            success: false,
            message: 'Validation error: ' + validationMessages.join(', ')
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to register player to league',
          error: error.message
        });
      }

    default:
      return res.status(405).json({
        success: false,
        message: `Method ${method} not allowed`
      });
  }
}