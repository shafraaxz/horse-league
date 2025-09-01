// ===========================================
// FILE: pages/admin/matches.js (FIXED WITH ERROR HANDLING)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Calendar, Play, Upload, FileDown } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminMatches() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState([]); // Initialize as empty array
  const [teams, setTeams] = useState([]); // Initialize as empty array
  const [seasons, setSeasons] = useState([]); // Initialize as empty array
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
      
      // Ensure data is an array
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
      
      // Ensure data is an array
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
      
      // Ensure data is an array
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
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'match-schedule.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Schedule PDF downloaded');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(matches) && matches.map((match) => (
                <tr key={match._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {match.matchDate ? format(new Date(match.matchDate), 'MMM dd, yyyy') : 'No Date'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {match.matchDate ? format(new Date(match.matchDate), 'HH:mm') : ''}
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                      {match.status ? match.status.charAt(0).toUpperCase() + match.status.slice(1) : 'Unknown'}
                      {match.status === 'live' && match.liveData?.currentMinute && (
                        <span className="ml-1">{match.liveData.currentMinute}'</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{match.venue || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{match.round || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {match.status === 'scheduled' && (
                      <button
                        onClick={() => router.push(`/matches/live?matchId=${match._id}`)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Start Live Match"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditMatch(match)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
        size="lg"
      >
        <MatchForm
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

// Match Form Component
function MatchForm({ match, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    homeTeam: match?.homeTeam?._id || '',
    awayTeam: match?.awayTeam?._id || '',
    matchDate: match?.matchDate ? format(new Date(match.matchDate), "yyyy-MM-dd'T'HH:mm") : '',
    venue: match?.venue || '',
    round: match?.round || 'Regular Season',
    referee: match?.referee || '',
    season: match?.season?._id || selectedSeason,
    status: match?.status || 'scheduled',
    homeScore: match?.homeScore || 0,
    awayScore: match?.awayScore || 0,
    notes: match?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    setIsSubmitting(true);

    try {
      const method = match ? 'PUT' : 'POST';
      const body = match 
        ? { ...formData, id: match._id }
        : formData;

      const response = await fetch('/api/admin/matches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(match ? 'Match updated successfully' : 'Match created successfully');
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
            className="form-input"
            value={formData.matchDate}
            onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
            required
          />
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
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {(formData.status === 'completed' || formData.status === 'live') && (
          <>
            <div className="form-group">
              <label className="form-label">Home Score</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.homeScore}
                onChange={(e) => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Away Score</label>
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
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : match ? 'Update Match' : 'Create Match'}
        </button>
      </div>
    </form>
  );
}

// Import Matches Form Component
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
      // Try API endpoint first, fallback to static file
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
        // Fallback to static file
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
          <li>matchDate - Format: YYYY-MM-DD HH:MM</li>
          <li>venue (optional)</li>
          <li>round (optional)</li>
          <li>referee (optional)</li>
        </ul>
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
