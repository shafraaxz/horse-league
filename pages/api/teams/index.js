// pages/api/teams/index.js
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import { resolveLeagueId } from '../../../utils/resolveLeagueId';

export default async function handler(req, res) {
  await dbConnect();
  const { method, query, body } = req;

  if (method === 'GET') {
    try {
      const league = await resolveLeagueId(query.leagueId);
      const filter = { league };
      if (query.search) filter.name = { $regex: query.search, $options: 'i' };
      const teams = await Team.find(filter).sort({ name: 1 }).limit(Number(query.limit || 200));
      return res.status(200).json({ success: true, data: teams, teams });
    } catch (e) {
      console.error('GET /api/teams error:', e);
      return res.status(200).json({ success: true, data: [], teams: [] });
    }
  }

  if (method === 'POST') {
    try {
      const league = await resolveLeagueId(body?.league);
      const name = (body?.name || '').trim();
      if (!name) return res.status(400).json({ success: false, message: 'Team name is required' });

      const exists = await Team.findOne({ league, name });
      if (exists) return res.status(409).json({ success: false, message: 'Team already exists in this league' });

      const team = await Team.create({
        league,
        name,
        shortName: body?.shortName,
        logo: body?.logo,
        founded: body?.founded,
        coach: body?.coach,
        homeVenue: body?.homeVenue,
        colors: body?.colors
      });

      return res.status(201).json({ success: true, data: team });
    } catch (e) {
      console.error('POST /api/teams error:', e);
      return res.status(400).json({ success: false, message: e.message || 'Failed to create team' });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
}
