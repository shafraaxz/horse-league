// pages/api/leagues/[id]/players.js - Get players for a specific league
import connectDB from '../../../../lib/db';
import Player from '../../../../models/Player';

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
    const players = await Player.findByLeague(id);

    console.log(`✅ Found ${players.length} players for league ${id}`);
    return res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch players'
    });
  }
}