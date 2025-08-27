// components/players/PlayerCard.js
import React from 'react';
import { User, Edit, Trash2, MapPin, Calendar } from 'lucide-react';

const PlayerCard = ({ player, onClick, onEdit, onDelete }) => {
  const getPositionColor = (position) => {
    switch (position) {
      case 'Goalkeeper':
        return 'bg-yellow-100 text-yellow-800';
      case 'Defender':
        return 'bg-blue-100 text-blue-800';
      case 'Midfielder':
        return 'bg-green-100 text-green-800';
      case 'Forward':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const stats = player.statistics || {};
  const age = calculateAge(player.dateOfBirth);

  return (
    <div 
      className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={() => onClick && onClick(player)}
    >
      {/* Header with Jersey Number */}
      <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg leading-tight">{player.name}</h3>
              {player.team && (
                <p className="text-blue-100 text-sm">{player.team.name}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{player.jerseyNumber}</div>
            <div className="text-xs text-blue-100">Jersey</div>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="p-4">
        {/* Position and Basic Info */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
            {player.position}
          </span>
          {player.nationality && (
            <span className="text-sm text-gray-600 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {player.nationality}
            </span>
          )}
        </div>

        {/* Physical Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
          {age && (
            <div>
              <div className="text-gray-600">Age</div>
              <div className="font-medium">{age}</div>
            </div>
          )}
          {player.height && (
            <div>
              <div className="text-gray-600">Height</div>
              <div className="font-medium">{player.height}cm</div>
            </div>
          )}
          {player.preferredFoot && (
            <div>
              <div className="text-gray-600">Foot</div>
              <div className="font-medium">{player.preferredFoot.charAt(0)}</div>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        {stats && (stats.matchesPlayed > 0 || stats.goals > 0 || stats.assists > 0) && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-3">
            <div>
              <div className="text-gray-600">Matches</div>
              <div className="font-medium">{stats.matchesPlayed || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">Goals</div>
              <div className="font-medium text-green-600">{stats.goals || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">Assists</div>
              <div className="font-medium text-blue-600">{stats.assists || 0}</div>
            </div>
          </div>
        )}

        {/* Goalkeeper specific stats */}
        {player.position === 'Goalkeeper' && stats && (stats.saves > 0 || stats.cleanSheets > 0) && (
          <div className="grid grid-cols-2 gap-2 text-center text-sm border-t pt-3 mt-3">
            <div>
              <div className="text-gray-600">Saves</div>
              <div className="font-medium text-purple-600">{stats.saves || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">Clean Sheets</div>
              <div className="font-medium text-green-600">{stats.cleanSheets || 0}</div>
            </div>
          </div>
        )}

        {/* Disciplinary */}
        {stats && (stats.yellowCards > 0 || stats.redCards > 0) && (
          <div className="flex justify-center space-x-4 text-sm border-t pt-3 mt-3">
            {stats.yellowCards > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-4 bg-yellow-400 rounded-sm mr-1"></div>
                <span>{stats.yellowCards}</span>
              </div>
            )}
            {stats.redCards > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-4 bg-red-500 rounded-sm mr-1"></div>
                <span>{stats.redCards}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex border-t">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(player);
              }}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(player);
              }}
              className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;