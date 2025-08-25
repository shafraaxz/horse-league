import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Settings, RefreshCw, AlertCircle } from 'lucide-react';

const ScheduleGenerator = ({ onClose, onGenerate, currentSeason }) => {
  const [teams, setTeams] = useState([]);
  const [params, setParams] = useState({
    startDate: new Date().toISOString().split('T')[0],
    rounds: 1,
    venue: 'Central Sports Complex',
    timeSlot: '19:00',
    matchDuration: 40,
    breakBetweenMatches: 15,
    daysPerWeek: 2,
    selectedDays: ['saturday', 'sunday'],
    tournamentType: 'round-robin',
    homeAwaySystem: true,
    venues: ['Central Sports Complex'],
    timeSlots: ['19:00']
  });
  
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const tournamentTypes = [
    {
      value: 'round-robin',
      label: 'Round Robin',
      description: 'Every team plays every other team'
    },
    {
      value: 'knockout',
      label: 'Knockout/Elimination',
      description: 'Single elimination tournament'
    },
    {
      value: 'double-elimination',
      label: 'Double Elimination',
      description: 'Teams eliminated after two losses'
    },
    {
      value: 'swiss',
      label: 'Swiss System',
      description: 'Teams paired based on performance'
    }
  ];

  useEffect(() => {
    loadTeams();
  }, [currentSeason]);

  const loadTeams = () => {
    try {
      const teamsKey = `teams_${currentSeason?.id || 'default'}`;
      const storedTeams = JSON.parse(localStorage.getItem(teamsKey) || '[]');
      setTeams(storedTeams);
      setSelectedTeams(storedTeams.map(t => t.id)); // Select all by default
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedTeams.length < 2) {
      newErrors.teams = 'At least 2 teams are required';
    }

    if (!params.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!params.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    if (params.selectedDays.length === 0) {
      newErrors.days = 'Select at least one day of the week';
    }

    if (params.rounds < 1 || params.rounds > 10) {
      newErrors.rounds = 'Rounds must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDayChange = (day, checked) => {
    if (checked) {
      setParams({
        ...params,
        selectedDays: [...params.selectedDays, day]
      });
    } else {
      setParams({
        ...params,
        selectedDays: params.selectedDays.filter(d => d !== day)
      });
    }
  };

  const handleTeamSelection = (teamId, checked) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    }
  };

  const addVenue = () => {
    const newVenue = prompt('Enter venue name:');
    if (newVenue && newVenue.trim()) {
      setParams({
        ...params,
        venues: [...params.venues, newVenue.trim()]
      });
    }
  };

  const addTimeSlot = () => {
    const newTime = prompt('Enter time slot (HH:MM format):');
    if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      setParams({
        ...params,
        timeSlots: [...params.timeSlots, newTime]
      });
    } else if (newTime) {
      alert('Please enter time in HH:MM format (e.g., 19:00)');
    }
  };

  const generateRoundRobinMatches = () => {
    const selectedTeamObjects = teams.filter(t => selectedTeams.includes(t.id));
    const matches = [];
    let currentDate = new Date(params.startDate);
    let matchId = 1;

    // Generate matches for each round
    for (let round = 1; round <= params.rounds; round++) {
      for (let i = 0; i < selectedTeamObjects.length; i++) {
        for (let j = i + 1; j < selectedTeamObjects.length; j++) {
          const homeTeam = selectedTeamObjects[i];
          const awayTeam = selectedTeamObjects[j];
          
          // Find next available match day
          while (!params.selectedDays.includes(getDayName(currentDate))) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          const venue = params.venues[Math.floor(Math.random() * params.venues.length)];
          const timeSlot = params.timeSlots[Math.floor(Math.random() * params.timeSlots.length)];

          matches.push({
            id: matchId++,
            round: round,
            homeTeam: homeTeam.name,
            homeTeamId: homeTeam.id,
            awayTeam: awayTeam.name,
            awayTeamId: awayTeam.id,
            date: new Date(currentDate).toISOString(),
            time: timeSlot,
            venue: venue,
            status: 'scheduled',
            season: currentSeason?.id || 'default',
            homeScore: null,
            awayScore: null,
            duration: params.matchDuration
          });

          // Add home/away return match if enabled
          if (params.homeAwaySystem && round === 1) {
            // Schedule return match in a later round
            const returnDate = new Date(currentDate);
            returnDate.setDate(returnDate.getDate() + 7 * Math.ceil(selectedTeamObjects.length / 2));
            
            while (!params.selectedDays.includes(getDayName(returnDate))) {
              returnDate.setDate(returnDate.getDate() + 1);
            }

            matches.push({
              id: matchId++,
              round: params.rounds + 1,
              homeTeam: awayTeam.name,
              homeTeamId: awayTeam.id,
              awayTeam: homeTeam.name,
              awayTeamId: homeTeam.id,
              date: new Date(returnDate).toISOString(),
              time: timeSlot,
              venue: venue,
              status: 'scheduled',
              season: currentSeason?.id || 'default',
              homeScore: null,
              awayScore: null,
              duration: params.matchDuration
            });
          }

          // Move to next match day
          currentDate.setDate(currentDate.getDate() + Math.ceil(7 / params.daysPerWeek));
        }
      }
    }

    return matches;
  };

  const generateKnockoutMatches = () => {
    const selectedTeamObjects = teams.filter(t => selectedTeams.includes(t.id));
    const matches = [];
    let currentDate = new Date(params.startDate);
    let matchId = 1;
    
    // Create brackets
    let currentRoundTeams = [...selectedTeamObjects];
    let round = 1;

    while (currentRoundTeams.length > 1) {
      const roundMatches = [];
      
      for (let i = 0; i < currentRoundTeams.length; i += 2) {
        if (currentRoundTeams[i + 1]) {
          while (!params.selectedDays.includes(getDayName(currentDate))) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          const venue = params.venues[Math.floor(Math.random() * params.venues.length)];
          const timeSlot = params.timeSlots[Math.floor(Math.random() * params.timeSlots.length)];

          roundMatches.push({
            id: matchId++,
            round: round,
            roundName: getRoundName(round, currentRoundTeams.length),
            homeTeam: currentRoundTeams[i].name,
            homeTeamId: currentRoundTeams[i].id,
            awayTeam: currentRoundTeams[i + 1].name,
            awayTeamId: currentRoundTeams[i + 1].id,
            date: new Date(currentDate).toISOString(),
            time: timeSlot,
            venue: venue,
            status: 'scheduled',
            season: currentSeason?.id || 'default',
            homeScore: null,
            awayScore: null,
            duration: params.matchDuration,
            isKnockout: true
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      matches.push(...roundMatches);
      currentRoundTeams = roundMatches.map(m => ({ id: `winner_${m.id}`, name: `Winner of Match ${m.id}` }));
      round++;
      
      // Add break between rounds
      currentDate.setDate(currentDate.getDate() + 3);
    }

    return matches;
  };

  const getRoundName = (round, totalTeams) => {
    const teamsInRound = totalTeams;
    if (teamsInRound <= 2) return 'Final';
    if (teamsInRound <= 4) return 'Semi-Final';
    if (teamsInRound <= 8) return 'Quarter-Final';
    if (teamsInRound <= 16) return 'Round of 16';
    return `Round ${round}`;
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
  };

  const generatePreview = () => {
    if (!validateForm()) return;

    let matches = [];
    
    switch (params.tournamentType) {
      case 'round-robin':
        matches = generateRoundRobinMatches();
        break;
      case 'knockout':
        matches = generateKnockoutMatches();
        break;
      default:
        matches = generateRoundRobinMatches();
    }

    setPreview(matches);
    setShowPreview(true);
  };

  const handleGenerate = () => {
    if (preview.length === 0) {
      generatePreview();
      return;
    }

    const generationData = {
      matches: preview,
      tournament: {
        type: params.tournamentType,
        startDate: params.startDate,
        venues: params.venues,
        timeSlots: params.timeSlots,
        selectedTeams: selectedTeams,
        season: currentSeason?.id || 'default'
      }
    };

    onGenerate(generationData);
  };

  const selectedTeamObjects = teams.filter(t => selectedTeams.includes(t.id));
  const totalMatches = params.tournamentType === 'round-robin' 
    ? selectedTeams.length * (selectedTeams.length - 1) / 2 * params.rounds * (params.homeAwaySystem ? 2 : 1)
    : selectedTeams.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Schedule Generator</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create automated match schedules for {currentSeason?.name || 'current season'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              {/* Tournament Type */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Settings className="mr-2" size={18} />
                  Tournament Format
                </h4>
                <div className="space-y-3">
                  {tournamentTypes.map(type => (
                    <div
                      key={type.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        params.tournamentType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setParams({...params, tournamentType: type.value})}
                    >
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  ))}
                </div>
                {errors.tournamentType && <p className="text-red-500 text-xs mt-1">{errors.tournamentType}</p>}
              </div>

              {/* Team Selection */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="mr-2" size={18} />
                  Participating Teams ({selectedTeams.length}/{teams.length})
                </h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {teams.length > 0 ? (
                    <div className="space-y-2">
                      {teams.map(team => (
                        <label key={team.id} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(team.id)}
                            onChange={(e) => handleTeamSelection(team.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                          />
                          <span className="text-sm">{team.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No teams available for current season</p>
                  )}
                </div>
                {errors.teams && <p className="text-red-500 text-xs mt-1">{errors.teams}</p>}
              </div>

              {/* Schedule Configuration */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="mr-2" size={18} />
                  Schedule Configuration
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={params.startDate}
                        onChange={(e) => setParams({...params, startDate: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.startDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                    </div>

                    {params.tournamentType === 'round-robin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rounds
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={params.rounds}
                          onChange={(e) => setParams({...params, rounds: parseInt(e.target.value) || 1})}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.rounds ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.rounds && <p className="text-red-500 text-xs mt-1">{errors.rounds}</p>}
                      </div>
                    )}
                  </div>

                  {/* Days of the week */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <label key={day.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={params.selectedDays.includes(day.value)}
                            onChange={(e) => handleDayChange(day.value, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-1"
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.days && <p className="text-red-500 text-xs mt-1">{errors.days}</p>}
                  </div>

                  {params.tournamentType === 'round-robin' && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={params.homeAwaySystem}
                          onChange={(e) => setParams({...params, homeAwaySystem: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-sm font-medium">Home & Away System (Double Round Robin)</span>
                      </label>
                      <p className="text-xs text-gray-600 mt-1">Each team plays every other team twice</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Venues and Time Slots */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="mr-2" size={18} />
                  Venues
                </h4>
                <div className="space-y-2">
                  {params.venues.map((venue, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm">{venue}</span>
                      {params.venues.length > 1 && (
                        <button
                          onClick={() => setParams({
                            ...params,
                            venues: params.venues.filter((_, i) => i !== index)
                          })}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addVenue}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  >
                    + Add Venue
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="mr-2" size={18} />
                  Time Slots
                </h4>
                <div className="space-y-2">
                  {params.timeSlots.map((time, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm">{time}</span>
                      {params.timeSlots.length > 1 && (
                        <button
                          onClick={() => setParams({
                            ...params,
                            timeSlots: params.timeSlots.filter((_, i) => i !== index)
                          })}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTimeSlot}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  >
                    + Add Time Slot
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Schedule Summary</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>Teams: {selectedTeams.length}</div>
                  <div>Format: {tournamentTypes.find(t => t.value === params.tournamentType)?.label}</div>
                  <div>Estimated Matches: {totalMatches}</div>
                  <div>Duration: ~{Math.ceil(totalMatches / (params.selectedDays.length * params.timeSlots.length))} weeks</div>
                </div>
              </div>

              {preview.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">Preview Generated</h5>
                  <div className="text-sm text-green-700">
                    {preview.length} matches scheduled successfully
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && preview.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Schedule Preview</h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="space-y-2 p-4">
                  {preview.slice(0, 10).map(match => (
                    <div key={match.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{match.homeTeam}</span> vs <span className="font-medium">{match.awayTeam}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(match.date).toLocaleDateString()} • {match.time} • {match.venue}
                      </div>
                    </div>
                  ))}
                  {preview.length > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      ... and {preview.length - 10} more matches
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={generatePreview}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Generate Preview
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={preview.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGenerator;