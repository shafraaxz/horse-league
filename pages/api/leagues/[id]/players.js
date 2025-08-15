import connectDB from '../../../../lib/mongodb';
import { Player } from '../../../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { id } = req.query;
    const { 
      page = '1', 
      limit = '25',
      team = '',
      position = '',
      search = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { league: id };
    if (team) filter.team = team;
    if (position) filter.position = position;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [players, total] = await Promise.all([
      Player.find(filter)
        .select('name number position photo team stats')
        .populate('team', 'name logo')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Player.countDocuments(filter)
    ]);

    res.status(200).json({
      players,
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
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}