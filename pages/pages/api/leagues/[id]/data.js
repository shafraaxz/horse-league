import connectDB from '../../../../lib/mongodb';
import { League } from '../../../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { id } = req.query;

    // Just return basic league info and redirect to summary
    const league = await League.findById(id).select('name description logo season status').lean();
    
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Return lightweight response with instructions
    res.status(200).json({
      message: 'This endpoint has been optimized. Please use specific endpoints:',
      league,
      endpoints: {
        summary: `/api/leagues/${id}/summary`,
        players: `/api/leagues/${id}/players`,
        matches: `/api/leagues/${id}/matches`,
        stats: `/api/leagues/${id}/stats`
      },
      note: 'Use these endpoints for better performance and smaller responses'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}