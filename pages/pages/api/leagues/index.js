import connectDB from '../../../lib/mongodb';
import { League } from '../../../lib/models';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        console.log('Fetching leagues from database...');
        const leagues = await League.find().sort({ createdAt: -1 });
        console.log('Found leagues:', leagues.length);
        return res.status(200).json(leagues);
        
      case 'POST':
      case 'DELETE':
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('Authenticated user:', decoded.username);

        if (req.method === 'POST') {
          const { name, logo } = req.body;
          console.log('Creating league:', name);
          
          if (!name) {
            return res.status(400).json({ error: 'League name is required' });
          }

          const newLeague = new League({
            name,
            logo,
            createdBy: decoded.adminId,
            teamsCount: 0,
            matchesCount: 0
          });

          const savedLeague = await newLeague.save();
          console.log('League created:', savedLeague._id);
          
          return res.status(201).json({
            message: 'League created successfully',
            league: savedLeague
          });
        }

        if (req.method === 'DELETE') {
          const { id } = req.query;
          console.log('Deleting league:', id);
          
          if (!id) {
            return res.status(400).json({ error: 'League ID is required' });
          }

          const deletedLeague = await League.findByIdAndDelete(id);
          
          if (!deletedLeague) {
            return res.status(404).json({ error: 'League not found' });
          }

          console.log('League deleted:', id);
          return res.status(200).json({ message: 'League deleted successfully' });
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leagues API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
