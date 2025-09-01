import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { seasonId } = req.query;
      const query = seasonId ? { season: seasonId } : {};
      
      const matches = await Match.find(query)
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .populate('season', 'name')
        .sort({ matchDate: 1 });
        
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const match = await Match.create(req.body);
      const populatedMatch = await Match.findById(match._id)
        .populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .populate('season', 'name');
      
      res.status(201).json({
        message: 'Match created successfully',
        match: populatedMatch,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const match = await Match.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('homeTeam', 'name logo')
        .populate('awayTeam', 'name logo')
        .populate('season', 'name');

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      // Update team stats if match is completed
      if (updateData.status === 'completed' && match.status === 'completed') {
        await updateTeamStats(match);
      }

      res.status(200).json({
        message: 'Match updated successfully',
        match,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

async function updateTeamStats(match) {
  const homeTeam = await Team.findById(match.homeTeam);
  const awayTeam = await Team.findById(match.awayTeam);

  // Update home team stats
  homeTeam.stats.matchesPlayed += 1;
  homeTeam.stats.goalsFor += match.homeScore;
  homeTeam.stats.goalsAgainst += match.awayScore;

  // Update away team stats
  awayTeam.stats.matchesPlayed += 1;
  awayTeam.stats.goalsFor += match.awayScore;
  awayTeam.stats.goalsAgainst += match.homeScore;

  // Determine winner and update records
  if (match.homeScore > match.awayScore) {
    homeTeam.stats.wins += 1;
    homeTeam.stats.points += 3;
    awayTeam.stats.losses += 1;
  } else if (match.awayScore > match.homeScore) {
    awayTeam.stats.wins += 1;
    awayTeam.stats.points += 3;
    homeTeam.stats.losses += 1;
  } else {
    homeTeam.stats.draws += 1;
    homeTeam.stats.points += 1;
    awayTeam.stats.draws += 1;
    awayTeam.stats.points += 1;
  }

  await homeTeam.save();
  await awayTeam.save();
}