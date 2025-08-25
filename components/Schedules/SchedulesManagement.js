import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, FileUp, Calendar, Clock, MapPin, Edit, Trash2, Play, X, Save, Search, Filter, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';
import * as XLSX from 'xlsx';

const SchedulesManagement = ({ showNotification, currentSeason, setCurrentView }) => {
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showGenerator, setShowGenerator] = useState(false);
  const [showEditMatch, setShowEditMatch] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterVenue, setFilterVenue] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { apiCall, loading } = useAPI();
  const fileInputRef = useRef();

  useEffect(() => {
    loadData();
  }, [currentSeason]);

  const loadData = async () => {
    try {
      const schedulesData = JSON.parse(localStorage.getItem(`schedules_${currentSeason.id}`) || '[]');
      const teamsData = JSON.parse(localStorage.getItem(`teams_${currentSeason.id}`) || '[]');
      
      setSchedules(schedulesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showNotification?.('error', 'Failed to load schedules data');
    }
  };

  // ... (keep all existing functions: generateSchedule, generateRoundRobinPairs, updateMatch, deleteMatch, importFromFile) ...

  const exportTemplate = () => {
    try {
      // Create CSV template with headers and sample data
      const headers = ['Home Team', 'Away Team', 'Date', 'Time', 'Venue', 'Round', 'Referee', 'Notes'];
      
      // Sample data to show format
      const sampleData = [
        ['Team A', 'Team B', '2025-02-01', '19:00', 'Stadium 1', '1', 'John Doe', 'Opening match'],
        ['Team C', 'Team D', '2025-02-03', '20:00', 'Stadium 2', '1', 'Jane Smith', 'Round 1 match'],
        ['Team A', 'Team C', '2025-02-05', '19:30', 'Stadium 1', '2', '', '']
      ];

      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add instructions as comments (will be ignored during import)
      csvContent += '# INSTRUCTIONS:\n';
      csvContent += '# 1. Fill in your match details below\n';
      csvContent += '# 2. Date format: YYYY-MM-DD (e.g., 2025-02-01)\n';
      csvContent += '# 3. Time format: HH:MM (e.g., 19:00 for 7:00 PM)\n';
      csvContent += '# 4. Delete the sample rows and add your own\n';
      csvContent += '# 5. Available teams: ' + teams.map(t => t.name).join(', ') + '\n';
      csvContent += '#\n';
      csvContent += '# SAMPLE DATA (replace with your matches):\n';
      
      // Add sample data
      sampleData.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-template-${currentSeason.name.replace('/', '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification?.('success', 'Template downloaded successfully! Fill it out and import it back.');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Template export error:', error);
      showNotification?.('error', 'Failed to export template');
    }
  };

  const exportCurrentSchedule = () => {
    try {
      if (schedules.length === 0) {
        showNotification?.('warning', 'No matches to export');
        return;
      }

      // Export current matches to CSV
      const headers = ['Home Team', 'Away Team', 'Date', 'Time', 'Venue', 'Round', 'Status', 'Home Score', 'Away Score', 'Referee', 'Notes'];
      
      let csvContent = headers.join(',') + '\n';
      
      schedules
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(match => {
          const matchDate = new Date(match.date);
          const row = [
            match.homeTeam || '',
            match.awayTeam || '',
            matchDate.toISOString().split('T')[0], // Date
            matchDate.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'}), // Time
            match.venue || '',
            match.round || '',
            match.status || 'scheduled',
            match.homeScore !== null ? match.homeScore : '',
            match.awayScore !== null ? match.awayScore : '',
            match.referee || '',
            match.notes || ''
          ];
          csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-${currentSeason.name.replace('/', '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification?.('success', 'Schedule exported successfully!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      showNotification?.('error', 'Failed to export schedule');
    }
  };

  // Keep all existing functions but update the generateSchedule function to include the new structure
  const generateSchedule = async (params) => {
    try {
      if (teams.length < 2) {
        showNotification?.('error', 'Need at least 2 teams to generate schedule');
        return;
      }

      const { startDate, rounds, venue, matchTime, daysBetween } = params;
      const newSchedules = [];
      let currentDate = new Date(startDate);

      // Create round-robin schedule
      for (let round = 1; round <= rounds; round++) {
        // Create matches for each round
        const teamPairs = generateRoundRobinPairs(teams, round);
        
        for (let pairIndex = 0; pairIndex < teamPairs.length; pairIndex++) {
          const [homeTeam, awayTeam] = teamPairs[pairIndex];
          
          const matchDate = new Date(currentDate);
          const [hours, minutes] = matchTime.split(':');
          matchDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          newSchedules.push({
            id: Date.now() + Math.random(),
            homeTeam: homeTeam.name,
            homeTeamId: homeTeam.id,
            awayTeam: awayTeam.name,
            awayTeamId: awayTeam.id,
            date: matchDate.toISOString(),
            venue: venue || 'TBD',
            status: 'scheduled',
            season: currentSeason.id,
            round: round,
            homeScore: null,
            awayScore: null,
            referee: '',
            notes: ''
          });

          // Move to next match day for this round
          currentDate.setDate(currentDate.getDate() + (daysBetween || 1));
        }
        
        // Add extra gap between rounds
        currentDate.setDate(currentDate.getDate() + 2);
      }

      // Save generated schedules
      const updatedSchedules = [...schedules, ...newSchedules];
      setSchedules(updatedSchedules);
      localStorage.setItem(`schedules_${currentSeason.id}`, JSON.stringify(updatedSchedules));
      
      showNotification?.('success', `Generated ${newSchedules.length} matches for ${rounds} round(s)`);
      setShowGenerator(false);
    } catch (error) {
      console.error('Error generating schedule:', error);
      showNotification?.('error', 'Failed to generate schedule');
    }
  };

  const generateRoundRobinPairs = (teams, round) => {
    const pairs = [];
    const teamsCopy = [...teams];
    
    // Simple round-robin algorithm
    for (let i = 0; i < teamsCopy.length; i++) {
      for (let j = i + 1; j < teamsCopy.length; j++) {
        // Alternate home/away based on round
        if ((round + i + j) % 2 === 0) {
          pairs.push([teamsCopy[i], teamsCopy[j]]);
        } else {
          pairs.push([teamsCopy[j], teamsCopy[i]]);
        }
      }
    }
    
    return pairs;
  };

  const updateMatch = async (matchData) => {
    try {
      const updatedSchedules = schedules.map(match => 
        match.id === selectedMatch.id ? { ...match, ...matchData } : match
      );
      
      setSchedules(updatedSchedules);
      localStorage.setItem(`schedules_${currentSeason.id}`, JSON.stringify(updatedSchedules));
      
      showNotification?.('success', 'Match updated successfully');
      setShowEditMatch(false);
      setSelectedMatch(null);
    } catch (error) {
      console.error('Error updating match:', error);
      showNotification?.('error', 'Failed to update match');
    }
  };

  const deleteMatch = async (matchId) => {
    try {
      const updatedSchedules = schedules.filter(match => match.id !== matchId);
      setSchedules(updatedSchedules);
      localStorage.setItem(`schedules_${currentSeason.id}`, JSON.stringify(updatedSchedules));
      
      showNotification?.('success', 'Match deleted successfully');
    } catch (error) {
      console.error('Error deleting match:', error);
      showNotification?.('error', 'Failed to delete match');
    }
  };

  const importFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = e.target.result;
          const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim()); // Filter out comments and empty lines
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index];
              });
              data.push(row);
            }
          }
        } else {
          // Parse Excel
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet);
        }
        
        const importedSchedules = data.map(row => {
          // Parse date and time
          const dateStr = row['Date'] || row.date || row['Date'] || '';
          const timeStr = row['Time'] || row.time || row['Time'] || '19:00';
          
          let matchDate;
          if (dateStr) {
            matchDate = new Date(dateStr);
            const [hours, minutes] = timeStr.split(':');
            matchDate.setHours(parseInt(hours) || 19, parseInt(minutes) || 0, 0, 0);
          } else {
            matchDate = new Date();
          }

          return {
            id: Date.now() + Math.random(),
            homeTeam: row['Home Team'] || row.homeTeam || row['Home'] || '',
            awayTeam: row['Away Team'] || row.awayTeam || row['Away'] || '',
            date: matchDate.toISOString(),
            venue: row['Venue'] || row.venue || 'TBD',
            status: row['Status'] || row.status || 'scheduled',
            season: currentSeason.id,
            round: parseInt(row['Round'] || row.round) || 1,
            homeScore: row['Home Score'] || row.homeScore || null,
            awayScore: row['Away Score'] || row.awayScore || null,
            referee: row['Referee'] || row.referee || '',
            notes: row['Notes'] || row.notes || ''
          };
        }).filter(match => match.homeTeam && match.awayTeam);
        
        if (importedSchedules.length > 0) {
          const updatedSchedules = [...schedules, ...importedSchedules];
          setSchedules(updatedSchedules);
          localStorage.setItem(`schedules_${currentSeason.id}`, JSON.stringify(updatedSchedules));
          showNotification?.('success', `Imported ${importedSchedules.length} matches successfully!`);
        } else {
          showNotification?.('error', 'No valid matches found in file');
        }
      } catch (error) {
        console.error('Import error:', error);
        showNotification?.('error', 'Failed to import file. Please check the format.');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // Keep all other existing functions and components...
  const filteredSchedules = schedules.filter(match => {
    const matchDate = new Date(match.date);
    const now = new Date();
    
    // Tab filtering
    let matchesTab = true;
    switch (activeTab) {
      case 'upcoming':
        matchesTab = matchDate >= now && match.status !== 'completed';
        break;
      case 'live':
        matchesTab = match.status === 'live';
        break;
      case 'completed':
        matchesTab = match.status === 'completed';
        break;
      case 'past':
        matchesTab = matchDate < now && match.status !== 'live';
        break;
      default:
        matchesTab = true;
    }
    
    // Search filtering
    const matchesSearch = !searchTerm || 
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (match.venue && match.venue.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Team filtering
    const matchesTeam = filterTeam === 'all' || 
      match.homeTeam === filterTeam || 
      match.awayTeam === filterTeam;
    
    // Venue filtering
    const matchesVenue = filterVenue === 'all' || match.venue === filterVenue;
    
    return matchesTab && matchesSearch && matchesTeam && matchesVenue;
  });

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', count: schedules.filter(s => new Date(s.date) >= new Date() && s.status !== 'completed').length },
    { key: 'live', label: 'Live', count: schedules.filter(s => s.status === 'live').length },
    { key: 'completed', label: 'Completed', count: schedules.filter(s => s.status === 'completed').length },
    { key: 'all', label: 'All Matches', count: schedules.length }
  ];

  const venues = [...new Set(schedules.map(s => s.venue).filter(v => v))];
  const teamNames = teams.map(t => t.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
            <p className="text-gray-600">Season {currentSeason.name} • {schedules.length} matches</p>
          </div>
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files[0] && importFromFile(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
            >
              <FileUp size={16} />
              <span>Import</span>
            </button>
            
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700 transition-colors"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[200px]">
                  <button
                    onClick={exportTemplate}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileText size={14} />
                    <span>Download Template</span>
                  </button>
                  <button
                    onClick={exportCurrentSchedule}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    disabled={schedules.length === 0}
                  >
                    <Download size={14} />
                    <span>Export Current Schedule</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCurrentView('live')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
            >
              <Play size={16} />
              <span>Live Matches</span>
            </button>
            <button
              onClick={() => setShowGenerator(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Generate Schedule</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {tabs.map(tab => (
            <div key={tab.key} className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{tab.count}</div>
              <div className="text-sm text-gray-600">{tab.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search matches..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Teams</option>
            {teamNames.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <select
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Venues</option>
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
        </div>

        {/* Click outside to close export menu */}
        {showExportMenu && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowExportMenu(false)}
          ></div>
        )}
      </div>

      {/* Rest of the component remains the same... */}
      {/* Matches List, Modals, etc. */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading matches...</p>
          </div>
        ) : filteredSchedules.length > 0 ? (
          <div className="space-y-4">
            {filteredSchedules
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onEdit={(match) => {
                    setSelectedMatch(match);
                    setShowEditMatch(true);
                  }}
                  onDelete={deleteMatch}
                  onStartLive={() => setCurrentView('live')}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterTeam !== 'all' || filterVenue !== 'all'
                ? 'No matches found'
                : 'No matches scheduled'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterTeam !== 'all' || filterVenue !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Generate a schedule or import matches to get started'}
            </p>
            {!searchTerm && filterTeam === 'all' && filterVenue === 'all' && (
              <button
                onClick={() => setShowGenerator(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Schedule
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showGenerator && (
        <ScheduleGenerator
          teams={teams}
          onClose={() => setShowGenerator(false)}
          onGenerate={generateSchedule}
        />
      )}

      {showEditMatch && selectedMatch && (
        <MatchEditor
          match={selectedMatch}
          teams={teams}
          onClose={() => {
            setShowEditMatch(false);
            setSelectedMatch(null);
          }}
          onSave={updateMatch}
        />
      )}
    </div>
  );
};

// Keep all existing components (MatchCard, ScheduleGenerator, MatchEditor) unchanged...
const MatchCard = ({ match, onEdit, onDelete, onStartLive }) => {
  const matchDate = new Date(match.date);
  const isUpcoming = matchDate >= new Date() && match.status !== 'completed';
  const isToday = matchDate.toDateString() === new Date().toDateString();

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const getMatchResult = () => {
    if (match.status === 'completed' && match.homeScore !== null && match.awayScore !== null) {
      return `${match.homeScore} - ${match.awayScore}`;
    }
    return null;
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${
      match.status === 'live' ? 'border-red-500 bg-red-50' : 
      isToday && isUpcoming ? 'border-blue-500 bg-blue-50' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-lg text-gray-900">
                {match.homeTeam} vs {match.awayTeam}
              </h3>
              {match.status === 'live' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 text-sm font-medium">LIVE</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[match.status] || statusColors.scheduled
              }`}>
                {match.status === 'scheduled' ? 'Scheduled' :
                 match.status === 'live' ? 'Live' :
                 match.status === 'completed' ? 'Completed' : 'Cancelled'}
              </span>
              {getMatchResult() && (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-bold">
                  {getMatchResult()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{matchDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            {match.venue && (
              <div className="flex items-center space-x-1">
                <MapPin size={14} />
                <span>{match.venue}</span>
              </div>
            )}
            {match.round && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                Round {match.round}
              </span>
            )}
          </div>

          {match.referee && (
            <div className="mt-2 text-sm text-gray-600">
              <span>Referee: {match.referee}</span>
            </div>
          )}

          {match.notes && (
            <div className="mt-2 text-sm text-gray-600">
              <span>{match.notes}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {isUpcoming && isToday && match.status === 'scheduled' && (
            <button
              onClick={onStartLive}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <Play size={14} />
              <span>Go Live</span>
            </button>
          )}
          {isUpcoming && (
            <button
              onClick={() => onEdit(match)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this match?')) {
                onDelete(match.id);
              }
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Keep other components unchanged...
const ScheduleGenerator = ({ teams, onClose, onGenerate }) => {
  const [params, setParams] = useState({
    startDate: new Date().toISOString().split('T')[0],
    rounds: 1,
    venue: '',
    matchTime: '19:00',
    daysBetween: 3
  });

  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const newWarnings = [];
    
    if (teams.length < 2) {
      newWarnings.push('Need at least 2 teams to generate schedule');
    }
    
    if (teams.length > 0) {
      const totalMatches = Math.floor(teams.length / 2) * params.rounds;
      if (totalMatches > 50) {
        newWarnings.push(`This will generate ${totalMatches} matches. Consider reducing rounds.`);
      }
    }
    
    setWarnings(newWarnings);
  }, [teams, params.rounds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (warnings.length === 0) {
      onGenerate(params);
    }
  };

  const estimatedMatches = teams.length >= 2 ? Math.floor(teams.length * (teams.length - 1) / 2) * params.rounds : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Generate Schedule</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {warnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle size={16} className="text-yellow-600" />
              <span className="text-yellow-800 font-medium">Warning</span>
            </div>
            <ul className="text-yellow-700 text-sm space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={params.startDate}
              onChange={(e) => setParams({...params, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rounds</label>
              <input
                type="number"
                min="1"
                max="5"
                value={params.rounds}
                onChange={(e) => setParams({...params, rounds: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Between Matches</label>
              <input
                type="number"
                min="1"
                max="14"
                value={params.daysBetween}
                onChange={(e) => setParams({...params, daysBetween: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Venue</label>
            <input
              type="text"
              value={params.venue}
              onChange={(e) => setParams({...params, venue: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter venue name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Match Time</label>
            <input
              type="time"
              value={params.matchTime}
              onChange={(e) => setParams({...params, matchTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Generation Summary</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Available Teams:</span>
                <span className="font-medium">{teams.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Matches:</span>
                <span className="font-medium">{estimatedMatches}</span>
              </div>
              <div className="flex justify-between">
                <span>Tournament Duration:</span>
                <span className="font-medium">
                  ~{Math.ceil(estimatedMatches * params.daysBetween / 7)} weeks
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={warnings.length > 0}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Generate Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MatchEditor = ({ match, teams, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    date: new Date(match.date).toISOString().slice(0, 16),
    venue: match.venue || '',
    referee: match.referee || '',
    notes: match.notes || '',
    status: match.status || 'scheduled'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find team IDs
    const homeTeamObj = teams.find(t => t.name === formData.homeTeam);
    const awayTeamObj = teams.find(t => t.name === formData.awayTeam);
    
    onSave({
      ...formData,
      homeTeamId: homeTeamObj?.id || match.homeTeamId,
      awayTeamId: awayTeamObj?.id || match.awayTeamId,
      date: new Date(formData.date).toISOString()
    });
  };

  const availableTeams = teams.map(t => t.name);
  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'live', label: 'Live' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Match</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
              <select
                value={formData.homeTeam}
                onChange={(e) => setFormData({...formData, homeTeam: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {availableTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
              <select
                value={formData.awayTeam}
                onChange={(e) => setFormData({...formData, awayTeam: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {availableTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({...formData, venue: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Match venue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referee</label>
            <input
              type="text"
              value={formData.referee}
              onChange={(e) => setFormData({...formData, referee: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Referee name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
            >
              <Save size={16} />
              <span>Update Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulesManagement;