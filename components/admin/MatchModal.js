// components/admin/MatchModal.js
import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Clock, Play, Pause, Square } from 'lucide-react';

const MatchModal = ({ isOpen, onClose, match, teams, selectedLeague, onSave }) => {
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    round: '',
    status: 'scheduled',
    homeScore: '',
    awayScore: '',
    referee: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const matchStatuses = [
    { value: 'scheduled', label: 'Scheduled', color: 'bg-slate-600' },
    { value: 'live', label: 'Live', color: 'bg-red-500' },
    { value: 'halftime', label: 'Half Time', color: 'bg-yellow-500' },
    { value: 'finished', label: 'Finished', color: 'bg-green-500' },
    { value: 'postponed', label: 'Postponed', color: 'bg-orange-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-600' }
  ];

  useEffect(() => {
    if (match) {
      const matchDate = match.date ? new Date(match.date) : new Date();
      setFormData({
        homeTeam: match.homeTeam || '',
        awayTeam: match.awayTeam || '',
        date: match.date ? match.date.split('T')[0] : '',
        time: match.time || '',
        venue: match.venue || '',
        round: match.round?.toString() || '',
        status: match.status || 'scheduled',
        homeScore: match.homeScore?.toString() || '',
        awayScore: match.awayScore?.toString() || '',
        referee: match.referee || '',
        notes: match.notes || '',
        _id: match._id
      });
    } else {
      setFormData({
        homeTeam: '',
        awayTeam: '',
        date: '',
        time: '18:00',
        venue: '',
        round: '1',
        status: 'scheduled',
        homeScore: '',
        awayScore: '',
        referee: '',
        notes: ''
      });
    }
  }, [match, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        round: parseInt(formData.round) || 1,
        homeScore: formData.homeScore ? parseInt(formData.homeScore) : null,
        awayScore: formData.awayScore ? parseInt(formData.awayScore) : null
      };
      await onSave(submitData);
    } catch (error) {
      console.error('Error saving match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t._id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getStatusInfo = (status) => {
    return matchStatuses.find(s => s.value === status) || matchStatuses[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {match ? 'Edit Match' : 'Schedule New Match'}
                </h3>
                <p className="text-slate-400 text-sm">Configure match details</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Match Teams */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Match Teams</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Home Team *</label>
                <select
                  name="homeTeam"
                  value={formData.homeTeam}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Home Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id} disabled={team._id === formData.awayTeam}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Away Team *</label>
                <select
                  name="awayTeam"
                  value={formData.awayTeam}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Away Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id} disabled={team._id === formData.homeTeam}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.homeTeam && formData.awayTeam && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-white font-semibold">{getTeamName(formData.homeTeam)}</div>
                    <div className="text-slate-400 text-sm">Home</div>
                  </div>
                  <div className="text-2xl text-white font-bold">VS</div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{getTeamName(formData.awayTeam)}</div>
                    <div className="text-slate-400 text-sm">Away</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Match Schedule */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Schedule Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Round</label>
                <input
                  type="number"
                  name="round"
                  value={formData.round}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Venue</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Stadium name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Referee</label>
              <input
                type="text"
                name="referee"
                value={formData.referee}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Referee name"
              />
            </div>
          </div>

          {/* Match Status & Score */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Match Status & Result</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {matchStatuses.map(status => (
                  <label key={status.value} className={`relative cursor-pointer`}>
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 transition-all ${
                      formData.status === status.value
                        ? `${status.color} border-white/50 text-white`
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">{status.label}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {(formData.status === 'live' || formData.status === 'halftime' || formData.status === 'finished') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {getTeamName(formData.homeTeam)} Score
                  </label>
                  <input
                    type="number"
                    name="homeScore"
                    value={formData.homeScore}
                    onChange={handleChange}
                    min="0"
                    max="50"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {getTeamName(formData.awayTeam)} Score
                  </label>
                  <input
                    type="number"
                    name="awayScore"
                    value={formData.awayScore}
                    onChange={handleChange}
                    min="0"
                    max="50"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {(formData.homeScore || formData.awayScore) && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-white font-semibold">{getTeamName(formData.homeTeam)}</div>
                    <div className="text-3xl font-bold text-white">{formData.homeScore || 0}</div>
                  </div>
                  <div className="text-2xl text-slate-400">-</div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{getTeamName(formData.awayTeam)}</div>
                    <div className="text-3xl font-bold text-white">{formData.awayScore || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Additional Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Match notes, highlights, or special information..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.homeTeam || !formData.awayTeam || !formData.date || !formData.time || !selectedLeague}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                match ? 'Update Match' : 'Schedule Match'
              )}
            </button>
          </div>

          {!selectedLeague ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <h4 className="text-red-400 font-semibold mb-2">League Required</h4>
              <p className="text-slate-300">Please select a league from the dropdown above before scheduling a match.</p>
            </div>
          ) : teams.length < 2 ? (
            <div className="text-orange-400 text-sm text-center">
              ⚠️ Need at least 2 teams to create a match
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default MatchModal;