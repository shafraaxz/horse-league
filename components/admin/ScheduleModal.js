// components/admin/ScheduleModal.js - IMPROVED with proper round-robin explanation
import { useState } from 'react';
import { X, Calendar, Settings, Clock, MapPin, AlertTriangle, Info, Zap } from 'lucide-react';

const ScheduleModal = ({ isOpen, onClose, teams, selectedLeague, onGenerate }) => {
  const [formData, setFormData] = useState({
    format: 'double-round-robin',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
    daysBetween: 7,
    timePeriods: ['18:00', '19:30'],
    deleteExisting: true,
    venues: {
      primary: 'Manadhoo Futsal Ground',
      secondary: 'Central Arena'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  if (!isOpen) return null;

  const formats = [
    {
      value: 'double-round-robin',
      label: 'Double Round-Robin',
      description: 'Complete tournament: Every team plays every other team twice (home & away)',
      details: 'True double round-robin ensures perfect balance and fairness',
      icon: '🔄',
      recommended: true
    },
    {
      value: 'single-round-robin',
      label: 'Single Round-Robin',
      description: 'Each team plays every other team exactly once',
      details: 'Shorter tournament with each pairing played only once',
      icon: '🎯',
      recommended: false
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }
    
    if (!formData.daysBetween || formData.daysBetween < 1) {
      newErrors.daysBetween = 'Days between rounds must be at least 1';
    } else if (formData.daysBetween > 30) {
      newErrors.daysBetween = 'Days between rounds should not exceed 30';
    }
    
    if (!formData.timePeriods || formData.timePeriods.length === 0) {
      newErrors.timePeriods = 'At least one time period is required';
    }
    
    if (!selectedLeague) {
      newErrors.league = 'Please select a league first';
    }
    
    if (teams.length < 2) {
      newErrors.teams = 'Need at least 2 teams to generate schedule';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const scheduleData = {
        ...formData,
        leagueId: selectedLeague
      };
      
      await onGenerate(scheduleData);
      onClose();
    } catch (error) {
      console.error('Error generating schedule:', error);
      setErrors({ submit: 'Failed to generate schedule. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTimePeriod = () => {
    setFormData(prev => ({
      ...prev,
      timePeriods: [...prev.timePeriods, '20:00']
    }));
  };

  const removeTimePeriod = (index) => {
    if (formData.timePeriods.length > 1) {
      setFormData(prev => ({
        ...prev,
        timePeriods: prev.timePeriods.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTimePeriod = (index, value) => {
    setFormData(prev => ({
      ...prev,
      timePeriods: prev.timePeriods.map((time, i) => i === index ? value : time)
    }));
  };

  // ✅ PROPER: Calculate matches using correct round-robin formula
  const calculateMatches = () => {
    const teamCount = teams.length;
    if (teamCount < 2) return 0;
    
    if (formData.format === 'double-round-robin') {
      // Each team plays every other team twice: n × (n-1)
      return teamCount * (teamCount - 1);
    } else {
      // Each team plays every other team once: n × (n-1) ÷ 2
      return (teamCount * (teamCount - 1)) / 2;
    }
  };

  // ✅ PROPER: Calculate rounds using standard round-robin formula
  const calculateRounds = () => {
    const teamCount = teams.length;
    if (teamCount < 2) return 0;
    
    // Standard round-robin: if even teams = n-1 rounds, if odd teams = n rounds
    const roundsPerLeg = teamCount % 2 === 0 ? teamCount - 1 : teamCount;
    
    return formData.format === 'double-round-robin' ? roundsPerLeg * 2 : roundsPerLeg;
  };

  const calculateDuration = () => {
    const rounds = calculateRounds();
    const weeks = Math.ceil(rounds * formData.daysBetween / 7);
    return weeks;
  };

  const getEndDate = () => {
    if (!formData.startDate || !formData.daysBetween) return null;
    
    const startDate = new Date(formData.startDate);
    const rounds = calculateRounds();
    const totalDays = rounds * formData.daysBetween;
    const endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
    
    return endDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // ✅ NEW: Calculate matches per round for better understanding
  const calculateMatchesPerRound = () => {
    const teamCount = teams.length;
    if (teamCount < 2) return 0;
    
    // In each round, we can have at most floor(n/2) simultaneous matches
    return Math.floor(teamCount / 2);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Settings', icon: Settings },
    { id: 'advanced', label: 'Advanced Options', icon: Zap },
    { id: 'preview', label: 'Preview & Summary', icon: Info }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Generate Tournament Schedule</h3>
                <p className="text-slate-400 text-sm">
                  Create a balanced round-robin tournament for {teams.length} teams
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6 bg-slate-700/30 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* League Check */}
          {!selectedLeague && (
            <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">League Required</span>
              </div>
              <p className="text-orange-300 text-sm mt-1">
                Please select a league from the dropdown above before generating a schedule.
              </p>
            </div>
          )}

          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-8">
              
              {/* Format Selection */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Tournament Format</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formats.map(format => (
                    <label 
                      key={format.value} 
                      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.format === format.value 
                          ? 'border-orange-500 bg-orange-500/10' 
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={formData.format === format.value}
                        onChange={(e) => handleInputChange('format', e.target.value)}
                        className="sr-only"
                        disabled={isSubmitting}
                      />
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{format.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="text-white font-semibold">{format.label}</h5>
                            {format.recommended && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-2">{format.description}</p>
                          <p className="text-slate-300 text-xs">{format.details}</p>
                        </div>
                      </div>
                      {formData.format === format.value && (
                        <div className="absolute top-3 right-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                
                {/* ✅ NEW: Format explanation */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="text-blue-400 font-medium mb-1">Round-Robin Tournament Format</h5>
                      <div className="text-sm text-slate-300 space-y-1">
                        <p><strong>Double Round-Robin:</strong> Each team plays every other team twice (once at home, once away). This ensures perfect balance and fairness.</p>
                        <p><strong>Single Round-Robin:</strong> Each team plays every other team once. Home advantage is distributed as evenly as possible.</p>
                        <p className="text-blue-300 mt-2">
                          📊 With {teams.length} teams: 
                          <strong> {calculateMatches()} total matches</strong> across 
                          <strong> {calculateRounds()} rounds</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Timing */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Schedule Timing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tournament Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                        errors.startDate ? 'border-red-500' : 'border-slate-600'
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
                    {formData.startDate && (
                      <p className="text-slate-400 text-xs mt-1">
                        📅 {new Date(formData.startDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>

                  {/* Days Between Rounds */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Days Between Rounds *
                    </label>
                    <select
                      value={formData.daysBetween}
                      onChange={(e) => handleInputChange('daysBetween', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                        errors.daysBetween ? 'border-red-500' : 'border-slate-600'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value={3}>Every 3 days (Intensive)</option>
                      <option value={7}>Every week (Recommended)</option>
                      <option value={10}>Every 10 days</option>
                      <option value={14}>Every 2 weeks</option>
                      <option value={21}>Every 3 weeks</option>
                    </select>
                    {errors.daysBetween && <p className="text-red-400 text-sm mt-1">{errors.daysBetween}</p>}
                    <p className="text-slate-400 text-xs mt-1">
                      ⏱️ Tournament duration: approximately {calculateDuration()} weeks
                    </p>
                  </div>
                </div>
              </div>

              {/* Match Times */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Match Time Periods</h4>
                <div className="space-y-3">
                  {formData.timePeriods.map((time, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTimePeriod(index, e.target.value)}
                        className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                        disabled={isSubmitting}
                      />
                      <span className="text-slate-400 text-sm">
                        {new Date(`2000-01-01 ${time}`).toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </span>
                      <div className="flex gap-2">
                        {formData.timePeriods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimePeriod(index)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                            disabled={isSubmitting}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addTimePeriod}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                    disabled={isSubmitting || formData.timePeriods.length >= 5}
                  >
                    <Clock className="w-4 h-4" />
                    Add Time Period
                  </button>
                  
                  <p className="text-slate-400 text-xs">
                    💡 With {formData.timePeriods.length} time slots, you can schedule {calculateMatchesPerRound()} matches per round simultaneously
                  </p>
                </div>
                {errors.timePeriods && <p className="text-red-400 text-sm mt-1">{errors.timePeriods}</p>}
              </div>
            </div>
          )}

          {/* Advanced Options Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              
              {/* Venue Settings */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Venue Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Primary Venue
                    </label>
                    <select
                      value={formData.venues.primary}
                      onChange={(e) => handleInputChange('venues', { ...formData.venues, primary: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      <option value="Manadhoo Futsal Ground">Manadhoo Futsal Ground</option>
                      <option value="Central Arena">Central Arena</option>
                      <option value="Seaside Court">Seaside Court</option>
                      <option value="Sports Complex">Sports Complex</option>
                      <option value="Community Ground">Community Ground</option>
                    </select>
                    <p className="text-slate-400 text-xs mt-1">Main venue for most matches</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Secondary Venue
                    </label>
                    <select
                      value={formData.venues.secondary}
                      onChange={(e) => handleInputChange('venues', { ...formData.venues, secondary: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      <option value="">No secondary venue</option>
                      <option value="Manadhoo Futsal Ground">Manadhoo Futsal Ground</option>
                      <option value="Central Arena">Central Arena</option>
                      <option value="Seaside Court">Seaside Court</option>
                      <option value="Sports Complex">Sports Complex</option>
                      <option value="Community Ground">Community Ground</option>
                    </select>
                    <p className="text-slate-400 text-xs mt-1">Optional backup venue</p>
                  </div>
                </div>
              </div>

              {/* Schedule Options */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Schedule Options</h4>
                <div className="space-y-4">
                  
                  <label className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.deleteExisting}
                      onChange={(e) => handleInputChange('deleteExisting', e.target.checked)}
                      className="mt-1 text-orange-500 focus:ring-orange-500 rounded"
                      disabled={isSubmitting}
                    />
                    <div>
                      <div className="text-white font-medium">Delete Existing Matches</div>
                      <div className="text-slate-400 text-sm">
                        {formData.deleteExisting 
                          ? '⚠️ All existing matches will be deleted and replaced with the new schedule' 
                          : '📝 New matches will be added alongside existing ones'
                        }
                      </div>
                    </div>
                  </label>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h5 className="text-blue-400 font-medium mb-1">Round-Robin Algorithm</h5>
                        <ul className="text-sm text-slate-300 space-y-1">
                          <li>• Uses the classical round-robin rotation algorithm</li>
                          <li>• Ensures perfect balance: each team plays every opponent equally</li>
                          <li>• Home/away distribution is mathematically optimized</li>
                          <li>• No team has consecutive bye weeks or unfair advantages</li>
                          <li>• Matches are distributed evenly across available time slots</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-8">
              
              {/* Schedule Overview */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-orange-400" />
                  Tournament Overview
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{teams.length}</div>
                    <div className="text-slate-400 text-sm">Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{calculateMatches()}</div>
                    <div className="text-slate-400 text-sm">Total Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{calculateRounds()}</div>
                    <div className="text-slate-400 text-sm">Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{calculateDuration()}</div>
                    <div className="text-slate-400 text-sm">Weeks</div>
                  </div>
                </div>
              </div>

              {/* Tournament Mathematics */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h5 className="text-lg font-semibold text-white mb-4">Tournament Mathematics</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teams:</span>
                      <span className="text-white font-medium">{teams.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Matches per team:</span>
                      <span className="text-white font-medium">
                        {formData.format === 'double-round-robin' ? (teams.length - 1) * 2 : teams.length - 1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Matches per round:</span>
                      <span className="text-white font-medium">{calculateMatchesPerRound()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time slots needed:</span>
                      <span className="text-white font-medium">{formData.timePeriods.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Start Date:</span>
                      <span className="text-white font-medium">
                        {new Date(formData.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">End Date:</span>
                      <span className="text-white font-medium">
                        {getEndDate() || 'Not calculated'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Round Interval:</span>
                      <span className="text-white font-medium">{formData.daysBetween} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Algorithm:</span>
                      <span className="text-white font-medium">Classic Round-Robin</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teams List */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h5 className="text-lg font-semibold text-white mb-4">Participating Teams</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teams.map((team, index) => (
                    <div key={team._id} className="flex items-center gap-3 p-3 bg-slate-600/50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                        {team.logo ? (
                          <img src={team.logo} alt="" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          team.name.substring(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{team.name}</div>
                        <div className="text-slate-400 text-xs">Team {index + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Confirmation */}
              {teams.length >= 2 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="text-green-400 font-medium mb-2">Ready to Generate!</h5>
                      <p className="text-slate-300 text-sm mb-3">
                        Your {formData.format.replace('-', ' ')} tournament is configured and ready. 
                        This will create {calculateMatches()} matches across {calculateRounds()} rounds using the classic round-robin algorithm.
                      </p>
                      {formData.deleteExisting && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-sm">
                            ⚠️ Warning: All existing matches will be permanently deleted and replaced.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Messages */}
          {errors.teams && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.teams}</p>
            </div>
          )}

          {errors.league && (
            <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <p className="text-orange-400 text-sm">{errors.league}</p>
            </div>
          )}

          {errors.submit && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-700 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || teams.length < 2}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating {calculateMatches()} Matches...
                </div>
              ) : (
                `🚀 Generate ${calculateMatches()} Matches`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;