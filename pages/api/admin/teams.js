// FILE: pages/api/admin/teams.js (FIXED)
// ===========================================
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Season from '../../../models/Season';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { seasonId } = req.query;
      const query = seasonId ? { season: seasonId } : {};
      
      const teams = await Team.find(query)
        .populate('season', 'name')
        .sort({ name: 1 });
        
      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const team = await Team.create(req.body);
      const populatedTeam = await Team.findById(team._id).populate('season', 'name');
      
      res.status(201).json({
        message: 'Team created successfully',
        team: populatedTeam,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const team = await Team.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('season', 'name');

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      res.status(200).json({
        message: 'Team updated successfully',
        team,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      const team = await Team.findByIdAndDelete(id);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}