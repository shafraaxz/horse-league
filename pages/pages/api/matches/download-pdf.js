// pages/api/matches/download-pdf.js - FIXED (No React imports)
import connectDB from '../../../lib/mongodb';
import { Match, Team, League } from '../../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📄 Starting PDF generation...');
    await connectDB();

    const { leagueId } = req.query;

    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    // Load data using Promise.all for speed
    const [league, matches, teams] = await Promise.all([
      League.findById(leagueId).lean(),
      Match.find({ league: leagueId })
        .populate('homeTeam awayTeam', 'name')
        .sort({ round: 1, date: 1, time: 1 })
        .lean(),
      Team.find({ league: leagueId }).lean()
    ]);

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    console.log(`📊 Loaded ${matches.length} matches for PDF`);

    // Generate HTML content
    const htmlContent = generatePDFHTML(league, matches, teams);

    // Set proper headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('✅ PDF HTML generated successfully');
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

function generatePDFHTML(league, matches, teams) {
  const currentDate = new Date().toLocaleDateString();
  const totalRounds = matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0;
  
  // Group matches by round
  const matchesByRound = {};
  matches.forEach(match => {
    const round = match.round || 1;
    if (!matchesByRound[round]) matchesByRound[round] = [];
    matchesByRound[round].push(match);
  });

  const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${league.name} - Schedule</title>
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
            color: #1e40af; 
            font-size: 24px; 
            margin: 0 0 10px 0;
        }
        .summary { 
            display: flex; 
            justify-content: space-around; 
            margin: 20px 0; 
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
        }
        .summary div { 
            text-align: center; 
        }
        .summary .number { 
            font-size: 20px; 
            font-weight: bold; 
            color: #1e40af;
        }
        .summary .label { 
            font-size: 12px; 
            color: #666;
        }
        .round { 
            margin: 20px 0; 
            page-break-inside: avoid;
        }
        .round-title { 
            background: #1e40af; 
            color: white; 
            padding: 8px 15px; 
            font-weight: bold;
            margin-bottom: 10px;
        }
        .matches { 
            border: 1px solid #ddd;
        }
        .match { 
            padding: 10px 15px; 
            border-bottom: 1px solid #eee; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .match:last-child { 
            border-bottom: none; 
        }
        .match:nth-child(even) { 
            background: #f9f9f9; 
        }
        .teams { 
            font-weight: bold; 
            flex: 1;
        }
        .vs { 
            color: #666; 
            margin: 0 10px;
        }
        .details { 
            font-size: 12px; 
            color: #666;
            text-align: right;
        }
        .venue { 
            color: #059669; 
            font-size: 11px;
        }
        .manadhoo { 
            background: #fef3c7; 
            color: #92400e; 
            padding: 2px 6px; 
            border-radius: 3px;
        }
        @media print {
            body { margin: 15px; }
            .round { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 ${league.name}</h1>
        <div>Complete Match Schedule</div>
        <div style="font-size: 12px; color: #666;">Generated on ${currentDate}</div>
    </div>
    
    <div class="summary">
        <div>
            <div class="number">${teams.length}</div>
            <div class="label">Teams</div>
        </div>
        <div>
            <div class="number">${matches.length}</div>
            <div class="label">Matches</div>
        </div>
        <div>
            <div class="number">${totalRounds}</div>
            <div class="label">Rounds</div>
        </div>
        <div>
            <div class="number">${matches.filter(m => m.venue?.toLowerCase().includes('manadhoo')).length}</div>
            <div class="label">At Manadhoo</div>
        </div>
    </div>

    ${rounds.map(round => `
        <div class="round">
            <div class="round-title">Round ${round} (${matchesByRound[round].length} matches)</div>
            <div class="matches">
                ${matchesByRound[round].map(match => `
                    <div class="match">
                        <div class="teams">
                            ${match.homeTeam?.name || 'TBD'}
                            <span class="vs">vs</span>
                            ${match.awayTeam?.name || 'TBD'}
                            ${match.status === 'finished' ? 
                                `<br><small style="color: #666;">${match.score?.home || 0} - ${match.score?.away || 0}</small>` 
                                : ''
                            }
                        </div>
                        <div class="details">
                            <div>${match.date} • ${match.time}</div>
                            <div class="venue ${match.venue?.toLowerCase().includes('manadhoo') ? 'manadhoo' : ''}">
                                ${match.venue?.toLowerCase().includes('manadhoo') ? 
                                    `🏟️ ${match.venue}` : 
                                    (match.venue || 'TBD')
                                }
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}
    
    <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
        🏆 ${league.name} • ${matches.length} matches across ${totalRounds} rounds<br>
        📅 Generated ${currentDate} • ⚽ Football Manager System
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 1000);
        };
    </script>
</body>
</html>`;
}