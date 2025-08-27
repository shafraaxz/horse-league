// pages/api/players/[id].js
import dbConnect from '../../../lib/mongodb';
import Player from '../../../models/Player';

export default async function handler(req, res) {
  await dbConnect();
  const { method, query, body } = req;
  const id = query.id;

  if (method === 'PATCH') {
    try {
      const p = await Player.findById(id);
      if (!p) return res.status(404).json({ success: false, message: 'Not found' });
      ['name','team','position','number'].forEach(k => { if (k in body) p[k] = body[k]; });
      await p.save();
      return res.status(200).json({ success: true, data: p });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message || 'Failed to update' });
    }
  }

  if (method === 'GET') {
    try {
      const p = await Player.findById(id);
      if (!p) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, data: p });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message || 'Failed' });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
}

