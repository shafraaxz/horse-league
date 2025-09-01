import dbConnect from '../../../../lib/mongodb';
import Match from '../../../../models/Match';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { matchId } = req.body;

    const match = await Match.findByIdAndUpdate(
      matchId,
      {
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
        events: [],
        'liveData.currentMinute': 0,
        'liveData.isLive': false,
        'liveData.lastUpdate': new Date(),
      },
      { new: true }
    ).populate('homeTeam', 'name logo').populate('awayTeam', 'name logo');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.status(200).json({ message: 'Match reset successfully', match });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
