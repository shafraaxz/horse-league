// pages/api/export/schedule-pdf.js
import PDFDocument from 'pdfkit';
import dbConnect from '../../../lib/mongodb';
import Match from '../../../models/Match';
import { resolveLeagueId } from '../../../utils/resolveLeagueId';

export default async function handler(req, res) {
  await dbConnect();
  try {
    const league = await resolveLeagueId();
    const matches = await Match.find({ league }).populate('homeTeam awayTeam', 'name').sort({ date: 1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="horse-futsal-schedule.pdf"');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text('The Horse Futsal League — Schedule', { align: 'center' });
    doc.moveDown();

    const header = ['Date/Time', 'Home', 'Away', 'Venue', 'Round', 'Season'];
    const widths = [110, 120, 120, 80, 80, 70];

    doc.fontSize(11).font('Helvetica-Bold');
    header.forEach((h, i) => doc.text(h, 40 + widths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: widths[i] }));
    doc.moveDown(0.5);
    doc.font('Helvetica');

    matches.forEach(m => {
      const dt = m.date ? new Date(m.date).toLocaleString() : '-';
      const row = [dt, m.homeTeam?.name || '-', m.awayTeam?.name || '-', m.venue || '-', m.round || '-', m.season || '-'];
      row.forEach((cell, i) => {
        doc.text(String(cell), 40 + widths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: widths[i] });
      });
      doc.moveDown(0.3);
    });

    if (!matches.length) {
      doc.moveDown().text('No matches yet.', { align: 'center', oblique: true });
    }

    doc.end();
  } catch (e) {
    console.error('PDF export failed', e);
    res.status(500).json({ success: false, message: e.message || 'Export failed' });
  }
}
