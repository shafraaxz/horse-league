import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Users, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  User,
  Trophy
} from 'lucide-react';

const TransferModal = ({ 
  player, 
  onClose, 
  onTransfer, 
  currentSeason,
  availableTeams = [] 
}) => {
  const [formData, setFormData] = useState({
    teamId: '',
    transferFee: '',
    transferType: 'permanent', // permanent, loan, free
    contractDuration: '',
    notes: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  const transferTypes = [
    { 
      value: 'permanent', 
      label: 'Permanent Transfer',
      description: 'Player moves permanently to new team',
      icon: ArrowRightLeft 
    },
    { 
      value: 'loan', 
      label: 'Loan Transfer',
      description: 'Temporary move with return clause',
      icon: Calendar 
    },
    { 
      value: 'free', 
      label: 'Free Transfer',
      description: 'No transfer fee required',
      icon: CheckCircle 
    }
  ];

  useEffect(() => {
    loadTeams();
  }, [currentSeason]);

  useEffect(() => {
    if (formData.teamId) {
      const team = teams.find(t => t.id.toString() === formData.teamId.toString());
      setSelectedTeam(team || null);
    } else {
      setSelectedTeam(null);
    }
  }, [formData.teamId, teams]);

  const loadTeams = () => {
    try {
      const teamsKey = `teams_${currentSeason?.id || 'default'}`;
      const storedTeams = JSON.parse(localStorage.getItem(teamsKey) || '[]');
      
      // Filter out the player's current team if they have one
      const availableTeams = storedTeams.filter(team => 
        team.name !== player.currentTeam
      );
      
      setTeams(availableTeams);
    } catch (error) {
      console.error('Failed to load teams:', error);
      setTeams([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Team selection is required
    if (!formData.teamId) {
      newErrors.teamId = 'Please select a destination team';
    }

    // Transfer fee validation for paid transfers
    if (formData.transferType === 'permanent' && formData.transferFee) {
      const fee = parseFloat(formData.transferFee);
      if (isNaN(fee) || fee < 0) {
        newErrors.transferFee = 'Transfer fee must be a valid positive number';
      } else if (fee > 1000000) {
        newErrors.transferFee = 'Transfer fee seems unusually high';
      }
    }

    // Contract duration for loans
    if (formData.transferType === 'loan') {
      if (!formData.contractDuration) {
        newErrors.contractDuration = 'Contract duration is required for loan transfers';
      } else {
        const duration = parseInt(formData.contractDuration);
        if (isNaN(duration) || duration < 1 || duration > 24) {
          newErrors.contractDuration = 'Contract duration must be between 1 and 24 months';
        }
      }
    }

    // Effective date validation
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    } else {
      const effectiveDate = new Date(formData.effectiveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (effectiveDate < today) {
        newErrors.effectiveDate = 'Effective date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const transferData = {
        playerId: player.id,
        playerName: player.name,
        fromTeam: player.currentTeam || 'Free Agent',
        toTeam: selectedTeam?.name || '',
        teamId: parseInt(formData.teamId),
        transferType: formData.transferType,
        transferFee: formData.transferType === 'free' ? 0 : (parseFloat(formData.transferFee) || 0),
        contractDuration: formData.transferType === 'loan' ? parseInt(formData.contractDuration) : null,
        effectiveDate: formData.effectiveDate,
        notes: formData.notes.trim(),
        season: currentSeason?.id || 'default',
        transferDate: new Date().toISOString(),
        status: 'completed' // In a real system, this might be 'pending' first
      };

      await onTransfer(transferData);
    } catch (error) {
      console.error('Transfer failed:', error);
      setErrors({ submit: 'Failed to complete transfer. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateTransferSummary = () => {
    const selectedType = transferTypes.find(t => t.value === formData.transferType);
    const fee = formData.transferType === 'free' ? 0 : (parseFloat(formData.transferFee) || 0);
    
    return {
      type: selectedType?.label || 'Transfer',
      fee: fee,
      duration: formData.transferType === 'loan' ? `${formData.contractDuration} months` : 'Permanent',
      team: selectedTeam?.name || 'No team selected'
    };
  };

  const transferSummary = calculateTransferSummary();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowRightLeft className="mr-3" size={24} />
              Transfer Player
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete the transfer process for {player.name}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <AlertCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Player Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <User className="mr-2" size={18} />
              Player Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Name:</span>
                <div className="text-blue-900">{player.name}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Position:</span>
                <div className="text-blue-900">{player.position}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Age:</span>
                <div className="text-blue-900">{player.age} years</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Current Status:</span>
                <div className="text-blue-900">{player.currentTeam || 'Free Agent'}</div>
              </div>
            </div>
          </div>

          {/* Transfer Type Selection */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Transfer Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transferTypes.map(type => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.transferType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, transferType: type.value })}
                  >
                    <div className="flex items-center mb-2">
                      <Icon size={18} className="text-blue-600 mr-2" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Destination Team</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Team *
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.teamId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Choose destination team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.playerCount || 0} players)
                  </option>
                ))}
              </select>
              {errors.teamId && <p className="text-red-500 text-xs mt-1">{errors.teamId}</p>}
            </div>

            {/* Selected Team Info */}
            {selectedTeam && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedTeam.name}</div>
                      <div className="text-sm text-gray-600">
                        Coach: {selectedTeam.coach} • Players: {selectedTeam.playerCount || 0}
                      </div>
                    </div>
                  </div>
                  {selectedTeam.wins !== undefined && (
                    <div className="text-right text-sm">
                      <div className="text-gray-900 font-medium">{selectedTeam.points || 0} pts</div>
                      <div className="text-gray-600">{selectedTeam.wins || 0}W {selectedTeam.losses || 0}L</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transfer Fee (not for free transfers) */}
            {formData.transferType !== 'free' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Fee {formData.transferType === 'permanent' ? '*' : ''}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.transferFee}
                    onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.transferFee ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
                {errors.transferFee && <p className="text-red-500 text-xs mt-1">{errors.transferFee}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for free transfer within this category
                </p>
              </div>
            )}

            {/* Contract Duration (for loans) */}
            {formData.transferType === 'loan' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Duration (Months) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.contractDuration}
                  onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contractDuration ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="6"
                  disabled={loading}
                />
                {errors.contractDuration && <p className="text-red-500 text-xs mt-1">{errors.contractDuration}</p>}
              </div>
            )}

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date *
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.effectiveDate ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.effectiveDate && <p className="text-red-500 text-xs mt-1">{errors.effectiveDate}</p>}
            </div>
          </div>

          {/* Transfer Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transfer Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this transfer..."
              disabled={loading}
            />
          </div>

          {/* Transfer Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-900 mb-3 flex items-center">
              <Info className="mr-2" size={18} />
              Transfer Summary
            </h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Player:</span>
                <div className="font-medium text-green-900">{player.name}</div>
              </div>
              <div>
                <span className="text-green-700">Destination:</span>
                <div className="font-medium text-green-900">{transferSummary.team}</div>
              </div>
              <div>
                <span className="text-green-700">Transfer Type:</span>
                <div className="font-medium text-green-900">{transferSummary.type}</div>
              </div>
              <div>
                <span className="text-green-700">Duration:</span>
                <div className="font-medium text-green-900">{transferSummary.duration}</div>
              </div>
              {transferSummary.fee > 0 && (
                <div className="col-span-2">
                  <span className="text-green-700">Transfer Fee:</span>
                  <div className="font-medium text-green-900">${transferSummary.fee.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || teams.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={16} className="mr-2" />
                  Complete Transfer
                </>
              )}
            </button>
          </div>

          {/* No teams warning */}
          {teams.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  No teams available for transfer. Please create teams first.
                </span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TransferModal;