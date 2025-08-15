import connectDB from '../../../../lib/mongodb';
import { League, Team, Match } from '../../../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { id } = req.query;

    // Get only essential data for dashboard
    const [league, teams, recentMatches, liveMatches] = await Promise.all([
      League.findById(id).select('name description logo season status').lean(),
      Team.find({ league: id }).select('name logo coach stadium').lean(),
      Match.find({ league: id })
        .select('homeTeam awayTeam date time status score round venue')
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .sort({ date: -1 })
        .limit(20)
        .lean(),
      Match.find({ 
        league: id, 
        status: { $in: ['live', 'halftime'] }
      })
        .select('homeTeam awayTeam score liveData status')
        .populate('homeTeam', 'name')
        .populate('awayTeam', 'name')
        .lean()
    ]);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const summary = {
      league,
      teams,
      stats: {
        totalTeams: teams.length,
        totalMatches: await Match.countDocuments({ league: id }),
        liveMatches: liveMatches.length,
        finishedMatches: await Match.countDocuments({ league: id, status: 'finished' }),
        scheduledMatches: await Match.countDocuments({ league: id, status: 'scheduled' })
      },
      recentMatches,
      liveMatches
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching league summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
