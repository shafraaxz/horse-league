// FILE: pages/api/admin/recent-activity.js (FIXED)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Transfer from '../../../models/Transfer';
import Match from '../../../models/Match';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { format } from 'date-fns';

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
    // Get recent transfers
    const recentTransfers = await Transfer.find({})
      .populate('player', 'firstName lastName')
      .populate('toTeam', 'name')
      .sort({ transferDate: -1 })
      .limit(5);

    // Get recent matches
    const recentMatches = await Match.find({})
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const activity = [];

    // Add transfer activities
    recentTransfers.forEach(transfer => {
      activity.push({
        type: 'transfer',
        description: `${transfer.player.firstName} ${transfer.player.lastName} joined ${transfer.toTeam.name}`,
        timestamp: format(new Date(transfer.transferDate), 'MMM dd, yyyy HH:mm'),
        date: transfer.transferDate
      });
    });

    // Add match activities
    recentMatches.forEach(match => {
      activity.push({
        type: 'match',
        description: `Match created: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
        timestamp: format(new Date(match.createdAt), 'MMM dd, yyyy HH:mm'),
        date: match.createdAt
      });
    });

    // Sort by date and limit to 10
    activity.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedActivity = activity.slice(0, 10);

    res.status(200).json(limitedActivity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
