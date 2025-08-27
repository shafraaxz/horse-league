// pages/api/matches/index.js
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Team from '../../../models/Team';
import { resolveLeagueId } from '../../../utils/resolveLeagueId';

export default async function handler(req, res) {
  await dbConnect();
  const { method, query, body } = req;

  if (method === 'GET') {
    try {
      const league = await resolveLeagueId(query.leagueId);
      const filter = { league };
      if (query.status) filter.status = query.status;
      if (query.season) filter.season = query.season;

      const matches = await Match.find(filter)
        .populate('homeTeam awayTeam', 'name logo')
        .sort({ date: 1 })
        .limit(Number(query.limit || 200));

      return res.status(200).json({ success: true, data: matches, matches });
    } catch (e) {
      console.error('GET /api/matches error:', e);
      return res.status(200).json({ success: true, data: [], matches: [] });
    }
  }

  if (method === 'POST') {
    try {
      const league = await resolveLeagueId(body?.league);
      const payload = { ...body, league };

      if (body?.homeTeamName && !body?.homeTeam) {
        const t = await Team.findOne({ league, name: body.homeTeamName });
        if (t) payload.homeTeam = t._id;
      }
      if (body?.awayTeamName && !body?.awayTeam) {
        const t = await Team.findOne({ league, name: body.awayTeamName });
        if (t) payload.awayTeam = t._id;
      }

      const match = await Match.create(payload);
      return res.status(201).json({ success: true, data: match });
    } catch (e) {
      console.error('POST /api/matches error:', e);
      return res.status(400).json({ success: false, message: e.message || 'Failed to create match' });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
}
