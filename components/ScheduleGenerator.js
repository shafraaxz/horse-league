// Enhanced ScheduleGenerator with Cup formats - Replace your ScheduleGenerator.js

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Plus, Trash2, Trophy, Users, Target } from 'lucide-react';

const ScheduleGenerator = ({ isOpen, onClose, teams, selectedLeague, onScheduleGenerated, currentMatches }) => {
  const [config, setConfig] = useState({
    format: 'double-round-robin',
    cupFormat: 'single-elimination', // For cup tournaments
    groupStageTeams: 4, // Teams per group in group stage
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weekdays: ['tuesday', 'thursday', 'saturday'],
    timePeriods: ['18:00', '19:30'],
    stadiums: ['Manadhoo Futsal Ground', 'Central Arena', 'Sports Complex A'],
    matchesPerRound: 6,
    deleteExisting: true,
    balanceVenues: true,
    // Cup-specific settings
    hasGroupStage: false,
    groupAdvancement: 2, // Top N teams advance from each group
    knockoutRounds: 'auto', // or specific number
    thirdPlacePlayoff: false,
    seedTeams: false
  });

  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tournament format options
  const formatOptions = [
    {
      value: 'single-round-robin',
      label: 'Single Round Robin',
      description: 'Each team plays every other team once',
      icon: '🔄',
      category: 'league'
    },
    {
      value: 'double-round-robin',
      label: 'Double Round Robin',
      description: 'Each team plays every other team twice (home & away)',
      icon: '🔁',
      category: 'league'
    },
    {
      value: 'single-elimination',
      label: 'Single Elimination Cup',
      description: 'Direct knockout tournament',
      icon: '🏆',
      category: 'cup'
    },
    {
      value: 'double-elimination',
      label: 'Double Elimination Cup',
      description: 'Teams get a second chance',
      icon: '🏆🏆',
      category: 'cup'
    },
    {
      value: 'group-stage-knockout',
      label: 'Group Stage + Knockout',
      description: 'Group stage followed by knockout rounds',
      icon: '👥🏆',
      category: 'cup'
    },
    {
      value: 'swiss-system',
      label: 'Swiss System',
      description: 'Teams play others with similar records',
      icon: '🎯',
      category: 'special'
    }
  ];

  const cupFormatOptions = [
    { value: 'single-elimination', label: 'Single Elimination' },
    { value: 'double-elimination', label: 'Double Elimination' },
    { value: 'best-of-three', label: 'Best of 3' }
  ];

  // ✅ FIXED: Calculate preview with proper formulas
  const generatePreview = () => {
    if (teams.length < 2) return;
    
    const N = teams.length;
    let totalMatches = 0;
    let roundsNeeded = 0;
    let description = '';

    switch (config.format) {
      case 'single-round-robin':
        totalMatches = Math.floor(N * (N - 1) / 2);
        roundsNeeded = N - 1;
        description = `Formula: N(N-1)/2 = ${N}(${N-1})/2 = ${totalMatches} matches`;
        break;

      case 'double-round-robin':
        totalMatches = N * (N - 1);
        roundsNeeded = 2 * (N - 1);
        description = `Formula: N(N-1) = ${N}(${N-1}) = ${totalMatches} matches`;
        break;

      case 'single-elimination':
        totalMatches = N - 1;
        roundsNeeded = Math.ceil(Math.log2(N));
        description = `Knockout: ${N} teams → ${roundsNeeded} rounds, ${totalMatches} matches`;
        break;

      case 'double-elimination':
        totalMatches = (N - 1) * 2 - 1;
        roundsNeeded = Math.ceil(Math.log2(N)) * 2 - 1;
        description = `Double elimination: ${totalMatches} matches max`;
        break;

      case 'group-stage-knockout':
        const groupCount = Math.ceil(N / config.groupStageTeams);
        const groupMatches = groupCount * Math.floor(config.groupStageTeams * (config.groupStageTeams - 1) / 2);
        const advancingTeams = groupCount * config.groupAdvancement;
        const knockoutMatches = advancingTeams - 1;
        totalMatches = groupMatches + knockoutMatches;
        roundsNeeded = (config.groupStageTeams - 1) + Math.ceil(Math.log2(advancingTeams));
        description = `${groupCount} groups + knockout: ${groupMatches} + ${knockoutMatches} = ${totalMatches} matches`;
        break;

      case 'swiss-system':
        roundsNeeded = Math.ceil(Math.log2(N));
        totalMatches = Math.floor(N / 2) * roundsNeeded;
        description = `${roundsNeeded} Swiss rounds: ${totalMatches} matches`;
        break;
    }

    const schedulingRounds = Math.ceil(totalMatches / config.matchesPerRound);
    const weeksNeeded = Math.ceil(schedulingRounds / config.weekdays.length);
    
    setPreview({
      totalMatches,
      roundsNeeded,
      schedulingRounds,
      weeksNeeded,
      description,
      format: config.format,
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
      
      // Reset cup-specific settings when switching to league formats
      if (key === 'format') {
        const format = formatOptions.find(f => f.value === value);
        if (format.category === 'league') {
          updated.hasGroupStage = false;
          updated.thirdPlacePlayoff = false;
        }
      }
      
      // Adjust matches per round based on capacity
      if (key === 'timePeriods' || key === 'stadiums') {
        const maxSlots = updated.timePeriods.length * updated.stadiums.length;
        if (updated.matchesPerRound > maxSlots) {
          updated.matchesPerRound = maxSlots;
        }
      }
      
      return updated;
    });
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

  if (!isOpen) return null;

  const selectedFormat = formatOptions.find(f => f.value === config.format);
  const isCupFormat = selectedFormat?.category === 'cup';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Tournament Generator</h3>
                <p className="text-slate-400 text-sm">League & Cup tournament management</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Tournament Format Selection */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Tournament Format</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formatOptions.map(format => (
                  <button
                    key={format.value}
                    onClick={() => handleConfigChange('format', format.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      config.format === format.value
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{format.icon}</span>
                      <span className="font-semibold text-white">{format.label}</span>
                    </div>
                    <p className="text-sm text-slate-400">{format.description}</p>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        format.category === 'league' ? 'bg-blue-500/20 text-blue-400' :
                        format.category === 'cup' ? 'bg-red-500/20 text-red-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {format.category.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cup-specific settings */}
            {isCupFormat && (
              <div className="space-y-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-red-400" />
                  Cup Tournament Settings
                </h4>
                
                {config.format === 'group-stage-knockout' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Teams per Group</label>
                      <select
                        value={config.groupStageTeams}
                        onChange={(e) => handleConfigChange('groupStageTeams', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        <option value={3}>3 teams per group</option>
                        <option value={4}>4 teams per group</option>
                        <option value={5}>5 teams per group</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Teams Advance</label>
                      <select
                        value={config.groupAdvancement}
                        onChange={(e) => handleConfigChange('groupAdvancement', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        <option value={1}>Top 1 from each group</option>
                        <option value={2}>Top 2 from each group</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.thirdPlacePlayoff}
                      onChange={(e) => handleConfigChange('thirdPlacePlayoff', e.target.checked)}
                      className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                    />
                    <span className="text-slate-300">3rd Place Playoff</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.seedTeams}
                      onChange={(e) => handleConfigChange('seedTeams', e.target.checked)}
                      className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                    />
                    <span className="text-slate-300">Seed Teams</span>
                  </label>
                </div>
              </div>
            )}

            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Time Slots and Venues sections remain the same */}
            {/* ... (keep existing code for time slots and venues) ... */}

            {/* ✅ FIXED Preview */}
            {preview && (
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  📊 Tournament Preview
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{teams.length}</div>
                    <div className="text-slate-400 text-sm">Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{preview.totalMatches}</div>
                    <div className="text-slate-400 text-sm">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{preview.roundsNeeded}</div>
                    <div className="text-slate-400 text-sm">Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{preview.weeksNeeded}</div>
                    <div className="text-slate-400 text-sm">Weeks</div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-300 space-y-1">
                  <p><strong>📐 Formula:</strong> {preview.description}</p>
                  <p><strong>📅 Format:</strong> {selectedFormat?.label}</p>
                  <p><strong>🏁 Completion:</strong> {new Date(preview.estimatedEndDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-700 flex-shrink-0 bg-slate-800">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {currentMatches && currentMatches.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(`Clear all ${currentMatches.length} existing matches?`)) {
                    // Handle clear logic
                  }
                }}
                disabled={isGenerating}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Clear ({currentMatches.length})
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || teams.length < 2}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                `Generate ${preview?.totalMatches || 0} Matches`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGenerator;