// pages/api/leagues/[id]/teams.js - Get teams for a specific league
import connectDB from '../../../../lib/db';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  await connectDB();
  
  const { id } = req.query;

  try {
    const teams = await Team.find({ league: id })
      .populate('captain', 'name position')
      .populate('league', 'name')
      .sort({ name: 1 })
      .lean();

    console.log(`✅ Found ${teams.length} teams for league ${id}`);
    return res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teams'
    });
  }
}