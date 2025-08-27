// pages/api/leagues/index.js
import dbConnect from '../../../lib/mongodb';
import { ensureSingleLeague } from '../../../utils/singleLeague';

export default async function handler(req, res) {
  await dbConnect();
  try {
    if (req.method === 'GET') {
      const league = await ensureSingleLeague();
      return res.status(200).json({
        success: true,
        data: [league],
        leagues: [league],
        pagination: { total: 1, page: 1, limit: 1 }
      });
    }
    if (req.method === 'POST') {
      const league = await ensureSingleLeague();
      const b = req.body || {};
      ['name','slug','currentSeason','shortName','description','logo','banner','rules','status','startDate','endDate']
        .forEach(k => { if (k in b) league[k] = b[k]; });
      await league.save();
      return res.status(200).json({ success: true, data: league, message: 'League saved' });
    }
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('Leagues API error:', err);
    return res.status(200).json({ success: true, data: [], leagues: [], pagination: { total: 0, page: 1, limit: 20 } });
  }
}
