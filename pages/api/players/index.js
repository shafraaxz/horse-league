// pages/api/players/index.js
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';
import { resolveLeagueId } from '../../../utils/resolveLeagueId';

export default async function handler(req, res) {
  await dbConnect();
  const { method, query, body } = req;

  if (method === 'GET') {
    try {
      const league = await resolveLeagueId(query.leagueId);
      const filter = { league };
      if (query.search) filter.name = { $regex: query.search, $options: 'i' };
      const players = await Player.find(filter).sort({ name: 1 }).limit(Number(query.limit || 200));
      return res.status(200).json({ success: true, data: players, players });
    } catch (e) {
      console.error('GET /api/players error:', e);
      return res.status(200).json({ success: true, data: [], players: [] });
    }
  }

  if (method === 'POST') {
    try {
      const league = await resolveLeagueId(body?.league);
      const name = (body?.name || '').trim();
      if (!name) return res.status(400).json({ success: false, message: 'Player name is required' });

      const player = await Player.create({ league, ...body, name });
      return res.status(201).json({ success: true, data: player });
    } catch (e) {
      console.error('POST /api/players error:', e);
      return res.status(400).json({ success: false, message: e.message || 'Failed to create player' });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
}
