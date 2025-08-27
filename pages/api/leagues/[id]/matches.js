// pages/api/leagues/[id]/matches.js - Get matches for a specific league
import connectDB from '../../../../lib/db';
import { Match } from '../../../../models/Match';

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
    const matches = await Match.find({ league: id })
      .populate('homeTeam', 'name shortName logo')
      .populate('awayTeam', 'name shortName logo')
      .populate('league', 'name')
      .sort({ date: -1, time: -1 })
      .lean();

    console.log(`✅ Found ${matches.length} matches for league ${id}`);
    return res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch matches'
    });
  }
}