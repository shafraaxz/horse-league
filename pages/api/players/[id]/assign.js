// pages/api/players/[id]/assign.js - Team Assignment
export async function assignHandler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const { teamId, leagueId, jerseyNumber } = req.body;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.role !== 'league_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Validate input
    if (!teamId || !leagueId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and League ID are required'
      });
    }

    const player = await Player.findOne({ 
      _id: id, 
      isActive: true,
      registrationStatus: 'approved',
      'eligibility.isEligible': true
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found or not eligible for assignment'
      });
    }

    // Check if player is already assigned
    if (player.currentTeam) {
      return res.status(400).json({
        success: false,
        message: 'Player is already assigned to a team. Release first.'
      });
    }

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check jersey number uniqueness in team
    if (jerseyNumber) {
      const existingPlayer = await Player.findOne({
        currentTeam: teamId,
        'teamAssignments.jerseyNumber': jerseyNumber,
        'teamAssignments.status': 'active'
      });
      
      if (existingPlayer) {
        return res.status(400).json({
          success: false,
          message: `Jersey number ${jerseyNumber} is already taken`
        });
      }
    }

    // Assign player to team
    await player.assignToTeam(teamId, leagueId, req.user.id, jerseyNumber);

    // Populate response
    await player.populate([
      { path: 'currentTeam', select: 'name shortName logo' },
      { path: 'teamAssignments.team', select: 'name shortName' },
      { path: 'teamAssignments.league', select: 'name type' },
      { path: 'teamAssignments.assignedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Player assigned to team successfully',
      data: player
    });
  } catch (error) {
    console.error('Error assigning player:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error assigning player', 
      error: error.message 
    });
  }
}

// pages/api/players/[id]/release.js - Team Release
export async function releaseHandler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const { reason } = req.body;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.role !== 'league_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const player = await Player.findOne({ _id: id, isActive: true });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    if (!player.currentTeam) {
      return res.status(400).json({
        success: false,
        message: 'Player is not currently assigned to any team'
      });
    }

    // Release player from team
    await player.releaseFromTeam(req.user.id, reason);

    // Populate response
    await player.populate([
      { path: 'teamAssignments.team', select: 'name shortName' },
      { path: 'teamAssignments.league', select: 'name type' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Player released from team successfully',
      data: player
    });
  } catch (error) {
    console.error('Error releasing player:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error releasing player', 
      error: error.message 
    });
  }
}