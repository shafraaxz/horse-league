import React, { useState } from 'react';
import { ChevronDown, Plus, Calendar } from 'lucide-react';

const SeasonSelector = ({ currentSeason, seasons, onSeasonChange, onCreateSeason }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSeasonYear, setNewSeasonYear] = useState('');

  const handleCreateSeason = () => {
    const startYear = parseInt(newSeasonYear);
    if (startYear && startYear >= 2024 && startYear <= 2050) {
      const existingSeason = seasons.find(s => s.startYear === startYear);
      if (!existingSeason) {
        const newSeason = onCreateSeason(startYear);
        onSeasonChange(newSeason.id);
        setShowCreateForm(false);
        setNewSeasonYear('');
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Calendar size={16} className="text-blue-600" />
        <span className="font-medium text-blue-800">Season {currentSeason.name}</span>
        <ChevronDown size={16} className={`text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Select Season
            </div>
            {seasons.map(season => (
              <button
                key={season.id}
                onClick={() => {
                  onSeasonChange(season.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  currentSeason.id === season.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span>{season.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  season.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : season.status === 'upcoming'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {season.status}
                </span>
              </button>
            ))}
            
            <div className="border-t border-gray-100 mt-2">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Create New Season</span>
                </button>
              ) : (
                <div className="p-3 space-y-2">
                  <input
                    type="number"
                    placeholder="Start year (e.g., 2025)"
                    value={newSeasonYear}
                    onChange={(e) => setNewSeasonYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="2024"
                    max="2050"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateSeason}
                      className="flex-1 py-1 px-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewSeasonYear('');
                      }}
                      className="flex-1 py-1 px-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonSelector;