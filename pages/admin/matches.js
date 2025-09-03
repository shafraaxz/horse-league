// ===========================================
// FILE: pages/admin/matches.js (COMPLETE INTEGRATED VERSION)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Calendar, Play, Upload, FileDown, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// ===========================================
// DATE HELPER FUNCTIONS
// ===========================================

/**
 * Formats a date string/Date object to datetime-local input format
 * Preserves the actual date/time without timezone conversion
 */
const formatToLocalDateTime = (dateInput) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Converts datetime-local input value to ISO string for backend
 * Preserves the local time (doesn't apply timezone offset)
 */
const parseLocalDateTimeToISO = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return null;
  
  // Create date from the local datetime string
  // This treats the input as local time, not UTC
  const date = new Date(datetimeLocalValue);
  return date.toISOString();
};

/**
 * Format date for display in tables
 */
const formatDisplayDate = (dateInput) => {
  if (!dateInput) return 'No Date';
  try {
    return format(new Date(dateInput), 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format time for display in tables
 */
const formatDisplayTime = (dateInput) => {
  if (!dateInput) return '';
  try {
    return format(new Date(dateInput), 'HH:mm');
  } catch (error) {
    return 'Invalid Time';
  }
};

/**
 * Enhanced date validation based on match status
 */
const validateMatchDate = (dateInput, status = 'scheduled') => {
  if (!dateInput) return { isValid: false, error: 'Match date is required' };
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return { isValid: false, error: 'Invalid date format' };
  
  const now = new Date();
  const timeDifference = date.getTime() - now.getTime();
  const hoursDifference = Math.abs(timeDifference) / (1000 * 60 * 60);
  
  switch (status) {
    case 'scheduled':
      if (date < now) {
        return { isValid: false, error: 'Scheduled match date cannot be in the past' };
      }
      break;
    case 'live':
      if (hoursDifference > 24) {
        return { isValid: false, error: 'Live match date should be within 24 hours of current time' };
      }
      break;
    case 'completed':
      // Completed matches can be in the past, but not too far in the future
      if (timeDifference > 24 * 60 * 60 * 1000) {
        return { isValid: false, error: 'Completed match date cannot be more than 24 hours in the future' };
      }
      break;
    case 'postponed':
    case 'cancelled':
      // These can have any reasonable date
      break;
  }
  
  return { isValid: true, error: null };
};

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function AdminMatches() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchSeasons();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedSeason) {
      fetchTeams();
      fetchMatches();
    }
  }, [selectedSeason, statusFilter]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/admin/seasons');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSeasons(data);
        
        const activeSeason = data.find(s => s.isActive);
        if (activeSeason) {
          setSelectedSeason(activeSeason._id);
        } else if (data.length > 0) {
          setSelectedSeason(data[0]._id);
        }
      } else {
        console.error('Seasons data is not an array:', data);
        setSeasons([]);
        toast.error(data.message || 'Failed to fetch seasons');
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setSeasons([]);
      toast.error('Failed to fetch seasons');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/admin/teams?seasonId=${selectedSeason}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        console.error('Teams data is not an array:', data);
        setTeams([]);
        toast.error(data.message || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
      toast.error('Failed to fetch teams');
    }
  };

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      let url = `/api/admin/matches?seasonId=${selectedSeason}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setMatches(data);
      } else {
        console.error('Matches data is not an array:', data);
        setMatches([]);
        toast.error(data.message || 'Failed to fetch matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
      toast.error('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMatch = () => {
    setEditingMatch(null);
    setShowModal(true);
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setShowModal(true);
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const response = await fetch(`/api/admin/matches?id=${matchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Match deleted successfully');
        fetchMatches();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
    }
  };

  const downloadSchedulePDF = async () => {
    try {
      const response = await fetch(`/api/schedule-pdf?seasonId=${selectedSeason}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const htmlContent = await response.text();
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        const printButton = printWindow.document.createElement('button');
        printButton.innerHTML = 'Print / Save as PDF';
        printButton.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        printButton.onclick = () => {
          printWindow.print();
        };
        printWindow.document.body.appendChild(printButton);
        
        const instructions = printWindow.document.createElement('div');
        instructions.innerHTML = `
          <div style="position: fixed; top: 50px; right: 10px; background: #f3f4f6; padding: 10px; border-radius: 5px; font-size: 12px; max-width: 200px; z-index: 1000;">
            <strong>Save as PDF:</strong><br>
            1. Click "Print / Save as PDF"<br>
            2. Choose "Save as PDF" as destination<br>
            3. Click "Save"
          </div>
        `;
        printWindow.document.body.appendChild(instructions);
      };
      
      toast.success('Schedule opened for printing/PDF save');
    } catch (error) {
      console.error('Error opening schedule:', error);
      toast.error('Failed to open schedule');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (match) => {
    if (match.status === 'completed' && match.events && match.events.length > 0) {
      return <CheckCircle className="w-4 h-4 text-green-600 ml-1" title="Has player statistics" />;
    }
    if (match.status === 'completed' && (!match.events || match.events.length === 0)) {
      return <AlertCircle className="w-4 h-4 text-yellow-600 ml-1" title="No player statistics" />;
    }
    return null;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Matches</h1>
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-40"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
          </select>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="form-input w-48"
          >
            {Array.isArray(seasons) && seasons.map(season => (
              <option key={season._id} value={season._id}>
                {season.name} {season.isActive && '(Active)'}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </button>
          <button
            onClick={downloadSchedulePDF}
            className="btn btn-secondary flex items-center"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </button>
          <button onClick={handleAddMatch} className="btn btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </button>
        </div>
      </div>

      {/* Match Statistics Summary */}
      {matches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {matches.filter(m => m.status === 'live').length}
            </div>
            <div className="text-sm text-gray-600">Live</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {matches.filter(m => m.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {matches.filter(m => m.status === 'completed' && m.events && m.events.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Stats</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {matches
                .filter(m => m.status === 'completed')
                .reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Goals</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teams</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(matches) && matches.map((match) => (
                <tr key={match._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDisplayDate(match.matchDate)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDisplayTime(match.matchDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {match.homeTeam?.name || 'Unknown'} vs {match.awayTeam?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {match.status === 'completed' || match.status === 'live' ? (
                      <div className="text-sm font-bold text-gray-900">
                        {match.homeScore || 0} - {match.awayScore || 0}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                        {match.status ? match.status.charAt(0).toUpperCase() + match.status.slice(1) : 'Unknown'}
                        {match.status === 'live' && match.liveData?.currentMinute && (
                          <span className="ml-1">{match.liveData.currentMinute}'</span>
                        )}
                      </span>
                      {getStatusIcon(match)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{match.venue || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{match.round || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {match.events && match.events.length > 0 ? (
                        <div className="space-y-1">
                          <div>{match.events.filter(e => e.type === 'goal').length} Goals</div>
                          <div>{match.events.filter(e => e.type === 'yellow_card' || e.type === 'red_card').length} Cards</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No events</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {match.status === 'scheduled' && (
                        <button
                          onClick={() => router.push(`/matches/live?matchId=${match._id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="Start Live Match"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditMatch(match)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Match"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!Array.isArray(matches) || matches.length === 0) && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-500">Get started by creating your first match.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Match Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMatch ? 'Edit Match' : 'Add New Match'}
        size="xl"
      >
        <EnhancedMatchForm
          match={editingMatch}
          teams={teams}
          seasons={seasons}
          selectedSeason={selectedSeason}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchMatches();
          }}
        />
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Match Schedule"
        size="md"
      >
        <ImportMatchesForm
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchMatches();
          }}
        />
      </Modal>
    </div>
  );
}

// ===========================================
// ENHANCED MATCH FORM COMPONENT
// ===========================================

function EnhancedMatchForm({ match, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    homeTeam: match?.homeTeam?._id || '',
    awayTeam: match?.awayTeam?._id || '',
    matchDate: formatToLocalDateTime(match?.matchDate),
    venue: match?.venue || '',
    round: match?.round || 'Regular Season',
    referee: match?.referee || '',
    season: match?.season?._id || selectedSeason,
    status: match?.status || 'scheduled',
    homeScore: match?.homeScore || 0,
    awayScore: match?.awayScore || 0,
    notes: match?.notes || '',
    events: match?.events || []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateTimeError, setDateTimeError] = useState('');
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);

  // Fetch team players when teams change
  useEffect(() => {
    if (formData.homeTeam && formData.season) {
      fetchTeamPlayers(formData.homeTeam, 'home');
    }
    if (formData.awayTeam && formData.season) {
      fetchTeamPlayers(formData.awayTeam, 'away');
    }
  }, [formData.homeTeam, formData.awayTeam, formData.season]);

  // Show player stats section when status is completed
  useEffect(() => {
    if (formData.status === 'completed') {
      setShowPlayerStats(true);
    } else {
      setShowPlayerStats(false);
    }
  }, [formData.status]);

  const fetchTeamPlayers = async (teamId, teamType) => {
    try {
      console.log(`Fetching ${teamType} players for team:`, teamId);
      const response = await fetch(`/api/admin/players?teamId=${teamId}&status=active`);
      console.log(`${teamType} players response status:`, response.status);
      
      if (response.ok) {
        const players = await response.json();
        console.log(`${teamType} players data:`, players);
        
        if (teamType === 'home') {
          setHomePlayers(Array.isArray(players) ? players : []);
        } else {
          setAwayPlayers(Array.isArray(players) ? players : []);
        }
      } else {
        console.error(`Failed to fetch ${teamType} players:`, response.status);
        if (teamType === 'home') {
          setHomePlayers([]);
        } else {
          setAwayPlayers([]);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${teamType} team players:`, error);
      if (teamType === 'home') {
        setHomePlayers([]);
      } else {
        setAwayPlayers([]);
      }
    }
  };

  // Enhanced date validation
  const handleDateTimeChange = (value) => {
    setFormData({ ...formData, matchDate: value });
    const validation = validateMatchDate(value, formData.status);
    setDateTimeError(validation.error || '');
  };

  const handleStatusChange = (status) => {
    const newFormData = { ...formData, status };
    
    // Reset scores and events for non-active matches
    if (status === 'scheduled' || status === 'postponed' || status === 'cancelled') {
      newFormData.homeScore = 0;
      newFormData.awayScore = 0;
      newFormData.events = [];
    }
    
    setFormData(newFormData);
    
    // Re-validate date with new status
    if (newFormData.matchDate) {
      const validation = validateMatchDate(newFormData.matchDate, status);
      setDateTimeError(validation.error || '');
    }
  };

  const addPlayerEvent = (playerId, playerName, team, eventType) => {
    const newEvent = {
      id: Date.now(),
      type: eventType,
      team: team,
      minute: 90, // Default to full match for completed games
      player: playerId,
      playerName: playerName,
      description: `${eventType.replace('_', ' ').toUpperCase()} - ${playerName}`,
      timestamp: new Date()
    };

    const updatedEvents = [...formData.events, newEvent];
    let updatedFormData = { ...formData, events: updatedEvents };

    // Auto-update score for goals
    if (eventType === 'goal') {
      if (team === 'home') {
        updatedFormData.homeScore = formData.homeScore + 1;
      } else {
        updatedFormData.awayScore = formData.awayScore + 1;
      }
    }

    setFormData(updatedFormData);
    toast.success(`${eventType.replace('_', ' ').toUpperCase()} added for ${playerName}`);
  };

  const removeEvent = (eventIndex) => {
    const eventToRemove = formData.events[eventIndex];
    let updatedFormData = { ...formData };
    
    // Adjust score if removing a goal
    if (eventToRemove.type === 'goal') {
      if (eventToRemove.team === 'home') {
        updatedFormData.homeScore = Math.max(0, formData.homeScore - 1);
      } else {
        updatedFormData.awayScore = Math.max(0, formData.awayScore - 1);
      }
    }

    updatedFormData.events = formData.events.filter((_, index) => index !== eventIndex);
    setFormData(updatedFormData);
    toast.success('Event removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.homeTeam || !formData.awayTeam) {
      toast.error('Please select both home and away teams');
      return;
    }
    
    if (formData.homeTeam === formData.awayTeam) {
      toast.error('Home and away teams cannot be the same');
      return;
    }
    
    if (!formData.matchDate) {
      toast.error('Please select match date and time');
      return;
    }

    if (dateTimeError) {
      toast.error(dateTimeError);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const method = match ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        matchDate: parseLocalDateTimeToISO(formData.matchDate),
        homeScore: parseInt(formData.homeScore) || 0,
        awayScore: parseInt(formData.awayScore) || 0,
        events: formData.events
      };

      if (match) {
        submitData.id = match._id;
      }

      console.log('Submitting match data:', submitData);

      const response = await fetch('/api/admin/matches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          formData.status === 'completed' && formData.events.length > 0 
            ? 'Match saved and player stats updated!' 
            : match ? 'Match updated successfully' : 'Match created successfully'
        );
        onSuccess();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting match:', error);
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Match Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Home Team *</label>
          <select
            className="form-input"
            value={formData.homeTeam}
            onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
            required
          >
            <option value="">Select Home Team</option>
            {Array.isArray(teams) && teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Away Team *</label>
          <select
            className="form-input"
            value={formData.awayTeam}
            onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
            required
          >
            <option value="">Select Away Team</option>
            {Array.isArray(teams) && teams.filter(team => team._id !== formData.homeTeam).map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Match Date & Time *</label>
          <input
            type="datetime-local"
            className={`form-input ${dateTimeError ? 'border-red-500' : ''}`}
            value={formData.matchDate}
            onChange={(e) => handleDateTimeChange(e.target.value)}
            required
          />
          {dateTimeError && (
            <div className="text-red-500 text-sm mt-1">{dateTimeError}</div>
          )}
          {formData.status === 'completed' && !dateTimeError && (
            <div className="text-green-600 text-sm mt-1">
              ✓ Past dates are allowed for completed matches
            </div>
          )}
          <div className="text-gray-500 text-xs mt-1">
            Preview: {formData.matchDate ? 
              new Date(formData.matchDate).toLocaleString() : 'No date selected'}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Venue</label>
          <input
            type="text"
            className="form-input"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            placeholder="Stadium name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Round</label>
          <input
            type="text"
            className="form-input"
            value={formData.round}
            onChange={(e) => setFormData({ ...formData, round: e.target.value })}
            placeholder="e.g., Round 1, Semi-final"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Referee</label>
          <input
            type="text"
            className="form-input"
            value={formData.referee}
            onChange={(e) => setFormData({ ...formData, referee: e.target.value })}
            placeholder="Referee name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {formData.status === 'completed' && (
            <div className="text-sm text-green-600 mt-1">
              Player statistics will be updated automatically
            </div>
          )}
        </div>

        {(formData.status === 'completed' || formData.status === 'live') && (
          <>
            <div className="form-group">
              <label className="form-label">
                {teams.find(t => t._id === formData.homeTeam)?.name || 'Home'} Score
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.homeScore}
                onChange={(e) => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {teams.find(t => t._id === formData.awayTeam)?.name || 'Away'} Score
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.awayScore}
                onChange={(e) => setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })}
              />
            </div>
          </>
        )}
      </div>

      {/* Player Statistics Section */}
      {formData.status === 'completed' && (homePlayers.length > 0 || awayPlayers.length > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Player Statistics</h3>
            <button
              type="button"
              onClick={() => setShowPlayerStats(!showPlayerStats)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              {showPlayerStats ? 'Hide' : 'Show'} Player Stats
            </button>
          </div>

          {showPlayerStats && (
            <div className="space-y-6">
              {/* Home Team Players */}
              {homePlayers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-800 mb-3">
                    {teams.find(t => t._id === formData.homeTeam)?.name} Players
                  </h4>
                  <PlayerStatsSection
                    players={homePlayers}
                    team="home"
                    events={formData.events}
                    onAddEvent={addPlayerEvent}
                  />
                </div>
              )}

              {/* Away Team Players */}
              {awayPlayers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-800 mb-3">
                    {teams.find(t => t._id === formData.awayTeam)?.name} Players
                  </h4>
                  <PlayerStatsSection
                    players={awayPlayers}
                    team="away"
                    events={formData.events}
                    onAddEvent={addPlayerEvent}
                  />
                </div>
              )}

              {/* Events Summary */}
              {formData.events.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-green-800 mb-3">Match Events</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.events.map((event, index) => (
                      <div key={event.id} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm">
                          <span className="font-medium">{event.playerName}</span>
                          <span className="mx-2">•</span>
                          <span className="capitalize">{event.type.replace('_', ' ')}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-500">{event.team === 'home' ? 'Home' : 'Away'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEvent(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Season *</label>
        <select
          className="form-input"
          value={formData.season}
          onChange={(e) => setFormData({ ...formData, season: e.target.value })}
          required
        >
          {Array.isArray(seasons) && seasons.map(season => (
            <option key={season._id} value={season._id}>
              {season.name} {season.isActive && '(Active)'}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-input"
          rows="3"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional match information"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || dateTimeError} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : match ? 'Update Match' : 'Create Match'}
        </button>
      </div>
    </form>
  );
}

// Player Statistics Section Component
function PlayerStatsSection({ players, team, events, onAddEvent }) {
  const getPlayerEvents = (playerId, eventType) => {
    return events.filter(e => e.player === playerId && e.type === eventType && e.team === team);
  };

  return (
    <div className="grid gap-3">
      {players.map((player) => {
        const playerGoals = getPlayerEvents(player._id, 'goal');
        const playerAssists = getPlayerEvents(player._id, 'assist');
        const playerYellowCards = getPlayerEvents(player._id, 'yellow_card');
        const playerRedCards = getPlayerEvents(player._id, 'red_card');

        return (
          <div key={player._id} className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">{player.name}</span>
                <span className="text-gray-500 ml-2">
                  #{player.jerseyNumber || 'N/A'} • {player.position}
                </span>
              </div>
              <div className="flex space-x-1 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {playerGoals.length}G
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {playerAssists.length}A
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {playerYellowCards.length}Y
                </span>
                {playerRedCards.length > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    {playerRedCards.length}R
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onAddEvent(player._id, player.name, team, 'goal')}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              >
                + Goal
              </button>
              <button
                type="button"
                onClick={() => onAddEvent(player._id, player.name, team, 'assist')}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
              >
                + Assist
              </button>
              <button
                type="button"
                onClick={() => onAddEvent(player._id, player.name, team, 'yellow_card')}
                className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
              >
                + Yellow
              </button>
              <button
                type="button"
                onClick={() => onAddEvent(player._id, player.name, team, 'red_card')}
                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
              >
                + Red
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================
// IMPORT MATCHES FORM COMPONENT
// ===========================================

function ImportMatchesForm({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/csv-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Import completed successfully');
        if (data.errors && data.errors.length > 0) {
          console.warn('Import errors:', data.errors);
          toast.error(`${data.errors.length} rows had errors`);
        }
        onSuccess();
      } else {
        toast.error(data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/template/match-schedule');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'match-schedule-template.csv';
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const link = document.createElement('a');
        link.href = '/templates/match-schedule-template.csv';
        link.download = 'match-schedule-template.csv';
        link.click();
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">CSV Format Requirements</h4>
        <p className="text-blue-700 text-sm mb-2">
          Your CSV file should have the following columns:
        </p>
        <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
          <li>homeTeam - Exact team name as registered</li>
          <li>awayTeam - Exact team name as registered</li>
          <li>matchDate - Format: YYYY-MM-DD HH:MM (24-hour format)</li>
          <li>venue (optional)</li>
          <li>round (optional)</li>
          <li>referee (optional)</li>
        </ul>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
          <p className="text-yellow-800 text-xs">
            <strong>Time Note:</strong> Dates/times in CSV will be treated as your local timezone.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Download Template CSV
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Select CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="form-input"
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="btn btn-primary"
          >
            {isUploading ? 'Importing...' : 'Import Matches'}
          </button>
        </div>
      </form>
    </div>
  );
}
