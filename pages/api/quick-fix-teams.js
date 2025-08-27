// pages/api/quick-fix-teams.js - Quick fix to link teams to league
import connectDB from '../../lib/db';
import Team from '../../models/Team';
import League from '../../models/League';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await connectDB();

  const { leagueId } = req.body;

  try {
    console.log('🔧 Quick fix: linking teams to league', leagueId);

    // Verify league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    // Get all teams
    const allTeams = await Team.find({}).lean();
    console.log('📊 Found', allTeams.length, 'total teams');

    // Get teams already in this league
    const leagueTeams = await Team.find({ league: leagueId }).lean();
    console.log('📊 Found', leagueTeams.length, 'teams already in league');

    // Find teams without a league or with wrong league
    const unlinkedTeams = allTeams.filter(team => 
      !team.league || team.league.toString() !== leagueId
    );
    
    console.log('📊 Found', unlinkedTeams.length, 'teams to link');

    let updatedCount = 0;
    if (unlinkedTeams.length > 0) {
      const teamIds = unlinkedTeams.map(team => team._id);
      
      const result = await Team.updateMany(
        { _id: { $in: teamIds } },
        { $set: { league: leagueId } }
      );
      
      updatedCount = result.modifiedCount;
      console.log('✅ Updated', updatedCount, 'teams');
    }

    // Get final count
    const finalTeamCount = await Team.countDocuments({ league: leagueId });

    return res.status(200).json({
      success: true,
      message: `Quick fix completed! Linked ${updatedCount} teams to league.`,
      data: {
        leagueId,
        leagueName: league.name,
        totalTeamsInDb: allTeams.length,
        teamsLinked: updatedCount,
        finalTeamCount,
        teamDetails: unlinkedTeams.map(t => ({
          _id: t._id,
          name: t.name,
          previousLeague: t.league
        }))
      }
    });

  } catch (error) {
    console.error('❌ Quick fix error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}