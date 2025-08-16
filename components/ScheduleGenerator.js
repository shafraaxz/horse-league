// components/ScheduleGenerator.js - FIXED: Responsive Modal Size
import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Plus, Trash2 } from 'lucide-react';

const ScheduleGenerator = ({ isOpen, onClose, teams, selectedLeague, onScheduleGenerated, currentMatches }) => {
  const [config, setConfig] = useState({
    format: 'double-round-robin',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weekdays: ['tuesday', 'thursday', 'saturday'],
    timePeriods: ['18:00', '19:30'],
    stadiums: ['Manadhoo Futsal Ground', 'Central Arena', 'Sports Complex A', 'Community Ground'],
    stadiumDistribution: 'rotate',
    primaryStadium: 'Manadhoo Futsal Ground',
    matchesPerRound: 6,
    deleteExisting: true,
    balanceVenues: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  const weekdayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // ✅ FIXED: Correct double round robin formula
  const generatePreview = () => {
    if (teams.length < 2) return;
    
    const N = teams.length;
    let totalMatches;
    let roundsNeeded;
    
    if (config.format === 'double-round-robin') {
      // ✅ CORRECT FORMULA: M = N(N-1) - Each team plays every other team twice
      totalMatches = N * (N - 1);
      roundsNeeded = 2 * (N - 1);
    } else {
      // Single round robin: M = N(N-1)/2
      totalMatches = Math.floor(N * (N - 1) / 2);
      roundsNeeded = N - 1;
    }
    
    const schedulingRounds = Math.ceil(totalMatches / config.matchesPerRound);
    const weeksNeeded = Math.ceil(schedulingRounds / config.weekdays.length);
    
    setPreview({
      totalMatches,
      roundsNeeded,
      schedulingRounds,
      weeksNeeded,
      matchesPerRound: Math.min(config.matchesPerRound, config.timePeriods.length * config.stadiums.length),
      estimatedEndDate: new Date(
        new Date(config.startDate).getTime() + 
        (weeksNeeded * 7 * 24 * 60 * 60 * 1000)
      ).toISOString().split('T')[0]
    });
  };

  useEffect(() => {
    generatePreview();
  }, [config, teams]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      
      if (key === 'timePeriods' || key === 'stadiums') {
        const maxSlots = updated.timePeriods.length * updated.stadiums.length;
        if (updated.matchesPerRound > maxSlots) {
          updated.matchesPerRound = maxSlots;
        }
      }
      
      return updated;
    });
  };

  const handleWeekdayToggle = (weekday) => {
    setConfig(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...prev.weekdays, weekday].sort((a, b) => {
            const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return order.indexOf(a) - order.indexOf(b);
          })
    }));
  };

  const addTimeSlot = () => {
    setConfig(prev => ({
      ...prev,
      timePeriods: [...prev.timePeriods, '20:00']
    }));
  };

  const removeTimeSlot = (index) => {
    setConfig(prev => ({
      ...prev,
      timePeriods: prev.timePeriods.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index, value) => {
    setConfig(prev => ({
      ...prev,
      timePeriods: prev.timePeriods.map((time, i) => i === index ? value : time)
    }));
  };

  const addStadium = () => {
    setConfig(prev => ({
      ...prev,
      stadiums: [...prev.stadiums, 'New Stadium']
    }));
  };

  const removeStadium = (index) => {
    setConfig(prev => ({
      ...prev,
      stadiums: prev.stadiums.filter((_, i) => i !== index)
    }));
  };

  const updateStadium = (index, value) => {
    setConfig(prev => ({
      ...prev,
      stadiums: prev.stadiums.map((stadium, i) => i === index ? value : stadium)
    }));
  };

  const handleGenerate = async () => {
    if (config.weekdays.length === 0) {
      alert('Please select at least one weekday');
      return;
    }
    
    if (config.timePeriods.length === 0) {
      alert('Please add at least one time slot');
      return;
    }

    if (config.stadiums.length === 0) {
      alert('Please add at least one stadium');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/matches/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          leagueId: selectedLeague,
          ...config,
          expectedMatches: preview?.totalMatches
        })
      });

      if (response.ok) {
        const result = await response.json();
        onScheduleGenerated(result);
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Schedule generation failed');
      }
    } catch (error) {
      alert('Failed to generate schedule: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!confirm('Are you sure you want to clear all existing matches?')) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/matches/clear-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          leagueId: selectedLeague
        })
      });

      if (response.ok) {
        const result = await response.json();
        onScheduleGenerated({ success: true, cleared: true, ...result });
        onClose();
      } else {
        throw new Error('Failed to clear schedule');
      }
    } catch (error) {
      alert('Failed to clear schedule: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      {/* ✅ FIXED: Responsive modal size with proper max dimensions */}
      <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header - Fixed height */}
        <div className="p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-semibold text-white">Schedule Generator</h3>
                <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Create tournament schedule with correct formula</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
              disabled={isGenerating}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            
            {/* Tournament Format */}
            <div className="space-y-4">
              <h4 className="text-base sm:text-lg font-semibold text-white">Tournament Format</h4>
              
              {/* Formula explanation */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
                <h5 className="text-green-400 font-medium mb-2 text-sm sm:text-base">📊 Tournament Mathematics</h5>
                <div className="text-xs sm:text-sm text-slate-300 space-y-1">
                  {config.format === 'double-round-robin' ? (
                    <>
                      <p><strong>Double Round Robin Formula:</strong> M = N(N-1)</p>
                      <p>Where N = {teams.length} teams</p>
                      <p><strong>Calculation:</strong> {teams.length} × ({teams.length}-1) = <span className="text-green-400 font-bold">{teams.length * (teams.length - 1)} matches</span></p>
                      <p><em>Each team plays every other team twice (home & away)</em></p>
                    </>
                  ) : (
                    <>
                      <p><strong>Single Round Robin Formula:</strong> M = N(N-1)/2</p>
                      <p>Where N = {teams.length} teams</p>
                      <p><strong>Calculation:</strong> {teams.length} × ({teams.length}-1) ÷ 2 = <span className="text-orange-400 font-bold">{Math.floor(teams.length * (teams.length - 1) / 2)} matches</span></p>
                      <p><em>Each team plays every other team once</em></p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                  <select
                    value={config.format}
                    onChange={(e) => handleConfigChange('format', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="single-round-robin">Single Round Robin</option>
                    <option value="double-round-robin">Double Round Robin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleConfigChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Matches Per Round (Max {config.timePeriods.length * config.stadiums.length})
                </label>
                <input
                  type="number"
                  min="1"
                  max={config.timePeriods.length * config.stadiums.length}
                  value={config.matchesPerRound}
                  onChange={(e) => handleConfigChange('matchesPerRound', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Weekdays Selection */}
            <div className="space-y-4">
              <h4 className="text-base sm:text-lg font-semibold text-white">Match Days</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {weekdayOptions.map(day => (
                  <label key={day.value} className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.weekdays.includes(day.value)}
                      onChange={() => handleWeekdayToggle(day.value)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="text-slate-300 text-sm sm:text-base">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-lg font-semibold text-white">Time Slots</h4>
                <button
                  onClick={addTimeSlot}
                  className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add Time</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {config.timePeriods.map((time, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {config.timePeriods.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stadiums Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-lg font-semibold text-white">Venues</h4>
                <button
                  onClick={addStadium}
                  className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add Stadium</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {config.stadiums.map((stadium, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={stadium}
                      onChange={(e) => updateStadium(index, e.target.value)}
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Stadium name"
                    />
                    {config.stadiums.length > 1 && (
                      <button
                        onClick={() => removeStadium(index)}
                        className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <h4 className="text-base sm:text-lg font-semibold text-white">Options</h4>
              <div className="space-y-2 sm:space-y-3">
                <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.deleteExisting}
                    onChange={(e) => handleConfigChange('deleteExisting', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-slate-300 text-sm sm:text-base">Delete existing matches</span>
                </label>
                
                <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.balanceVenues}
                    onChange={(e) => handleConfigChange('balanceVenues', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-slate-300 text-sm sm:text-base">Balance venues</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">📊 Schedule Preview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-green-400">{teams.length}</div>
                    <div className="text-slate-400 text-xs sm:text-sm">Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-green-400">{preview.totalMatches}</div>
                    <div className="text-slate-400 text-xs sm:text-sm">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-green-400">{preview.schedulingRounds}</div>
                    <div className="text-slate-400 text-xs sm:text-sm">Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-green-400">{preview.weeksNeeded}</div>
                    <div className="text-slate-400 text-xs sm:text-sm">Weeks</div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700 text-xs sm:text-sm text-slate-300">
                  <p><strong>Formula:</strong> {config.format === 'double-round-robin' ? 'N(N-1)' : 'N(N-1)/2'}</p>
                  <p><strong>Completion:</strong> {new Date(preview.estimatedEndDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-4 sm:p-6 border-t border-slate-700 flex-shrink-0 bg-slate-800">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {currentMatches && currentMatches.length > 0 && (
              <button
                onClick={handleClearSchedule}
                disabled={isGenerating}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Clear ({currentMatches.length})
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || teams.length < 2 || config.weekdays.length === 0}
              className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Generating {preview?.totalMatches || 0} Matches...</span>
                  <span className="sm:hidden">Generating...</span>
                </div>
              ) : (
                <>
                  <span className="hidden sm:inline">Generate {preview?.totalMatches || 0} Matches</span>
                  <span className="sm:hidden">Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGenerator;