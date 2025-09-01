import jsPDF from 'jspdf';
import dbConnect from '../../lib/mongodb';
import Match from '../../models/Match';
import { format } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { seasonId } = req.query;
    const query = seasonId ? { season: seasonId } : {};
    
    const matches = await Match.find(query)
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .populate('season', 'name')
      .sort({ matchDate: 1 });

    // Create PDF
    const pdf = new jsPDF();
    
    // Title
    pdf.setFontSize(20);
    pdf.text('Horse Futsal Tournament Schedule', 20, 30);
    
    if (matches.length > 0 && matches[0].season) {
      pdf.setFontSize(14);
      pdf.text(`Season: ${matches[0].season.name}`, 20, 45);
    }
    
    pdf.setFontSize(12);
    let yPosition = 60;
    
    matches.forEach((match, index) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      
      const matchDate = format(new Date(match.matchDate), 'MMM dd, yyyy HH:mm');
      const matchText = `${matchDate} - ${match.homeTeam.name} vs ${match.awayTeam.name}`;
      
      pdf.text(matchText, 20, yPosition);
      
      if (match.venue) {
        pdf.text(`Venue: ${match.venue}`, 25, yPosition + 5);
        yPosition += 10;
      }
      
      yPosition += 15;
    });
    
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=match-schedule.pdf');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF generation failed', error: error.message });
  }
}
