// pages/api/transfers/index.js
import dbConnect from '../../../lib/mongodb';
import { resolveLeagueId } from '../../../utils/resolveLeagueId';
import Transfer from '../../../models/Transfer';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  await dbConnect();
  const { method, query, body } = req;

  if (method === 'GET') {
    try {
      const league = await resolveLeagueId(query.leagueId);
      const filter = { league };
      if (query.season) filter.season = query.season;
      const transfers = await Transfer.find(filter)
        .populate('player', 'name')
        .populate('fromTeam toTeam', 'name')
        .sort({ date: -1 })
        .limit(Number(query.limit || 200));

      return res.status(200).json({ success: true, data: transfers, transfers });
    } catch (e) {
      console.error('GET /api/transfers error:', e);
      return res.status(200).json({ success: true, data: [], transfers: [] });
    }
  }

  if (method === 'POST') {
    try {
      const league = await resolveLeagueId(body?.league);
      const playerId = body?.player;
      const toTeam = body?.toTeam;
      if (!playerId || !toTeam) return res.status(400).json({ success: false, message: 'player and toTeam are required' });

      const player = await Player.findById(playerId);
      if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

      const transfer = await Transfer.create({
        league,
        player: player._id,
        fromTeam: player.team || undefined,
        toTeam,
        fee: body?.fee,
        season: body?.season,
        date: body?.date ? new Date(body.date) : new Date(),
        notes: body?.notes
      });

      player.team = toTeam;
      await player.save();

      const saved = await Transfer.findById(transfer._id).populate('player', 'name').populate('fromTeam toTeam', 'name');
      return res.status(201).json({ success: true, data: saved });
    } catch (e) {
      console.error('POST /api/transfers error:', e);
      return res.status(400).json({ success: false, message: e.message || 'Failed to create transfer' });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
}

