// pages/api/matches/import-csv.js
import { IncomingForm } from 'formidable';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';
import Match from '../../../models/Match';
import { resolveLeagueId } from '../../../utils/resolveLeagueId';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  await dbConnect();

  try {
    const { files } = await new Promise((resolve, reject) => {
      const form = new IncomingForm({ multiples: false, keepExtensions: false });
      form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
    });

    const raw = files?.file;
    const f = Array.isArray(raw) ? raw[0] : raw;
    if (!f) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filepath = f.filepath || f.path || (f._writeStream && f._writeStream.path);
    const buf = await fs.readFile(filepath);
    const text = buf.toString('utf8');
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });

    const league = await resolveLeagueId();
    let inserted = 0;

    for (const r of rows) {
      const homeName = (r.homeTeam || '').trim();
      const awayName = (r.awayTeam || '').trim();
      if (!homeName || !awayName) continue;

      const getTeam = async (nm) => {
        let t = await Team.findOne({ league, name: nm });
        if (!t) t = await Team.create({ league, name: nm, shortName: nm.slice(0,3).toUpperCase() });
        return t;
      };
      const homeTeam = await getTeam(homeName);
      const awayTeam = await getTeam(awayName);

      const dt = (r.date && r.time) ? new Date(`${r.date}T${r.time}:00`) : null;
      await Match.create({
        league,
        date: dt || undefined,
        homeTeam: homeTeam._id,
        awayTeam: awayTeam._id,
        venue: r.venue || undefined,
        season: r.season || '2025/26',
        round: r.round || undefined,
        status: 'scheduled'
      });
      inserted += 1;
    }

    return res.status(200).json({ success: true, inserted });
  } catch (e) {
    console.error('CSV import failed', e);
    return res.status(400).json({ success: false, message: e.message || 'Import failed' });
  }
}
