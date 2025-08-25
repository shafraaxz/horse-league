// GET /api/matches/[id]
async function getMatch(req, res, id) {
  try {
    const match = await req.db.collection(MatchModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!match) {
      return res.status(404).json(formatError('Match not found'));
    }

    // Get team details
    const [homeTeamDetails, awayTeamDetails] = await Promise.all([
      req.db.collection('teams').findOne({ _id: match.homeTeamId }),
      req.db.collection('teams').findOne({ _id: match.awayTeamId })
    ]);

    // Get player details for events
    const eventsWithPlayerDetails = await Promise.all(
      (match.events || []).map(async (event) => {
        if (event.playerId) {
          const player = await req.db.collection('players')
            .findOne({ _id: event.playerId });
          return {
            ...event,
            playerDetails: player
          };
        }
        return event;
      })
    );

    const response = {
      ...match,
      homeTeamDetails,
      awayTeamDetails,
      events: eventsWithPlayerDetails
    };

    res.status(200).json(formatResponse(response, 'Match retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve match: ${error.message}`);
  }
}

// PUT /api/matches/[id]
async function updateMatch(req, res, id) {
  // Validate request body
  const errors = MatchModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  try {
    // Check if match exists
    const existingMatch = await req.db.collection(MatchModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!existingMatch) {
      return res.status(404).json(formatError('Match not found'));
    }

    // Don't allow updating live or completed matches through this endpoint
    if (existingMatch.status === 'live') {
      return res.status(400).json(formatError('Cannot update live match. Use live match endpoints.'));
    }

    if (existingMatch.status === 'completed') {
      return res.status(400).json(formatError('Cannot update completed match.'));
    }

    // Verify teams exist if they're being updated
    let homeTeamId = existingMatch.homeTeamId;
    let awayTeamId = existingMatch.awayTeamId;

    if (req.body.homeTeam && req.body.homeTeam !== existingMatch.homeTeam) {
      const homeTeam = await req.db.collection('teams').findOne({
        name: req.body.homeTeam,
        season: existingMatch.season
      });
      if (!homeTeam) {
        return res.status(404).json(formatError('Home team not found'));
      }
      homeTeamId = homeTeam._id;
    }

    if (req.body.awayTeam && req.body.awayTeam !== existingMatch.awayTeam) {
      const awayTeam = await req.db.collection('teams').findOne({
        name: req.body.awayTeam,
        season: existingMatch.season
      });
      if (!awayTeam) {
        return res.status(404).json(formatError('Away team not found'));
      }
      awayTeamId = awayTeam._id;
    }

    // Check for scheduling conflicts if date/venue is being updated
    if ((req.body.date && req.body.date !== existingMatch.date) || 
        (req.body.venue && req.body.venue !== existingMatch.venue)) {
      const conflictingMatch = await req.db.collection(MatchModel.collection)
        .findOne({
          _id: { $ne: toObjectId(id) },
          date: new Date(req.body.date || existingMatch.date),
          venue: sanitizeInput(req.body.venue || existingMatch.venue),
          status: { $in: ['scheduled', 'live'] }
        });

      if (conflictingMatch) {
        return res.status(409).json(formatError('Venue is already booked for this date and time'));
      }
    }

    // Sanitize update data
    const updateData = {
      ...req.body,
      homeTeam: req.body.homeTeam ? sanitizeInput(req.body.homeTeam) : existingMatch.homeTeam,
      awayTeam: req.body.awayTeam ? sanitizeInput(req.body.awayTeam) : existingMatch.awayTeam,
      venue: req.body.venue ? sanitizeInput(req.body.venue) : existingMatch.venue,
      homeTeamId,
      awayTeamId,
      date: req.body.date ? new Date(req.body.date) : existingMatch.date,
      updatedAt: new Date()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.season;
    delete updateData.createdAt;
    delete updateData.events;
    delete updateData.liveData;

    // Update match
    const result = await req.db.collection(MatchModel.collection)
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      throw new Error('Failed to update match');
    }

    res.status(200).json(formatResponse(result.value, 'Match updated successfully'));
  } catch (error) {
    throw new Error(`Failed to update match: ${error.message}`);
  }
}

// DELETE /api/matches/[id]
async function deleteMatch(req, res, id) {
  try {
    // Check if match exists
    const match = await req.db.collection(MatchModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!match) {
      return res.status(404).json(formatError('Match not found'));
    }

    // Don't allow deleting live matches
    if (match.status === 'live') {
      return res.status(400).json(formatError('Cannot delete live match. Please complete the match first.'));
    }

    // Delete match
    const result = await req.db.collection(MatchModel.collection)
      .deleteOne({ _id: toObjectId(id) });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete match');
    }

    res.status(200).json(formatResponse(null, 'Match deleted successfully'));
  } catch (error) {
    throw new Error(`Failed to delete match: ${error.message}`);
  }
}