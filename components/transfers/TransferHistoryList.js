// components/transfers/TransferHistoryList.js - Display transfer history
import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react';

const TransferHistoryList = ({ transfers, teams, players }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, pending, cancelled
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date_desc');

  const getFilteredTransfers = () => {
    let filtered = transfers.filter(transfer => {
      // Search filter
      const playerName = transfer.player?.name || '';
      const fromTeamName = transfer.fromTeam?.name || 'Free Agency';
      const toTeamName = transfer.toTeam?.name || '';
      const matchesSearch = 
        playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fromTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        toTeamName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

      // Transfer type filter
      const matchesType = transferTypeFilter === 'all' || transfer.transferType === transferTypeFilter;

      // Team filter (involved in transfer)
      const matchesTeam = !teamFilter || 
        transfer.fromTeam?._id === teamFilter || 
        transfer.toTeam?._id === teamFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const transferDate = new Date(transfer.transferDate);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            matchesDate = transferDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = transferDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = transferDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesTeam && matchesDate;
    });

    // Sort transfers
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.transferDate) - new Date(a.transferDate);
        case 'date_asc':
          return new Date(a.transferDate) - new Date(b.transferDate);
        case 'player':
          return (a.player?.name || '').localeCompare(b.player?.name || '');
        case 'fee_desc':
          return (b.transferFee || 0) - (a.transferFee || 0);
        case 'fee_asc':
          return (a.transferFee || 0) - (b.transferFee || 0);
        default:
          return 0;
      }
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransferTypeColor = (type) => {
    switch (type) {
      case 'permanent':
        return 'bg-blue-100 text-blue-800';
      case 'loan':
        return 'bg-purple-100 text-purple-800';
      case 'temporary':
        return 'bg-orange-100 text-orange-800';
      case 'free_transfer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportTransfers = () => {
    const csvContent = [
      ['Date', 'Player', 'From', 'To', 'Type', 'Fee', 'Status'],
      ...getFilteredTransfers().map(transfer => [
        formatDate(transfer.transferDate),
        transfer.player?.name || '',
        transfer.fromTeam?.name || 'Free Agency',
        transfer.toTeam?.name || '',
        transfer.transferType,
        transfer.transferFee || 0,
        transfer.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transfers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTransfers = getFilteredTransfers();

  const stats = {
    total: transfers.length,
    completed: transfers.filter(t => t.status === 'completed').length,
    pending: transfers.filter(t => t.status === 'pending').length,
    totalFees: transfers.reduce((sum, t) => sum + (t.transferFee || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-700">Total Transfers</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">${stats.totalFees.toFixed(2)}</div>
          <div className="text-sm text-purple-700">Total Fees</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={transferTypeFilter}
            onChange={(e) => setTransferTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="permanent">Permanent</option>
            <option value="loan">Loan</option>
            <option value="temporary">Temporary</option>
            <option value="free_transfer">Free Transfer</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="flex justify-between items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date_desc">Latest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="player">Player Name</option>
            <option value="fee_desc">Highest Fee</option>
            <option value="fee_asc">Lowest Fee</option>
          </select>

          <button
            onClick={exportTransfers}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Transfer List */}
      {filteredTransfers.length > 0 ? (
        <div className="space-y-4">
          {filteredTransfers.map((transfer) => (
            <div
              key={transfer._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Transfer Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transfer.player?.name || 'Unknown Player'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {transfer.player?.position || 'Position Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Transfer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">From</div>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {transfer.fromTeam?.name || 'Free Agency'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">To</div>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {transfer.toTeam?.name || 'Released'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Date</div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {formatDate(transfer.transferDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-block px-3 py-1 text-xs rounded-full border ${getStatusColor(transfer.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(transfer.status)}
                        <span className="capitalize">{transfer.status}</span>
                      </span>
                    </span>

                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${getTransferTypeColor(transfer.transferType)}`}>
                      {transfer.transferType?.replace('_', ' ').toUpperCase()}
                    </span>

                    {transfer.transferFee > 0 && (
                      <span className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        <DollarSign className="w-3 h-3 inline mr-1" />
                        ${transfer.transferFee.toFixed(2)}
                      </span>
                    )}

                    {transfer.contractDuration && (
                      <span className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {transfer.contractDuration.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Transfer Notes */}
                  {transfer.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium mb-1">Notes:</div>
                      {transfer.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ArrowRightLeft className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || transferTypeFilter !== 'all' || teamFilter || dateFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No player transfers have been recorded yet'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TransferHistoryList;