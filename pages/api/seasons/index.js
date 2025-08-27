// pages/api/seasons/index.js
import dbConnect from '../../../lib/mongodb';
import League from '../../../models/League';
import { ensureSingleLeague } from '../../../utils/singleLeague';

export default async function handler(req, res) {
  await dbConnect();
  const league = await ensureSingleLeague();

  if (req.method === 'GET') return res.status(200).json({ currentSeason: league.currentSeason || '2025/26' });

  if (req.method === 'POST') {
    const { season } = req.body || {};
    if (!season || !/^\d{4}\/\d{2}$/.test(season)) {
      return res.status(400).json({ error: 'Season must be in the format YYYY/YY e.g. 2025/26' });
    }
    league.currentSeason = season;
    await league.save();
    return res.status(200).json({ success: true, currentSeason: league.currentSeason });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
