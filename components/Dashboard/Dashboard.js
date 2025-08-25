import React, { useState, useEffect } from 'react';
import { Users, Trophy, Calendar, UserPlus, BarChart3, Play, Camera, ArrowRight, TrendingUp, Award } from 'lucide-react';

const Dashboard = ({ showNotification, currentSeason, setCurrentView }) => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    upcomingMatches: 0,
    activeTransfers: 0,
    liveMatches: 0,
    completedMatches: 0,
    totalPhotos: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivities();
  }, [currentSeason]);

  const loadDashboardStats = () => {
    try {
      const players = JSON.parse(localStorage.getItem(`players_${currentSeason.id}`) || '[]');
      const teams = JSON.parse(localStorage.getItem(`teams_${currentSeason.id}`) || '[]');
      const schedules = JSON.parse(localStorage.getItem(`schedules_${currentSeason.id}`) || '[]');
      const photos = JSON.parse(localStorage.getItem('leagueGallery') || '[]');
      
      const now = new Date();
      const upcomingMatches = schedules.filter(s => new Date(s.date) > now && s.status !== 'completed').length;
      const liveMatches = schedules.filter(s => s.status === 'live').length;
      const completedMatches = schedules.filter(s => s.status === 'completed').length;
      const seasonPhotos = photos.filter(p => p.season === currentSeason.id).length;
      
      setStats({
        totalPlayers: players.length,
        totalTeams: teams.length,
        upcomingMatches,
        activeTransfers: players.filter(p => p.status === 'available').length,
        liveMatches,
        completedMatches,
        totalPhotos: seasonPhotos
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      showNotification?.('error', 'Failed to load dashboard data');
    }
  };

  const loadRecentActivities = () => {
    try {
      const activities = [];
      
      // Get recent transfers
      const transfers = JSON.parse(localStorage.getItem(`transfers_${currentSeason.id}`) || '[]');
      transfers.slice(-3).forEach(transfer => {
        activities.push({
          type: 'transfer',
          icon: ArrowRight,
          iconColor: 'blue',
          title: `${transfer.playerName} transferred to ${transfer.toTeam}`,
          time: new Date(transfer.date).toLocaleDateString(),
          action: () => setCurrentView('players')
        });
      });

      // Get recent matches
      const schedules = JSON.parse(localStorage.getItem(`schedules_${currentSeason.id}`) || '[]');
      schedules.filter(s => s.status === 'completed').slice(-2).forEach(match => {
        activities.push({
          type: 'match',
          icon: Trophy,
          iconColor: 'green',
          title: `${match.homeTeam} vs ${match.awayTeam} completed`,
          time: new Date(match.date).toLocaleDateString(),
          action: () => setCurrentView('schedules')
        });
      });

      // Get recent team updates
      const teams = JSON.parse(localStorage.getItem(`teams_${currentSeason.id}`) || '[]');
      if (teams.length > 0) {
        const recentTeam = teams[teams.length - 1];
        activities.push({
          type: 'team',
          icon: Users,
          iconColor: 'purple',
          title: `${recentTeam.name} team updated`,
          time: new Date(recentTeam.createdAt).toLocaleDateString(),
          action: () => setCurrentView('teams')
        });
      }

      setRecentActivities(activities.slice(0, 4));
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const statCards = [
    { 
      label: 'Total Players', 
      value: stats.totalPlayers, 
      icon: Users, 
      color: 'blue',
      action: () => setCurrentView('players'),
      trend: '+2 this week'
    },
    { 
      label: 'Total Teams', 
      value: stats.totalTeams, 
      icon: Trophy, 
      color: 'green',
      action: () => setCurrentView('teams'),
      trend: 'Active teams'
    },
    { 
      label: 'Upcoming Matches', 
      value: stats.upcomingMatches, 
      icon: Calendar, 
      color: 'purple',
      action: () => setCurrentView('schedules'),
      trend: 'This month'
    },
    { 
      label: 'Available for Transfer', 
      value: stats.activeTransfers, 
      icon: UserPlus, 
      color: 'orange',
      action: () => setCurrentView('players'),
      trend: 'Free agents'
    }
  ];

  const quickActions = [
    {
      title: 'Register Player',
      description: 'Add new player to the league',
      icon: UserPlus,
      color: 'blue',
      action: () => setCurrentView('players')
    },
    {
      title: 'Create Team',
      description: 'Set up a new team',
      icon: Trophy,
      color: 'green',
      action: () => setCurrentView('teams')
    },
    {
      title: 'Schedule Match',
      description: 'Plan upcoming games',
      icon: Calendar,
      color: 'purple',
      action: () => setCurrentView('schedules')
    },
    {
      title: 'Start Live Match',
      description: 'Begin live match tracking',
      icon: Play,
      color: 'red',
      action: () => setCurrentView('live')
    },
    {
      title: 'View Statistics',
      description: 'League performance data',
      icon: BarChart3,
      color: 'orange',
      action: () => setCurrentView('statistics')
    },
    {
      title: 'Upload Photos',
      description: 'Add league gallery images',
      icon: Camera,
      color: 'pink',
      action: () => setCurrentView('gallery')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to The Horse Futsal League</h2>
            <p className="text-blue-100">Season {currentSeason.name} • Dashboard Overview</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <Trophy size={32} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.liveMatches}</div>
            <div className="text-sm text-blue-100">Live Now</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.completedMatches}</div>
            <div className="text-sm text-blue-100">Completed</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.totalPhotos}</div>
            <div className="text-sm text-blue-100">Photos</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{currentSeason.name}</div>
            <div className="text-sm text-blue-100">Current Season</div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity 
            activities={recentActivities} 
            onViewAll={() => setCurrentView('statistics')} 
          />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <QuickActions actions={quickActions} />
        </div>
      </div>

      {/* Live Matches Alert */}
      {stats.liveMatches > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  {stats.liveMatches} Live Match{stats.liveMatches !== 1 ? 'es' : ''} in Progress
                </h3>
                <p className="text-red-600">Don't miss the action!</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('live')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Play size={16} />
              <span>View Live</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, action, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <div 
      className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 card-hover cursor-pointer group"
      onClick={action}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full border ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} className="text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <TrendingUp size={12} />
            <span>{trend}</span>
          </p>
        )}
      </div>
    </div>
  );
};

const RecentActivity = ({ activities, onViewAll }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </button>
      </div>
      
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <ActivityItem key={index} {...activity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Award className="mx-auto mb-2" size={32} />
          <p>No recent activity</p>
          <p className="text-sm">Start by registering players or creating teams</p>
        </div>
      )}
    </div>
  );
};

const ActivityItem = ({ icon: Icon, iconColor, title, time, action }) => {
  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div 
      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
      onClick={action}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColorClasses[iconColor]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {title}
        </p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight size={14} className="text-gray-400" />
      </div>
    </div>
  );
};

const QuickActions = ({ actions }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <QuickActionItem key={index} {...action} />
        ))}
      </div>
    </div>
  );
};

const QuickActionItem = ({ title, description, icon: Icon, color, action }) => {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-600',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-600',
    red: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600',
    pink: 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-600'
  };

  return (
    <button
      onClick={action}
      className={`p-4 rounded-lg text-left transition-all border group card-hover ${colorClasses[color]}`}
    >
      <Icon className="mb-2 group-hover:scale-110 transition-transform" size={20} />
      <p className="font-medium text-gray-900 mb-1">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </button>
  );
};

export default Dashboard;