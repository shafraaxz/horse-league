import dbConnect from '../../../lib/mongodb';
import Season from '../../../models/Season';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const seasons = await Season.find({})
      .sort({ startDate: -1 });
    
    res.status(200).json(seasons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
