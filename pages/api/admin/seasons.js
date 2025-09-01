// FILE: pages/api/admin/seasons.js (FIXED)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Use getServerSession instead of getSession
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const seasons = await Season.find({}).sort({ startDate: -1 });
      res.status(200).json(seasons);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const seasonData = req.body;
      
      // If this season is set as active, deactivate others
      if (seasonData.isActive) {
        await Season.updateMany({}, { isActive: false });
      }

      const season = await Season.create(seasonData);
      
      res.status(201).json({
        message: 'Season created successfully',
        season,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      // If this season is set as active, deactivate others
      if (updateData.isActive) {
        await Season.updateMany({}, { isActive: false });
      }
      
      const season = await Season.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }

      res.status(200).json({
        message: 'Season updated successfully',
        season,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      const season = await Season.findByIdAndDelete(id);
      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }

      res.status(200).json({ message: 'Season deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}