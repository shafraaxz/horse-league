// components/matches/ScheduleGenerator.js - Responsive Schedule Generator
import React, { useState } from 'react';
import { Calendar, Clock, Users, Settings, Shuffle, X, Download } from 'lucide-react';

const ScheduleGenerator = ({ 
  league, 
  teams = [], 
  onGenerate, 
  onClose, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    scheduleType: 'round-robin',
    homeAwayFormat: 'double',
    matchesPerWeek: 2,
    matchDuration: 90,
    restDaysBetweenMatches: 3,
    preferredDays: ['saturday', 'sunday'],
    preferredTimes: ['15:00', '17:00'],
    venues: [''],
    excludeDates: ['']
  });

  const [generatedFixtures, setGeneratedFixtures] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'preferredDays') {
      setFormData(prev => ({
        ...prev,
        preferredDays: checked 
          ? [...prev.preferredDays, value]
          : prev.preferredDays.filter(day => day !== value)
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const generateRoundRobinFixtures = () => {
    if (teams.length < 2) return [];
    
    const fixtures = [];
    const teamCount = teams.length;
    const isOdd = teamCount % 2 === 1;
    const rounds = isOdd ? teamCount : teamCount - 1;
    const matchesPerRound = Math.floor(teamCount / 2);
    
    // Add bye team if odd number of teams
    const teamList = isOdd ? [...teams, { _id: 'bye', name: 'BYE' }] : [...teams];
    
    for (let round = 0; round < rounds; round++) {
      const roundFixtures = [];
      
      for (let match = 0; match < matchesPerRound; match++) {
        const homeIndex = (round + match) % (teamList.length - 1);
        const awayIndex = (teamList.length - 1 - match + round) % (teamList.length - 1);
        
        const homeTeam = match === 0 ? teamList[teamList.length - 1] : teamList[homeIndex];
        const awayTeam = teamList[awayIndex];
        
        // Skip matches with BYE team
        if (homeTeam._id !== 'bye' && awayTeam._id !== 'bye') {
          roundFixtures.push({
            round: round + 1,
            homeTeam,
            awayTeam,
            homeTeamId: homeTeam._id,
            awayTeamId: awayTeam._id
          });
        }
      }
      
      if (roundFixtures.length > 0) {
        fixtures.push(...roundFixtures);
      }
    }
    
    // Add return fixtures for double round-robin
    if (formData.homeAwayFormat === 'double') {
      const returnFixtures = fixtures.map(fixture => ({
        ...fixture,
        round: fixture.round + rounds,
        homeTeam: fixture.awayTeam,
        awayTeam: fixture.homeTeam,
        homeTeamId: fixture.awayTeamId,
        awayTeamId: fixture.homeTeamId
      }));
      fixtures.push(...returnFixtures);
    }
    
    return fixtures;
  };

  const generateKnockoutFixtures = () => {
    if (teams.length < 2) return [];
    
    const fixtures = [];
    let currentTeams = [...teams];
    let round = 1;
    
    while (currentTeams.length > 1) {
      const roundFixtures = [];
      const nextRoundTeams = [];
      
      // Shuffle teams for random pairing
      const shuffledTeams = [...currentTeams].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        if (i + 1 < shuffledTeams.length) {
          roundFixtures.push({
            round,
            homeTeam: shuffledTeams[i],
            awayTeam: shuffledTeams[i + 1],
            homeTeamId: shuffledTeams[i]._id,
            awayTeamId: shuffledTeams[i + 1]._id,
            isKnockout: true
          });
          
          // For preview, assume home team wins (in real scenario, this would be determined after match)
          nextRoundTeams.push(shuffledTeams[i]);
        } else {
          // Odd team gets bye to next round
          nextRoundTeams.push(shuffledTeams[i]);
        }
      }
      
      fixtures.push(...roundFixtures);
      currentTeams = nextRoundTeams;
      round++;
    }
    
    return fixtures;
  };

  const generateMatchDates = (fixtures) => {
    if (!formData.startDate) return fixtures;
    
    const startDate = new Date(formData.startDate);
    const fixturesWithDates = [];
    let currentDate = new Date(startDate);
    let matchesThisWeek = 0;
    
    fixtures.forEach((fixture, index) => {
      // Skip to next valid day
      while (!formData.preferredDays.includes(getDayName(currentDate.getDay()))) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Check if we need to move to next week
      if (matchesThisWeek >= formData.matchesPerWeek) {
        // Move to next week's first preferred day
        const daysToAdd = 7 - currentDate.getDay() + getDayNumber(formData.preferredDays[0]);
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        matchesThisWeek = 0;
      }
      
      // Set time
      const timeIndex = index % formData.preferredTimes.length;
      const [hours, minutes] = formData.preferredTimes[timeIndex].split(':');
      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      fixturesWithDates.push({
        ...fixture,
        matchDate: new Date(currentDate),
        venue: formData.venues[0] || `${fixture.homeTeam.name} Home Ground`
      });
      
      matchesThisWeek++;
      
      // Add rest days
      currentDate.setDate(currentDate.getDate() + formData.restDaysBetweenMatches);
    });
    
    return fixturesWithDates;
  };

  const getDayName = (dayNumber) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  };

  const getDayNumber = (dayName) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(dayName);
  };

  const downloadScheduleTemplate = () => {
    if (generatedFixtures.length === 0) return;
    
    const csvHeader = ['League', 'Home Team', 'Away Team', 'Match Date', 'Kickoff Time', 'Venue', 'Round', 'Status'];
    const csvRows = generatedFixtures.map(fixture => [
      league.name,
      fixture.homeTeam.name,
      fixture.awayTeam.name,
      fixture.matchDate ? fixture.matchDate.toISOString().split('T')[0] : '',
      fixture.matchDate ? fixture.matchDate.toTimeString().slice(0, 5) : '',
      fixture.venue || '',
      fixture.round || '',
      'scheduled'
    ]);

    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${league.name}_schedule.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePreviewGeneration = () => {
    let fixtures = [];
    
    if (formData.scheduleType === 'round-robin') {
      fixtures = generateRoundRobinFixtures();
    } else {
      fixtures = generateKnockoutFixtures();
    }
    
    const fixturesWithDates = generateMatchDates(fixtures);
    setGeneratedFixtures(fixturesWithDates);
    setShowPreview(true);
  };

  const handleConfirmGeneration = async () => {
    try {
      await onGenerate({
        leagueId: league._id,
        fixtures: generatedFixtures,
        settings: formData
      });
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold">Schedule Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {generatedFixtures.length} matches generated for {league.name}
            </p>
          </div>
          
          <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            <div className="space-y-2 sm:space-y-4">
              {generatedFixtures.map((fixture, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                    <div className="text-xs sm:text-sm text-gray-500">Round {fixture.round}</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm sm:text-base">{fixture.homeTeam.name}</span>
                      <span className="text-gray-400 text-sm">vs</span>
                      <span className="font-medium text-sm sm:text-base">{fixture.awayTeam.name}</span>
                    </div>
                  </div>
                  {fixture.matchDate && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      {fixture.matchDate.toLocaleDateString()} at {fixture.matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base"
            >
              Back to Settings
            </button>
            <button
              onClick={downloadScheduleTemplate}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handleConfirmGeneration}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Generating...' : 'Confirm & Generate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold flex items-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Generate Schedule for {league.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            {teams.length} teams registered
          </p>
        </div>

        <div className="p-4 sm:p-6 max-h-96 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
              <Settings className="w-4 h-4 mr-2" />
              Tournament Format
            </h4>
            
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Type
                </label>
                <select
                  name="scheduleType"
                  value={formData.scheduleType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="round-robin">Round Robin</option>
                  <option value="knockout">Knockout</option>
                </select>
              </div>

              {formData.scheduleType === 'round-robin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    name="homeAwayFormat"
                    value={formData.homeAwayFormat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="single">Single Round</option>
                    <option value="double">Double Round (Home & Away)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Date Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
              <Clock className="w-4 h-4 mr-2" />
              Schedule Settings
            </h4>
            
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matches per Week
                </label>
                <input
                  type="number"
                  name="matchesPerWeek"
                  value={formData.matchesPerWeek}
                  onChange={handleInputChange}
                  min="1"
                  max="7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Days
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="preferredDays"
                      value={day}
                      checked={formData.preferredDays.includes(day)}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs sm:text-sm capitalize">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Times
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {formData.preferredTimes.map((time, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleArrayChange('preferredTimes', index, e.target.value)}
                      className="flex-1 px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {formData.preferredTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('preferredTimes', index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('preferredTimes')}
                  className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-dashed border-gray-300 rounded-md hover:border-gray-400 text-gray-600"
                >
                  + Add Time
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rest Days Between Matches
              </label>
              <input
                type="number"
                name="restDaysBetweenMatches"
                value={formData.restDaysBetweenMatches}
                onChange={handleInputChange}
                min="0"
                max="14"
                className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum days between matches for the same team</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Venues
              </label>
              <div className="space-y-2">
                {formData.venues.map((venue, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => handleArrayChange('venues', index, e.target.value)}
                      placeholder="Venue name (optional)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                    {formData.venues.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('venues', index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('venues')}
                  className="px-3 py-2 text-sm border border-dashed border-gray-300 rounded-md hover:border-gray-400 text-gray-600"
                >
                  + Add Venue
                </button>
              </div>
            </div>
          </div>

          {/* Match Statistics Preview */}
          {teams.length >= 2 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Schedule Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Teams:</span>
                  <div className="text-blue-800">{teams.length}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Total Matches:</span>
                  <div className="text-blue-800">
                    {formData.scheduleType === 'round-robin'
                      ? Math.floor(teams.length / 2) * (teams.length % 2 === 0 ? teams.length - 1 : teams.length) * (formData.homeAwayFormat === 'double' ? 2 : 1)
                      : teams.length - 1
                    }
                  </div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Rounds:</span>
                  <div className="text-blue-800">
                    {formData.scheduleType === 'round-robin'
                      ? (teams.length % 2 === 0 ? teams.length - 1 : teams.length) * (formData.homeAwayFormat === 'double' ? 2 : 1)
                      : Math.ceil(Math.log2(teams.length))
                    }
                  </div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Duration:</span>
                  <div className="text-blue-800">
                    {formData.startDate ? 
                      `~${Math.ceil(
                        (formData.scheduleType === 'round-robin'
                          ? Math.floor(teams.length / 2) * (teams.length % 2 === 0 ? teams.length - 1 : teams.length) * (formData.homeAwayFormat === 'double' ? 2 : 1)
                          : teams.length - 1
                        ) / formData.matchesPerWeek
                      )} weeks` 
                      : 'Set start date'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handlePreviewGeneration}
            disabled={!formData.startDate || teams.length < 2}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Shuffle className="w-4 h-4" />
            <span>Preview Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGenerator;