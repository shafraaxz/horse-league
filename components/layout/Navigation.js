// Updated Navigation.js - Add player profile support
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Shield, 
  Menu,
  LogIn,
  LogOut,
  User,
  Calendar,
  Edit
} from 'lucide-react';

const Navigation = ({ 
  currentView, 
  onNavigate, 
  onBack, 
  selectedLeague,
  selectedPlayer,
  onShowLogin 
}) => {
  const { currentUser, logout } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case 'league-selection':
        return 'Select League';
      case 'league-details':
        return selectedLeague?.name || 'League Details';
      case 'team-profile':
        return 'Team Profile';
      case 'teams':
        return 'Teams';
      case 'admin-panel':
        return 'Admin Panel';
      case 'match-edit':
        return 'Edit Match';
      case 'match-details':
        return 'Match Details';
      case 'matches':
        return 'Matches';
      case 'league-players':
        return 'Player Management';
      case 'player-profile':
        return selectedPlayer?.name || 'Player Profile';
      default:
        return 'Football League Manager';
    }
  };

  const getViewIcon = () => {
    switch (currentView) {
      case 'league-selection':
      case 'league-details':
        return <Trophy className="h-6 w-6 text-blue-600" />;
      case 'team-profile':
      case 'teams':
        return <Users className="h-6 w-6 text-blue-600" />;
      case 'admin-panel':
        return <Shield className="h-6 w-6 text-blue-600" />;
      case 'match-edit':
        return <Edit className="h-6 w-6 text-blue-600" />;
      case 'match-details':
      case 'matches':
        return <Calendar className="h-6 w-6 text-blue-600" />;
      case 'league-players':
      case 'player-profile':
        return <User className="h-6 w-6 text-blue-600" />;
      default:
        return <Trophy className="h-6 w-6 text-blue-600" />;
    }
  };

  const getViewDescription = () => {
    switch (currentView) {
      case 'league-details':
        return selectedLeague ? `${selectedLeague.type} • ${selectedLeague.sport}` : null;
      case 'match-edit':
        return 'Modify match details';
      case 'match-details':
        return 'View match information';
      case 'league-players':
        return 'Register and manage players';
      case 'player-profile':
        return selectedPlayer ? `${selectedPlayer.position} • ${selectedPlayer.team?.name || 'Free Agent'}` : 'Player statistics and information';
      default:
        return null;
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    onNavigate('league-selection');
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              {getViewIcon()}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {getViewTitle()}
                </h1>
                {getViewDescription() && (
                  <p className="text-xs text-gray-500 capitalize">
                    {getViewDescription()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Navigation and user menu */}
          <div className="flex items-center space-x-4">
            {/* Main Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => onNavigate('league-selection')}
                className={`p-2 rounded-lg transition-colors ${
                  currentView === 'league-selection' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Leagues"
              >
                <Trophy className="h-5 w-5" />
              </button>

              {selectedLeague && (
                <>
                  <button
                    onClick={() => onNavigate('league-details', selectedLeague._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'league-details' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="League Details"
                  >
                    <Trophy className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => onNavigate('teams', { leagueId: selectedLeague._id })}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'teams' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Teams"
                  >
                    <Users className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => onNavigate('matches', { leagueId: selectedLeague._id })}
                    className={`p-2 rounded-lg transition-colors ${
                      ['matches', 'match-edit', 'match-details'].includes(currentView)
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Matches"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => onNavigate('league-players', { leagueId: selectedLeague._id })}
                    className={`p-2 rounded-lg transition-colors ${
                      ['league-players', 'player-profile'].includes(currentView)
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Players"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </>
              )}

              {currentUser && (
                <button
                  onClick={() => onNavigate('admin-panel')}
                  className={`p-2 rounded-lg transition-colors ${
                    currentView === 'admin-panel' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Admin"
                >
                  <Shield className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              {currentUser ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {currentUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">
                      {currentUser.name}
                    </span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentUser.email}
                        </p>
                        <p className="text-xs text-blue-600 font-medium capitalize mt-1">
                          {currentUser.role?.replace('_', ' ')}
                        </p>
                      </div>
                      
                      {/* Mobile navigation items */}
                      <div className="md:hidden border-b">
                        <button
                          onClick={() => {
                            onNavigate('league-selection');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Leagues
                        </button>
                        
                        {selectedLeague && (
                          <>
                            <button
                              onClick={() => {
                                onNavigate('league-details', selectedLeague._id);
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              League Details
                            </button>
                            
                            <button
                              onClick={() => {
                                onNavigate('teams', { leagueId: selectedLeague._id });
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Teams
                            </button>
                            
                            <button
                              onClick={() => {
                                onNavigate('matches', { leagueId: selectedLeague._id });
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Matches
                            </button>

                            <button
                              onClick={() => {
                                onNavigate('league-players', { leagueId: selectedLeague._id });
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Players
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            onNavigate('admin-panel');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </button>
                      </div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={onShowLogin}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:block">Admin Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;