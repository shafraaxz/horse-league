// ===========================================
// FILE: pages/api/csv-import.js (FIXED - NO MULTER)
// ===========================================
import connectDB from '../../lib/mongodb';
import Match from '../../models/Match';
import Team from '../../models/Team';
import Season from '../../models/Season';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';

// Configure to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple CSV parser function (no external dependency)
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return { data, errors: [] };
}

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    console.log('CSV Import - Session check:', { 
      hasSession: !!session, 
      userRole: session?.user?.role 
    });
    
    if (!session) {
      console.log('No session found for CSV import');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'admin') {
      console.log('User is not admin for CSV import:', session.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Parse form data using formidable
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const csvFile = Array.isArray(files.csvFile) ? files.csvFile[0] : files.csvFile;
    
    if (!csvFile) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    // Read CSV file
    const csvData = fs.readFileSync(csvFile.filepath, 'utf8');
    console.log('CSV data received, length:', csvData.length);

    // Parse CSV data
    const parseResult = parseCSV(csvData);
    const rows = parseResult.data;
    
    console.log(`Processing ${rows.length} rows from CSV`);

    // Get all teams and seasons for validation
    const teams = await Team.find({}).lean();
    const seasons = await Season.find({}).lean();
    
    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.name.toLowerCase().trim()] = team._id;
    });

    const seasonMap = {};
    seasons.forEach(season => {
      seasonMap[season.name.toLowerCase().trim()] = season._id;
    });

    const activeSeason = seasons.find(s => s.isActive);
    const defaultSeasonId = activeSeason?._id || (seasons.length > 0 ? seasons[0]._id : null);

    if (!defaultSeasonId) {
      return res.status(400).json({ message: 'No seasons found. Please create a season first.' });
    }

    const results = {
      success: 0,
      errors: [],
      created: []
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because CSV starts at row 1 and we skip header

      try {
        // Validate required fields
        if (!row.homeTeam || !row.awayTeam || !row.matchDate) {
          results.errors.push({
            row: rowNum,
            error: 'Missing required fields (homeTeam, awayTeam, matchDate)'
          });
          continue;
        }

        // Find teams
        const homeTeamId = teamMap[row.homeTeam.toLowerCase().trim()];
        const awayTeamId = teamMap[row.awayTeam.toLowerCase().trim()];

        if (!homeTeamId) {
          results.errors.push({
            row: rowNum,
            error: `Home team "${row.homeTeam}" not found`
          });
          continue;
        }

        if (!awayTeamId) {
          results.errors.push({
            row: rowNum,
            error: `Away team "${row.awayTeam}" not found`
          });
          continue;
        }

        if (homeTeamId.toString() === awayTeamId.toString()) {
          results.errors.push({
            row: rowNum,
            error: 'Home and away teams cannot be the same'
          });
          continue;
        }

        // Parse date
        let matchDate;
        try {
          matchDate = new Date(row.matchDate);
          if (isNaN(matchDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (error) {
          results.errors.push({
            row: rowNum,
            error: `Invalid date format: "${row.matchDate}". Use YYYY-MM-DD HH:MM format`
          });
          continue;
        }

        // Find season
        let seasonId = defaultSeasonId;
        if (row.season) {
          const customSeasonId = seasonMap[row.season.toLowerCase().trim()];
          if (customSeasonId) {
            seasonId = customSeasonId;
          }
        }

        // Create match object
        const matchData = {
          homeTeam: homeTeamId,
          awayTeam: awayTeamId,
          matchDate: matchDate,
          season: seasonId,
          venue: row.venue || '',
          round: row.round || 'Regular Season',
          referee: row.referee || '',
          status: 'scheduled'
        };

        // Check for duplicate match
        const existingMatch = await Match.findOne({
          homeTeam: homeTeamId,
          awayTeam: awayTeamId,
          matchDate: {
            $gte: new Date(matchDate.getTime() - 60000), // within 1 minute
            $lte: new Date(matchDate.getTime() + 60000)
          }
        });

        if (existingMatch) {
          results.errors.push({
            row: rowNum,
            error: 'Match already exists with same teams and similar time'
          });
          continue;
        }

        // Create match
        const match = new Match(matchData);
        await match.save();

        results.success++;
        results.created.push({
          row: rowNum,
          match: {
            homeTeam: row.homeTeam,
            awayTeam: row.awayTeam,
            matchDate: matchDate,
            venue: row.venue || 'TBD'
          }
        });

        console.log(`Created match ${results.success}: ${row.homeTeam} vs ${row.awayTeam}`);

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        results.errors.push({
          row: rowNum,
          error: error.message || 'Unknown error'
        });
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(csvFile.filepath);
    } catch (cleanupError) {
      console.warn('Could not delete temp file:', cleanupError);
    }

    console.log('CSV Import Results:', {
      totalRows: rows.length,
      success: results.success,
      errors: results.errors.length
    });

    return res.status(200).json({
      message: `Import completed. Created ${results.success} matches with ${results.errors.length} errors.`,
      results: results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(500).json({ 
      message: 'Import failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
