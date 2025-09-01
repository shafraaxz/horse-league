// ===========================================
// FILE: pages/api/public/teams/[id].js
// ===========================================
import dbConnect from '../../../../lib/mongodb';
import Team from '../../../../models/Team';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Team ID is required' });
  }

  await dbConnect();

  try {
    const team = await Team.findById(id)
      .populate('season', 'name isActive');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}