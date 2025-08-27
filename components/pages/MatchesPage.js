// components/pages/MatchesPage.js - Updated with enhanced CSV import
import React, { useState, useEffect } from 'react';
import MatchForm from '../matches/MatchForm';
import MatchList from '../matches/MatchList';
import ScheduleGenerator from '../matches/ScheduleGenerator';
import LiveMatch from '../matches/LiveMatch';
import { 
  Plus, 
  Calendar, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Printer,
  Filter,
  Shuffle,
  Play,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  FileText,
  Database
} from 'lucide-react';

const MatchesPage = ({ onNavigate, user }) => {
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // View states
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'live', 'schedule-generator'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('');

  // CSV import state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedMatches, setParsedMatches] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Add debugging for view changes
  useEffect(() => {
    console.log('🎮 MatchesPage view changed to:', currentView);
    if (selectedMatch) {
      console.log('🎯 Selected match:', {
        id: selectedMatch._id,
        homeTeam: selectedMatch.homeTeam?.name,
        awayTeam: selectedMatch.awayTeam?.name,
        status: selectedMatch.status,
        isLive: selectedMatch.isLive
      });
    }
  }, [currentView, selectedMatch]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📊 Loading initial data...');
      
      const [matchesRes, leaguesRes, teamsRes] = await Promise.all([
        fetch('/api/matches', { headers: getAuthHeaders() }),
        fetch('/api/leagues', { headers: getAuthHeaders() }),
        fetch('/api/teams', { headers: getAuthHeaders() })
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        const loadedMatches = matchesData.data || [];
        setMatches(loadedMatches);
        console.log('✅ Matches loaded:', loadedMatches.length);
      } else {
        console.error('❌ Failed to load matches:', matchesRes.status);
      }

      if (leaguesRes.ok) {
        const leaguesData = await leaguesRes.json();
        const loadedLeagues = leaguesData.data || [];
        setLeagues(loadedLeagues);
        console.log('✅ Leagues loaded:', loadedLeagues.length);
      } else {
        console.error('❌ Failed to load leagues:', leaguesRes.status);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        const loadedTeams = teamsData.data || [];
        setTeams(loadedTeams);
        console.log('✅ Teams loaded:', loadedTeams.length);
      } else {
        console.error('❌ Failed to load teams:', teamsRes.status);
      }
    } catch (error) {
      console.error('💥 Error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 8000);
    }
  };

  // ENHANCED CSV parsing utility with better date handling
  const parseCSVContent = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('File must contain header row and at least one data row');
    }

    // Parse headers - handle quoted and unquoted CSV properly
    const headerLine = lines[0];
    const headers = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < headerLine.length; i++) {
      const char = headerLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(current.trim().toLowerCase());
        current = '';
      } else {
        current += char;
      }
    }
    headers.push(current.trim().toLowerCase());

    console.log('📋 Detected headers:', headers);

    const matches = [];

    // Enhanced header mapping - supports more variations
    const headerMap = {
      'league': [
        'league', 'league name', 'league_name', 'leaguename',
        'competition', 'tournament'
      ],
      'homeTeam': [
        'home team', 'home_team', 'hometeam', 'home',
        'team 1', 'team1'
      ],
      'awayTeam': [
        'away team', 'away_team', 'awayteam', 'away',
        'team 2', 'team2'
      ],
      'date': [
        'date', 'match date', 'match_date', 'matchdate',
        'match date (yyyy-mm-dd)', 'game date', 'fixture date'
      ],
      'time': [
        'time', 'kickoff time', 'kickoff_time', 'kickofftime',
        'kickoff time (hh:mm)', 'start time'
      ],
      'venue': [
        'venue', 'stadium', 'ground', 'location'
      ],
      'referee': [
        'referee', 'ref', 'official'
      ],
      'round': [
        'round', 'matchday', 'week', 'gameweek'
      ]
    };

    // Find column indices
    const columnIndices = {};
    for (const [key, variants] of Object.entries(headerMap)) {
      const index = headers.findIndex(h => variants.includes(h));
      if (index !== -1) {
        columnIndices[key] = index;
        console.log(`✅ Found ${key} at column ${index}: "${headers[index]}"`);
      }
    }

    // Validate required columns
    const requiredColumns = ['league', 'homeTeam', 'awayTeam', 'date'];
    const missingColumns = requiredColumns.filter(col => columnIndices[col] === undefined);
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}.
Available headers: ${headers.join(', ')}`);
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line properly handling quotes
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length < 4) continue;

      const matchData = {
        league: values[columnIndices.league] || '',
        homeTeam: values[columnIndices.homeTeam] || '',
        awayTeam: values[columnIndices.awayTeam] || '',
        date: values[columnIndices.date] || '',
        time: columnIndices.time !== undefined ? (values[columnIndices.time] || '') : '',
        venue: columnIndices.venue !== undefined ? (values[columnIndices.venue] || '') : '',
        referee: columnIndices.referee !== undefined ? (values[columnIndices.referee] || '') : '',
        round: columnIndices.round !== undefined ? (values[columnIndices.round] || '') : ''
      };

      // 🎯 ENHANCED DATE CONVERSION - Handles multiple formats
      if (matchData.date) {
        const dateStr = matchData.date.trim();
        let convertedDate = '';
        
        // Handle format: D-M-YYYY or DD-MM-YYYY (like "1-12-2025")
        if (dateStr.includes('-') && !dateStr.startsWith('2')) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            convertedDate = `${year}-${month}-${day}`;
          }
        }
        // Handle format: D/M/YYYY or DD/MM/YYYY
        else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            convertedDate = `${year}-${month}-${day}`;
          }
        }
        // Handle format: DD.MM.YYYY
        else if (dateStr.includes('.')) {
          const parts = dateStr.split('.');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            convertedDate = `${year}-${month}-${day}`;
          }
        }
        // Already in YYYY-MM-DD format
        else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split('-');
          convertedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        // Handle US format: MM/DD/YYYY
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            const year = parts[2];
            convertedDate = `${year}-${month}-${day}`;
          }
        }

        if (convertedDate) {
          matchData.date = convertedDate;
          console.log(`📅 Row ${i}: Converted ${dateStr} → ${convertedDate}`);
        } else {
          console.warn(`❌ Row ${i}: Could not convert date: ${dateStr}. Supported formats: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY`);
          continue;
        }
      }

      // Validate we have required data
      if (!matchData.league || !matchData.homeTeam || !matchData.awayTeam || !matchData.date) {
        console.warn(`❌ Row ${i}: Missing required data`, matchData);
        continue;
      }

      matches.push(matchData);
      console.log(`✅ Row ${i}: ${matchData.homeTeam} vs ${matchData.awayTeam} on ${matchData.date}`);
    }

    console.log(`🎯 Total parsed: ${matches.length} matches`);
    return matches;
  };

  // Handle file upload and parsing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📤 Processing file:', file.name);
    setUploadingFile(true);

    try {
      const text = await file.text();
      const parsedData = parseCSVContent(text);
      
      console.log('✅ Parsed matches:', parsedData.length);
      setParsedMatches(parsedData);
      setShowPreview(true);
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('❌ Error parsing file:', error);
      showMessage(`Error parsing file: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Import parsed matches to database
  const importMatchesToDatabase = async () => {
    if (parsedMatches.length === 0) {
      showMessage('No matches to import', 'error');
      return;
    }

    setUploadingFile(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process matches one by one to ensure proper error handling
      for (const matchData of parsedMatches) {
        try {
          // Find league by name
          const league = leagues.find(l => 
            l.name.toLowerCase() === matchData.league.toLowerCase()
          );
          if (!league) {
            console.warn(`League not found: ${matchData.league}`);
            errorCount++;
            continue;
          }

          // Find teams by name
          const homeTeam = teams.find(t => 
            t.name.toLowerCase() === matchData.homeTeam.toLowerCase()
          );
          const awayTeam = teams.find(t => 
            t.name.toLowerCase() === matchData.awayTeam.toLowerCase()
          );

          if (!homeTeam || !awayTeam) {
            console.warn(`Teams not found: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
            errorCount++;
            continue;
          }

          // Create match object
          const newMatch = {
            league: league._id,
            homeTeam: homeTeam._id,
            awayTeam: awayTeam._id,
            matchDate: matchData.date,
            kickoffTime: matchData.time || '15:00',
            venue: matchData.venue || homeTeam.homeGround || '',
            referee: matchData.referee || '',
            round: matchData.round || '',
            status: 'scheduled',
            homeScore: 0,
            awayScore: 0
          };

          // Create match via API
          const response = await fetch('/api/matches', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newMatch)
          });

          if (response.ok) {
            const createdMatch = await response.json();
            setMatches(prev => [createdMatch.data || createdMatch, ...prev]);
            successCount++;
          } else {
            console.error(`Failed to create match: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
            errorCount++;
          }

        } catch (matchError) {
          console.error('Error creating individual match:', matchError);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        showMessage(`Successfully imported ${successCount} matches${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        showMessage('No matches could be imported. Please check your data.', 'error');
      }

      // Reset state
      setParsedMatches([]);
      setShowPreview(false);

    } catch (error) {
      console.error('💥 Error importing matches:', error);
      showMessage('Failed to import matches. Please try again.', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateMatch = () => {
    console.log('📝 Creating new match');
    setSelectedMatch(null);
    setCurrentView('create');
  };

  const handleEditMatch = (match) => {
    console.log('✏️ Editing match:', match._id);
    setSelectedMatch(match);
    setCurrentView('edit');
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }

    console.log('🗑️ Deleting match:', matchId);
    
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setMatches(prev => prev.filter(m => m._id !== matchId));
        showMessage('Match deleted successfully');
        console.log('✅ Match deleted successfully');
      } else {
        const data = await response.json();
        const errorMsg = data.message || 'Failed to delete match';
        showMessage(errorMsg, 'error');
        console.error('❌ Delete failed:', errorMsg);
      }
    } catch (error) {
      console.error('💥 Error deleting match:', error);
      showMessage('Failed to delete match. Please try again.', 'error');
    }
  };

  const handleStartLive = (match) => {
    console.log('🔴 Starting live match:', {
      id: match._id,
      homeTeam: match.homeTeam?.name,
      awayTeam: match.awayTeam?.name,
      status: match.status
    });
    
    if (!match || !match._id) {
      showMessage('Invalid match selected. Cannot start live mode.', 'error');
      return;
    }

    // Validation
    if (!match.homeTeam || !match.awayTeam) {
      showMessage('Match must have both home and away teams assigned.', 'error');
      return;
    }

    if (match.status === 'completed') {
      showMessage('Cannot start a completed match.', 'error');
      return;
    }

    if (match.status === 'cancelled') {
      showMessage('Cannot start a cancelled match.', 'error');
      return;
    }
    
    setSelectedMatch(match);
    setCurrentView('live');
    setError('');
    setSuccess('');
  };

  const handleMatchSuccess = (matchData) => {
    console.log('✅ Match operation successful:', matchData);
    
    if (selectedMatch) {
      // Update existing match
      setMatches(prev => prev.map(m => 
        m._id === matchData._id ? matchData : m
      ));
      showMessage('Match updated successfully');
    } else {
      // Add new match
      setMatches(prev => [matchData, ...prev]);
      showMessage('Match created successfully');
    }
    
    setCurrentView('list');
    setSelectedMatch(null);
  };

  const handleLiveMatchUpdate = (updatedMatch) => {
    console.log('⚽ Live match updated:', {
      id: updatedMatch._id,
      minute: updatedMatch.currentMinute,
      score: `${updatedMatch.homeScore}-${updatedMatch.awayScore}`,
      status: updatedMatch.status
    });
    
    // Update match in the list
    setMatches(prev => prev.map(m => 
      m._id === updatedMatch._id ? updatedMatch : m
    ));
    
    // Update selected match
    setSelectedMatch(updatedMatch);
  };

  const handleLiveMatchEnd = (completedMatch) => {
    console.log('🏁 Live match ended:', {
      id: completedMatch._id,
      finalScore: `${completedMatch.homeScore}-${completedMatch.awayScore}`,
      status: completedMatch.status
    });
    
    // Update match in the list
    setMatches(prev => prev.map(m => 
      m._id === completedMatch._id ? completedMatch : m
    ));
    
    // Update selected match
    setSelectedMatch(completedMatch);
    
    showMessage(`Match completed! Final score: ${completedMatch.homeTeam?.name} ${completedMatch.homeScore} - ${completedMatch.awayScore} ${completedMatch.awayTeam?.name}`);
    
    // Stay in live view to show final results
    // User can manually navigate back
  };

  const handleBackToList = () => {
    console.log('◀️ Navigating back to matches list');
    setCurrentView('list');
    setSelectedMatch(null);
    setError('');
    setSuccess('');
  };

  const handleScheduleGenerate = async (scheduleData) => {
    console.log('📅 Generating schedule:', scheduleData);
    
    try {
      const response = await fetch('/api/matches/generate-schedule', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newMatches = data.data || [];
        setMatches(prev => [...newMatches, ...prev]);
        showMessage(`Successfully generated ${newMatches.length} matches`);
        setCurrentView('list');
        console.log('✅ Schedule generated:', newMatches.length, 'matches');
      } else {
        const errorMsg = data.message || 'Failed to generate schedule';
        showMessage(errorMsg, 'error');
        console.error('❌ Schedule generation failed:', errorMsg);
      }
    } catch (error) {
      console.error('💥 Error generating schedule:', error);
      showMessage('Failed to generate schedule. Please try again.', 'error');
    }
  };

  // UPDATED Template Download with multiple date format examples
  const downloadExcelTemplate = () => {
    const template = [
      ['League Name', 'Home Team', 'Away Team', 'Match Date (YYYY-MM-DD)', 'Kickoff Time (HH:MM)', 'Venue', 'Referee', 'Round'],
      ['Premier League', 'Arsenal', 'Chelsea', '2024-12-01', '15:00', 'Emirates Stadium', 'John Doe', '1'],
      ['Premier League', 'Liverpool', 'Manchester United', '02/12/2024', '17:30', 'Anfield', 'Jane Smith', '1'],
      ['Championship', 'Leeds United', 'Norwich City', '3-12-2024', '14:00', 'Elland Road', 'Mike Johnson', '1'],
      ['La Liga', 'Barcelona', 'Real Madrid', '04.12.2024', '20:00', 'Camp Nou', 'Carlos Lopez', '1']
    ];

    const csvContent = template.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'match_schedule_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showMessage('CSV template downloaded successfully');
  };

  // Print Schedule as PDF
  const printSchedule = () => {
    const filteredMatches = selectedLeague 
      ? matches.filter(m => m.league?._id === selectedLeague || m.league === selectedLeague)
      : matches;

    if (filteredMatches.length === 0) {
      showMessage('No matches to print', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    const leagueName = selectedLeague 
      ? leagues.find(l => l._id === selectedLeague)?.name || 'League'
      : 'All Leagues';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Match Schedule - ${leagueName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin-bottom: 5px; }
            .header p { color: #6b7280; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f9fafb; font-weight: 600; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status-scheduled { background-color: #dbeafe; color: #1e40af; }
            .status-live { background-color: #fef2f2; color: #dc2626; }
            .status-completed { background-color: #f0fdf4; color: #16a34a; }
            .status-postponed { background-color: #fefce8; color: #ca8a04; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Match Schedule</h1>
            <p>${leagueName}</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Home Team</th>
                <th>Away Team</th>
                <th>Venue</th>
                <th>Round</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMatches
                .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))
                .map(match => `
                  <tr>
                    <td>${new Date(match.matchDate).toLocaleDateString()}</td>
                    <td>${match.kickoffTime || 'TBD'}</td>
                    <td>${match.homeTeam?.name || 'TBD'}</td>
                    <td>${match.awayTeam?.name || 'TBD'}</td>
                    <td>${match.venue || 'TBD'}</td>
                    <td>${match.round || '-'}</td>
                    <td><span class="status status-${match.status}">${match.status.toUpperCase()}</span></td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total Matches: ${filteredMatches.length}</p>
            <p>League Manager System - Match Schedule Report</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const renderView = () => {
    switch (currentView) {
      case 'create':
      case 'edit':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToList}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Matches</span>
              </button>
              <h2 className="text-2xl font-bold">
                {currentView === 'create' ? 'Create New Match' : 'Edit Match'}
              </h2>
            </div>
            
            <MatchForm
              match={selectedMatch}
              onSuccess={handleMatchSuccess}
              onCancel={handleBackToList}
              leagues={leagues}
              teams={teams}
            />
          </div>
        );

      case 'schedule-generator':
        return (
          <ScheduleGenerator
            league={leagues.find(l => l._id === selectedLeague)}
            teams={teams.filter(t => 
              t.leagues && t.leagues.some(l => 
                (typeof l === 'string' ? l : l._id) === selectedLeague
              )
            )}
            onGenerate={handleScheduleGenerate}
            onClose={handleBackToList}
            loading={loading}
          />
        );

      case 'live':
        if (!selectedMatch) {
          console.log('❌ No selected match for live view, returning to list');
          setCurrentView('list');
          return (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Match Selected</h3>
              <p className="text-gray-500 mb-4">Please select a match to start live mode.</p>
              <button 
                onClick={handleBackToList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Matches
              </button>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Matches</span>
                </button>
                <div>
                  <h2 className="text-2xl font-bold">Live Match</h2>
                  <p className="text-gray-600">
                    {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Match ID: {selectedMatch._id}
              </div>
            </div>
            
            <LiveMatch
              match={selectedMatch}
              onUpdate={handleLiveMatchUpdate}
              onEnd={handleLiveMatchEnd}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Header and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Matches</h1>
                <p className="text-gray-600 mt-1">Manage and schedule matches</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Leagues</option>
                  {leagues.map(league => (
                    <option key={league._id} value={league._id}>{league.name}</option>
                  ))}
                </select>

                <button
                  onClick={downloadExcelTemplate}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Template</span>
                </button>

                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-1 text-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import CSV</span>
                </button>

                <button
                  onClick={printSchedule}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-1 text-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print PDF</span>
                </button>

                <button
                  onClick={() => setCurrentView('schedule-generator')}
                  disabled={!selectedLeague}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Generate</span>
                </button>

                <button
                  onClick={handleCreateMatch}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Match</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Schedule Generator Helper */}
            {selectedLeague && matches.filter(m => m.league?._id === selectedLeague).length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">No matches scheduled</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Get started by generating a complete schedule for {leagues.find(l => l._id === selectedLeague)?.name}
                </p>
                <button
                  onClick={() => setCurrentView('schedule-generator')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Generate Schedule</span>
                </button>
              </div>
            )}

            {/* Matches List */}
            <MatchList
              matches={selectedLeague 
                ? matches.filter(m => m.league?._id === selectedLeague || m.league === selectedLeague)
                : matches
              }
              onSelectMatch={(match) => {
                console.log('👁️ View match details clicked:', match._id);
                // Navigate to a match details view (implement this route in main app)
                if (onNavigate) {
                  onNavigate('match-details', match._id);
                }
              }}
              onEdit={handleEditMatch}
              onDelete={handleDeleteMatch}
              onStartLive={handleStartLive}
              loading={loading}
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {renderView()}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Matches from CSV</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload CSV file</p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Required columns:</p>
                <ul className="text-xs space-y-1">
                  <li>• League Name</li>
                  <li>• Home Team, Away Team</li>
                  <li>• Match Date (Multiple formats supported)</li>
                  <li>• Kickoff Time (HH:MM)</li>
                  <li>• Venue, Referee, Round (optional)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-xs">
                  💡 <strong>Supported date formats:</strong> DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY. 
                  Download the template to see examples.
                </p>
              </div>

              {uploadingFile && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Processing file...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && parsedMatches.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Preview Import ({parsedMatches.length} matches)
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="overflow-auto max-h-64 border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">League</th>
                      <th className="px-4 py-2 text-left">Home Team</th>
                      <th className="px-4 py-2 text-left">Away Team</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedMatches.slice(0, 10).map((match, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{match.league}</td>
                        <td className="px-4 py-2">{match.homeTeam}</td>
                        <td className="px-4 py-2">{match.awayTeam}</td>
                        <td className="px-4 py-2">{match.date}</td>
                        <td className="px-4 py-2">{match.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedMatches.length > 10 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    ... and {parsedMatches.length - 10} more matches
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={importMatchesToDatabase}
                  disabled={uploadingFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploadingFile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      <span>Import {parsedMatches.length} Matches</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;