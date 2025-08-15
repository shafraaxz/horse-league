import connectDB from '../../../../lib/mongodb';
import { Match } from '../../../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { id } = req.query;
    const { 
      page = '1', 
      limit = '50',
      status = '',
      round = '',
      team = '',
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { league: id };
    if (status) filter.status = status;
    if (round) filter.round = parseInt(round);
    if (team) {
      filter.$or = [
        { homeTeam: team },
        { awayTeam: team }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .select('homeTeam awayTeam date time status score round venue referee')
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Match.countDocuments(filter)
    ]);

    res.status(200).json({
      matches,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}