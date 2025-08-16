// components/Layout.js - Update to include onDeleteLeague prop
import { useState } from 'react';
import { Menu, X, Plus, Users, Calendar, Settings, LogOut, Edit, Trash2 } from 'lucide-react';

const Layout = ({ 
  children, 
  activeSection, 
  onSectionChange, 
  leagues, 
  selectedLeague, 
  onLeagueChange,
  liveMatchCount,
  isLoggedIn,
  currentUser,
  onLogout,
  onShowLogin,
  navItems,
  onCreateLeague,
  onCreateTeam,
  onCreatePlayer,
  onGenerateSchedule,
  onDeleteLeague // Add this new prop
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLeagueActions, setShowLeagueActions] = useState(null);

  const handleDeleteLeague = (leagueId) => {
    if (onDeleteLeague) {
      onDeleteLeague(leagueId);
    }
    setShowLeagueActions(null);
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.requiresAdmin && (!isLoggedIn || currentUser?.role !== 'admin')) return false;
    if (item.requiresLeague && !selectedLeague) return false;
    if (item.requiresLive && liveMatchCount === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-white hover:text-blue-400 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚽</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Futsal Manager
                </span>
              </div>
            </div>

            {/* League Selector */}
            <div className="hidden md:flex items-center gap-4">
              {leagues.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedLeague || ''}
                    onChange={(e) => onLeagueChange(e.target.value || null)}
                    className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
                  >
                    <option value="">Select League</option>
                    {leagues.map(league => (
                      <option key={league._id} value={league._id}>
                        {league.name} ({league.season})
                      </option>
                    ))}
                  </select>
                  
                  {/* League Actions */}
                  {selectedLeague && isLoggedIn && (
                    <div className="absolute top-full right-0 mt-1">
                      <div className="relative">
                        <button
                          onClick={() => setShowLeagueActions(!showLeagueActions)}
                          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg border border-slate-600 transition-colors"
                          title="League Actions"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        
                        {showLeagueActions && (
                          <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 min-w-48 z-50">
                            <button
                              onClick={() => {
                                onCreateLeague();
                                setShowLeagueActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit League
                            </button>
                            <button
                              onClick={() => handleDeleteLeague(selectedLeague)}
                              className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete League
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {liveMatchCount > 0 && (
                <div className="hidden md:flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium border border-red-500/30">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  {liveMatchCount} Live
                </div>
              )}
              
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <div className="text-white font-medium">{currentUser?.username}</div>
                    <div className="text-slate-400 text-sm capitalize">{currentUser?.role}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowLogin}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <div className="px-4 py-3 space-y-2">
              {/* Mobile League Selector */}
              {leagues.length > 0 && (
                <select
                  value={selectedLeague || ''}
                  onChange={(e) => onLeagueChange(e.target.value || null)}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select League</option>
                  {leagues.map(league => (
                    <option key={league._id} value={league._id}>
                      {league.name} ({league.season})
                    </option>
                  ))}
                </select>
              )}
              
              {/* Mobile Navigation */}
              {filteredNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                    activeSection === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                  {item.id === 'live' && liveMatchCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {liveMatchCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 bg-slate-800/50 border-r border-slate-700 min-h-screen">
          <div className="p-6">
            {/* Navigation */}
            <nav className="space-y-2">
              {filteredNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                    activeSection === item.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'live' && liveMatchCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {liveMatchCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            {isLoggedIn && (
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={onCreateLeague}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Plus className="w-4 h-4" />
                    Create League
                  </button>
                  {selectedLeague && (
                    <>
                      <button
                        onClick={onCreateTeam}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Users className="w-4 h-4" />
                        Add Team
                      </button>
                      <button
                        onClick={onCreatePlayer}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Plus className="w-4 h-4" />
                        Add Player
                      </button>
                      <button
                        onClick={onGenerateSchedule}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Calendar className="w-4 h-4" />
                        Generate Schedule
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Click outside handler for league actions */}
      {showLeagueActions && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowLeagueActions(false)}
        />
      )}
    </div>
  );
};

export default Layout;