// pages/api/leagues/[id]/standings.js
import dbConnect from '../../../../lib/mongodb';
import League from '../../../../models/League';
import Standing from '../../../../models/Standing';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  console.log(`📊 League Standings API: ${method} /api/leagues/${id}/standings`);

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
        // First verify the league exists
        const league = await League.findById(id);
        if (!league) {
          return res.status(404).json({
            success: false,
            message: 'League not found'
          });
        }

        // Get standings for this league
        let standings = await Standing.find({ league: id })
          .populate('team', 'name shortName logo')
          .populate('league', 'name type')
          .sort({ points: -1, goalDifference: -1, goalsFor: -1 })
          .lean();

        // If no standings exist, create initial standings for all teams in the league
        if (standings.length === 0) {
          console.log('📋 No standings found, creating initial standings...');
          
          const teams = await Team.find({ leagues: id });
          
          if (teams.length > 0) {
            const initialStandings = teams.map((team, index) => ({
              league: id,
              team: team._id,
              position: index + 1,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              form: []
            }));

            await Standing.insertMany(initialStandings);

            // Fetch the newly created standings
            standings = await Standing.find({ league: id })
              .populate('team', 'name shortName logo')
              .populate('league', 'name type')
              .sort({ points: -1, goalDifference: -1, goalsFor: -1 })
              .lean();
          }
        }

        // Update positions based on current sort order
        for (let i = 0; i < standings.length; i++) {
          if (standings[i].position !== i + 1) {
            await Standing.findByIdAndUpdate(standings[i]._id, { position: i + 1 });
            standings[i].position = i + 1;
          }
        }

        console.log(`✅ Found ${standings.length} standings for league ${id}`);

        return res.status(200).json({
          success: true,
          count: standings.length,
          data: standings,
          standings: standings // backward compatibility
        });

      } catch (error) {
        console.error('Error fetching league standings:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch league standings',
          error: error.message
        });
      }

    case 'POST':
      try {
        // Update standings (usually called after match completion)
        const { teamId, matchResult } = req.body;

        if (!teamId || !matchResult) {
          return res.status(400).json({
            success: false,
            message: 'teamId and matchResult are required'
          });
        }

        // Find the team's standing in this league
        let standing = await Standing.findOne({ league: id, team: teamId });

        if (!standing) {
          // Create new standing if it doesn't exist
          standing = new Standing({
            league: id,
            team: teamId,
            position: 1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: []
          });
        }

        // Update standing based on match result
        standing.played += 1;
        standing.goalsFor += matchResult.goalsFor;
        standing.goalsAgainst += matchResult.goalsAgainst;
        standing.goalDifference = standing.goalsFor - standing.goalsAgainst;

        if (matchResult.result === 'win') {
          standing.won += 1;
          standing.points += 3;
          standing.form.unshift('W');
        } else if (matchResult.result === 'draw') {
          standing.drawn += 1;
          standing.points += 1;
          standing.form.unshift('D');
        } else if (matchResult.result === 'loss') {
          standing.lost += 1;
          standing.form.unshift('L');
        }

        // Keep only last 5 form results
        if (standing.form.length > 5) {
          standing.form = standing.form.slice(0, 5);
        }

        await standing.save();

        console.log('✅ Standing updated successfully');

        return res.status(200).json({
          success: true,
          message: 'Standing updated successfully',
          data: standing
        });

      } catch (error) {
        console.error('Error updating standing:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update standing',
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