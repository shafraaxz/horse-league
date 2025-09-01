// ===========================================
// FILE: pages/api/schedule-pdf.js (FIXED - NO JSPDF)
// ===========================================
import connectDB from '../../lib/mongodb';
import Match from '../../models/Match';
import Season from '../../models/Season';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  try {
    await connectDB();
    
    const { seasonId } = req.query;
    
    if (!seasonId) {
      return res.status(400).json({ message: 'Season ID is required' });
    }

    // Get matches for the season
    const matches = await Match.find({ season: seasonId })
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .populate('season', 'name')
      .sort({ matchDate: 1 })
      .lean();

    const season = await Season.findById(seasonId).lean();
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Generate HTML content for PDF-like styling
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${season.name} - Match Schedule</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #1f2937;
        }
        .header h2 {
            margin: 10px 0 0 0;
            font-size: 18px;
            color: #6b7280;
            font-weight: normal;
        }
        .match-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .match-table th,
        .match-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .match-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #1f2937;
        }
        .match-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .match-table tr:hover {
            background-color: #e5e7eb;
        }
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-scheduled {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-live {
            background-color: #fee2e2;
            color: #dc2626;
        }
        .status-completed {
            background-color: #dcfce7;
            color: #16a34a;
        }
        .status-postponed {
            background-color: #fef3c7;
            color: #d97706;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .match-table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Horse Futsal Tournament</h1>
        <h2>${season.name} - Match Schedule</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <table class="match-table">
        <thead>
            <tr>
                <th style="width: 15%;">Date & Time</th>
                <th style="width: 35%;">Match</th>
                <th style="width: 15%;">Venue</th>
                <th style="width: 15%;">Round</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 10%;">Score</th>
            </tr>
        </thead>
        <tbody>
            ${matches.map(match => {
              const matchDate = new Date(match.matchDate);
              const dateStr = matchDate.toLocaleDateString();
              const timeStr = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              let statusClass = 'status-scheduled';
              switch (match.status) {
                case 'live': statusClass = 'status-live'; break;
                case 'completed': statusClass = 'status-completed'; break;
                case 'postponed': statusClass = 'status-postponed'; break;
              }
              
              const score = (match.status === 'completed' || match.status === 'live') 
                ? `${match.homeScore || 0} - ${match.awayScore || 0}` 
                : '-';
              
              return `
                <tr>
                    <td>
                        <strong>${dateStr}</strong><br>
                        <small>${timeStr}</small>
                    </td>
                    <td>
                        <strong>${match.homeTeam?.name || 'TBD'}</strong> vs <strong>${match.awayTeam?.name || 'TBD'}</strong>
                    </td>
                    <td>${match.venue || 'TBD'}</td>
                    <td>${match.round || 'Regular'}</td>
                    <td>
                        <span class="status ${statusClass}">
                            ${match.status?.charAt(0).toUpperCase() + match.status?.slice(1) || 'Scheduled'}
                        </span>
                    </td>
                    <td><strong>${score}</strong></td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>Total Matches: ${matches.length}</p>
        <p>This schedule is subject to change. Check the website for latest updates.</p>
        <p>Horse Futsal Tournament Management System</p>
    </div>
</body>
</html>`;

    // Set headers to return HTML that can be printed as PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${season.name.replace(/[^a-zA-Z0-9]/g, '_')}_schedule.html"`);
    
    return res.status(200).send(htmlContent);

  } catch (error) {
    console.error('Schedule PDF error:', error);
    return res.status(500).json({ 
      message: 'Failed to generate schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
