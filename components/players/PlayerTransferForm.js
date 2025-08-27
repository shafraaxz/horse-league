// components/players/PlayerTransferForm.js - Transfer players between teams
import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  User, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const PlayerTransferForm = ({ player, teams, freeAgents, onSubmit, onCancel }) => {
  const [transferData, setTransferData] = useState({
    playerId: player?._id || '',
    fromTeam: player?.currentTeam?._id || null,
    toTeam: '',
    transferType: 'permanent', // permanent, loan, temporary
    transferFee: '',
    transferDate: new Date().toISOString().split('T')[0],
    contractDuration: '',
    salary: '',
    notes: '',
    approvalRequired: false
  });

  const [selectedPlayer, setSelectedPlayer] = useState(player || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const transferTypes = [
    { value: 'permanent', label: 'Permanent Transfer', description: 'Player permanently joins the new team' },
    { value: 'loan', label: 'Loan', description: 'Player temporarily joins team but returns to original team' },
    { value: 'temporary', label: 'Temporary', description: 'Short-term assignment to team' },
    { value: 'free_transfer', label: 'Free Transfer', description: 'No transfer fee involved' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!selectedPlayer) {
      newErrors.player = 'Please select a player to transfer';
    }

    if (!transferData.toTeam) {
      newErrors.toTeam = 'Please select destination team';
    }

    if (transferData.fromTeam === transferData.toTeam) {
      newErrors.toTeam = 'Player is already in this team';
    }

    if (!transferData.transferDate) {
      newErrors.transferDate = 'Transfer date is required';
    }

    if (transferData.transferFee && parseFloat(transferData.transferFee) < 0) {
      newErrors.transferFee = 'Transfer fee cannot be negative';
    }

    if (transferData.salary && parseFloat(transferData.salary) < 0) {
      newErrors.salary = 'Salary cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user makes changes
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePlayerSelect = (playerId) => {
    const player = freeAgents.find(p => p._id === playerId);
    setSelectedPlayer(player);
    setTransferData(prev => ({
      ...prev,
      playerId: playerId,
      fromTeam: player?.currentTeam?._id || null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const finalTransferData = {
        ...transferData,
        playerId: selectedPlayer._id,
        transferFee: transferData.transferFee ? parseFloat(transferData.transferFee) : 0,
        salary: transferData.salary ? parseFloat(transferData.salary) : 0,
        transferDate: new Date(transferData.transferDate),
        status: transferData.approvalRequired ? 'pending' : 'completed'
      };

      await onSubmit(finalTransferData);
    } catch (error) {
      console.error('Error processing transfer:', error);
      setErrors({ submit: error.message || 'Failed to process transfer' });
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t._id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const destinationTeam = teams.find(t => t._id === transferData.toTeam);
  const sourceTeam = selectedPlayer?.currentTeam;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transfer Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Player Transfer</h3>
        <p className="text-gray-600">Transfer a player to a new team</p>
      </div>

      {/* Player Selection (if no specific player selected) */}
      {!player && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Select Player
          </label>
          <select
            name="playerId"
            value={transferData.playerId}
            onChange={(e) => handlePlayerSelect(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.player ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a player to transfer</option>
            {freeAgents.map(player => (
              <option key={player._id} value={player._id}>
                {player.name} - {player.position} 
                {player.currentTeam ? ` (${player.currentTeam.name})` : ' (Free Agent)'}
              </option>
            ))}
          </select>
          {errors.player && <p className="text-red-500 text-sm mt-1">{errors.player}</p>}
        </div>
      )}

      {/* Selected Player Info */}
      {selectedPlayer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            {selectedPlayer.photo ? (
              <img
                src={selectedPlayer.photo}
                alt={selectedPlayer.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{selectedPlayer.name}</h4>
              <p className="text-sm text-gray-600">
                {selectedPlayer.position} • Age {selectedPlayer.age}
              </p>
              <p className="text-sm text-blue-600">
                {sourceTeam ? `Currently at ${sourceTeam.name}` : 'Free Agent'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Team
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
            {sourceTeam ? sourceTeam.name : 'Free Agent'}
          </div>
        </div>

        {/* To Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="w-4 h-4 inline mr-1" />
            To Team *
          </label>
          <select
            name="toTeam"
            value={transferData.toTeam}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.toTeam ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select destination team</option>
            {teams
              .filter(team => team._id !== transferData.fromTeam)
              .map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))
            }
          </select>
          {errors.toTeam && <p className="text-red-500 text-sm mt-1">{errors.toTeam}</p>}
        </div>
      </div>

      {/* Transfer Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transfer Type
        </label>
        <div className="space-y-2">
          {transferTypes.map(type => (
            <label key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="transferType"
                value={type.value}
                checked={transferData.transferType === type.value}
                onChange={handleInputChange}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Transfer Fee
          </label>
          <input
            type="number"
            name="transferFee"
            value={transferData.transferFee}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.transferFee ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.transferFee && <p className="text-red-500 text-sm mt-1">{errors.transferFee}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salary/Wage
          </label>
          <input
            type="number"
            name="salary"
            value={transferData.salary}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.salary ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
        </div>
      </div>

      {/* Contract Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Transfer Date *
          </label>
          <input
            type="date"
            name="transferDate"
            value={transferData.transferDate}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.transferDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.transferDate && <p className="text-red-500 text-sm mt-1">{errors.transferDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Duration
          </label>
          <select
            name="contractDuration"
            value={transferData.contractDuration}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select duration</option>
            <option value="1_month">1 Month</option>
            <option value="3_months">3 Months</option>
            <option value="6_months">6 Months</option>
            <option value="1_year">1 Year</option>
            <option value="2_years">2 Years</option>
            <option value="permanent">Permanent</option>
          </select>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <FileText className="w-4 h-4 inline mr-1" />
          Transfer Notes
        </label>
        <textarea
          name="notes"
          value={transferData.notes}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes about the transfer..."
        />
      </div>

      {/* Approval Required */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="approvalRequired"
          checked={transferData.approvalRequired}
          onChange={handleInputChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="text-sm text-gray-700">
          Requires approval from league administrators
        </label>
      </div>

      {/* Transfer Summary */}
      {selectedPlayer && destinationTeam && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-medium text-green-800">Transfer Summary</h4>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>
              <strong>{selectedPlayer.name}</strong> will be transferred from{' '}
              <strong>{sourceTeam ? sourceTeam.name : 'Free Agency'}</strong> to{' '}
              <strong>{destinationTeam.name}</strong>
            </p>
            <p>Transfer Type: <strong>{transferTypes.find(t => t.value === transferData.transferType)?.label}</strong></p>
            {transferData.transferFee && (
              <p>Transfer Fee: <strong>${parseFloat(transferData.transferFee).toFixed(2)}</strong></p>
            )}
            <p>Transfer Date: <strong>{new Date(transferData.transferDate).toLocaleDateString()}</strong></p>
            {transferData.approvalRequired && (
              <p className="text-amber-600">⚠️ This transfer will require approval before completion</p>
            )}
          </div>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedPlayer || !transferData.toTeam}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Transfer...
            </span>
          ) : (
            transferData.approvalRequired ? 'Submit for Approval' : 'Complete Transfer'
          )}
        </button>
      </div>
    </form>
  );
};

export default PlayerTransferForm;
          