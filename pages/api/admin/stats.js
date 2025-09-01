// FILE: pages/api/admin/stats.js (FIXED)  
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Player from '../../../models/Player';
import Match from '../../../models/Match';
import Transfer from '../../../models/Transfer';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Get active season
    const activeSeason = await Season.findOne({ isActive: true });
    const query = activeSeason ? { season: activeSeason._id } : {};

    const [totalTeams, totalPlayers, totalMatches, totalTransfers] = await Promise.all([
      Team.countDocuments(query),
      Player.countDocuments(query),
      Match.countDocuments(query),
      Transfer.countDocuments(query)
    ]);

    res.status(200).json({
      totalTeams,
      totalPlayers,
      totalMatches,
      totalTransfers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
