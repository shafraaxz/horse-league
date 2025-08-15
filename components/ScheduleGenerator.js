// components/ScheduleGenerator.js - Updated to work with fixed API
import React, { useState, useEffect } from 'react';
import { X, Calendar, Settings, Clock, MapPin, AlertTriangle, Info, Zap } from 'lucide-react';

const ScheduleGenerator = ({ 
  isOpen, 
  onClose, 
  teams, 
  selectedLeague, 
  onScheduleGenerated,
  currentMatches = []
}) => {
  const [config, setConfig] = useState({
    format: 'double-round-robin',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysBetweenRounds: 7,
    timePeriods: ['18:00', '19:30'],
    deleteExisting: true,
    customVenues: {
      primary: 'Manadhoo Futsal Ground',
      secondary: 'Central Arena'
    }
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState(null);

  const formats = [
    {
      value: 'double-round-robin',
      label: 'Double Round-Robin',
      description: 'Each team plays every other team twice (home & away)',
      icon: '🔄',
      recommended: true
    },
    {
      value: 'single-round-robin',
      label: 'Single Round-Robin',
      description: 'Each team plays every other team once',
      icon: '🎯',
      recommended: false
    }
  ];

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = [];
    
    if (!config.startDate) {
      newErrors.push('Start date is required');
    } else {
      const startDate = new Date(config.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.push('Start date cannot be in the past');
      }
    }
    
    if (!config.daysBetweenRounds || config.daysBetweenRounds < 1) {
      newErrors.push('Days between rounds must be at least 1');
    }
    
    if (!config.timePeriods || config.timePeriods.length === 0) {
      newErrors.push('At least one time period is required');
    }
    
    if (!selectedLeague) {
      newErrors.push('Please select a league first');
    }
    
    if (teams.length < 2) {
      newErrors.push('Need at least 2 teams to generate schedule');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // ✅ FIXED: Use the correct API endpoint
  const handleGenerateAndSave = async () => {
    setIsGenerating(true);
    setErrors([]);

    try {
      console.log('🎯 Generating schedule with teams:', teams);
      console.log('🎯 Config:', config);

      if (!validateForm()) {
        setIsGenerating(false);
        return;
      }

      // Use the CORRECT API endpoint that exists in your backend
      const response = await fetch('/api/matches/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          leagueId: selectedLeague,
          format: config.format,
          startDate: config.startDate,
          daysBetween: config.daysBetweenRounds,
          timePeriods: config.timePeriods,
          deleteExisting: config.deleteExisting
        })
      });

      const result = await response.json();
      console.log('🎯 Schedule generation result:', result);

      if (response.ok && result.success) {
        onClose();
        setShowPreview(false);
        
        // Call the callback with proper format
        const matchesCreated = result.matchesCreated || result.data?.matchesCreated || 0;
        
        onScheduleGenerated?.({
          success: true,
          matchesCreated,
          schedule: {
            totalMatches: matchesCreated,
            format: config.format,
            summary: result.data?.summary
          }
        });
        
        // Success message
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`✅ Generated ${matchesCreated} matches successfully!`, 'success');
        }
      } else {
        throw new Error(result.error || result.details || 'Failed to generate schedule');
      }
    } catch (error) {
      console.error('❌ Schedule generation error:', error);
      setErrors([`Failed to generate: ${error.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewSchedule = () => {
    if (!validateForm()) return;
    
    // Generate preview (simplified calculation)
    const teamCount = teams.length;
    const totalMatches = config.format === 'double-round-robin' 
      ? teamCount * (teamCount - 1) 
      : (teamCount * (teamCount - 1)) / 2;
    
    const totalRounds = config.format === 'double-round-robin'
      ? teamCount * 2 - 2
      : teamCount - 1;
    
    const startDate = new Date(config.startDate);
    const endDate = new Date(startDate.getTime() + (totalRounds * config.daysBetweenRounds * 24 * 60 * 60 * 1000));
    
    setPreviewSchedule({
      format: config.format,
      totalMatches,
      totalRounds,
      startDate: config.startDate,
      endDate: endDate.toISOString().split('T')[0],
      matchesPerTeam: config.format === 'double-round-robin' ? (teamCount - 1) * 2 : (teamCount - 1),
      duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    });
    
    setShowPreview(true);
  };

  const handleClearSchedule = async () => {
    if (!confirm('Are you sure you want to delete all matches? This cannot be undone.')) {
      return;
    }

    try {
      setIsGenerating(true);
      console.log('🗑️ Clearing all matches for league:', selectedLeague);
      
      // Delete matches using the existing delete endpoint
      const matchesToDelete = currentMatches || [];
      
      for (const match of matchesToDelete) {
        await fetch(`/api/matches?id=${match._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
      }

      onScheduleGenerated?.({ 
        success: true, 
        cleared: true,
        matchesDeleted: matchesToDelete.length
      });
      
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('🗑️ All matches cleared successfully!', 'success');
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Clear matches error:', error);
      setErrors([`Failed to clear matches: ${error.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTimePeriod = (index, value) => {
    const newTimePeriods = [...config.timePeriods];
    newTimePeriods[index] = value;
    setConfig(prev => ({ ...prev, timePeriods: newTimePeriods }));
  };

  const addTimePeriod = () => {
    if (config.timePeriods.length < 5) {
      setConfig(prev => ({
        ...prev,
        timePeriods: [...prev.timePeriods, '20:00']
      }));
    }
  };

  const removeTimePeriod = (index) => {
    if (config.timePeriods.length > 1) {
      setConfig(prev => ({
        ...prev,
        timePeriods: prev.timePeriods.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateMatches = () => {
    const teamCount = teams.length;
    if (teamCount < 2) return 0;
    
    return config.format === 'double-round-robin' 
      ? teamCount * (teamCount - 1) 
      : (teamCount * (teamCount - 1)) / 2;
  };

  const calculateRounds = () => {
    const teamCount = teams.length;
    if (teamCount < 2) return 0;
    
    return config.format === 'double-round-robin'
      ? teamCount * 2 - 2
      : teamCount - 1;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        
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
                  Create a complete tournament schedule for {teams.length} teams
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
              disabled={isGenerating}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {!showPreview ? (
          /* Configuration Form */
          <div className="p-6 space-y-6">
            
            {/* Error Display */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Configuration Errors</span>
                </div>
                <ul className="text-red-300 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* League Check */}
            {!selectedLeague && (
              <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">League Required</span>
                </div>
                <p className="text-orange-300 text-sm mt-1">
                  Please select a league first.
                </p>
              </div>
            )}

            {/* Format Selection */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Tournament Format</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formats.map(format => (
                  <label 
                    key={format.value} 
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      config.format === format.value 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={config.format === format.value}
                      onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value }))}
                      className="sr-only"
                      disabled={isGenerating}
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
                        <p className="text-slate-400 text-sm">{format.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Schedule Timing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tournament Start Date *
                  </label>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Days Between Rounds *
                  </label>
                  <select
                    value={config.daysBetweenRounds}
                    onChange={(e) => setConfig(prev => ({ ...prev, daysBetweenRounds: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  >
                    <option value={3}>Every 3 days</option>
                    <option value={7}>Every week (Recommended)</option>
                    <option value={10}>Every 10 days</option>
                    <option value={14}>Every 2 weeks</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Time Periods */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Match Time Periods</h4>
              <div className="space-y-3">
                {config.timePeriods.map((time, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimePeriod(index, e.target.value)}
                      className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={isGenerating}
                    />
                    {config.timePeriods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimePeriod(index)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                        disabled={isGenerating}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addTimePeriod}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                  disabled={isGenerating || config.timePeriods.length >= 5}
                >
                  <Clock className="w-4 h-4" />
                  Add Time Period
                </button>
              </div>
            </div>

            {/* Options */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Options</h4>
              <label className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <input
                  type="checkbox"
                  checked={config.deleteExisting}
                  onChange={(e) => setConfig(prev => ({ ...prev, deleteExisting: e.target.checked }))}
                  className="mt-1 text-orange-500 focus:ring-orange-500 rounded"
                  disabled={isGenerating}
                />
                <div>
                  <div className="text-white font-medium">Delete Existing Matches</div>
                  <div className="text-slate-400 text-sm">
                    Remove all current matches before generating new schedule
                  </div>
                </div>
              </label>
            </div>

            {/* Quick Summary */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h5 className="text-orange-400 font-medium mb-2">Schedule Preview</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-white">{teams.length}</div>
                  <div className="text-slate-400">Teams</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{calculateMatches()}</div>
                  <div className="text-slate-400">Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{calculateRounds()}</div>
                  <div className="text-slate-400">Rounds</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {config.format === 'double-round-robin' ? (teams.length - 1) * 2 : (teams.length - 1)}
                  </div>
                  <div className="text-slate-400">Per Team</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              {currentMatches && currentMatches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
              
              <button
                type="button"
                onClick={handlePreviewSchedule}
                disabled={isGenerating || teams.length < 2}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Preview
              </button>
              
              <button
                type="button"
                onClick={handleGenerateAndSave}
                disabled={isGenerating || teams.length < 2 || !selectedLeague}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  `🚀 Generate ${calculateMatches()} Matches`
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Preview Display */
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h4 className="text-xl font-semibold text-white mb-4">Schedule Preview</h4>
              <div className="bg-slate-700/30 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{previewSchedule?.totalMatches}</div>
                    <div className="text-slate-400">Total Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{previewSchedule?.totalRounds}</div>
                    <div className="text-slate-400">Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{previewSchedule?.matchesPerTeam}</div>
                    <div className="text-slate-400">Per Team</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{Math.ceil(previewSchedule?.duration / 7)}</div>
                    <div className="text-slate-400">Weeks</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Format:</span>
                      <span className="text-white ml-2">{previewSchedule?.format}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white ml-2">{previewSchedule?.duration} days</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Start:</span>
                      <span className="text-white ml-2">{previewSchedule?.startDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">End:</span>
                      <span className="text-white ml-2">{previewSchedule?.endDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Back to Config
              </button>
              <button
                onClick={handleGenerateAndSave}
                disabled={isGenerating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  `✅ Confirm & Generate`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGenerator;