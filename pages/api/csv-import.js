import formidable from 'formidable';
import Papa from 'papaparse';
import { getSession } from 'next-auth/react';
import dbConnect from '../../lib/mongodb';
import Match from '../../models/Match';
import Team from '../../models/Team';
import Season from '../../models/Season';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const file = files.csvFile[0];
    if (!file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const fs = await import('fs');
    const csvData = fs.readFileSync(file.filepath, 'utf8');
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({ 
        message: 'CSV parsing errors', 
        errors: parsed.errors 
      });
    }

    const matches = [];
    const errors = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      
      try {
        // Find teams by name
        const homeTeam = await Team.findOne({ name: row.homeTeam?.trim() });
        const awayTeam = await Team.findOne({ name: row.awayTeam?.trim() });
        
        if (!homeTeam) {
          errors.push(`Row ${i + 1}: Home team "${row.homeTeam}" not found`);
          continue;
        }
        
        if (!awayTeam) {
          errors.push(`Row ${i + 1}: Away team "${row.awayTeam}" not found`);
          continue;
        }

        // Find season
        const season = await Season.findOne({ isActive: true });
        if (!season) {
          errors.push(`Row ${i + 1}: No active season found`);
          continue;
        }

        const matchDate = new Date(row.matchDate);
        if (isNaN(matchDate.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format "${row.matchDate}"`);
          continue;
        }

        const match = {
          homeTeam: homeTeam._id,
          awayTeam: awayTeam._id,
          season: season._id,
          matchDate,
          venue: row.venue || '',
          round: row.round || 'Regular Season',
          referee: row.referee || '',
          status: 'scheduled',
        };

        matches.push(match);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (matches.length > 0) {
      await Match.insertMany(matches);
    }

    res.status(200).json({
      message: `Successfully imported ${matches.length} matches`,
      imported: matches.length,
      errors: errors,
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
}
