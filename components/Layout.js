// components/Layout.js - Updated with proper admin navigation
import React from 'react';
import { 
  Menu, X, User, LogOut, Settings, Plus, 
  Calendar, Trophy, Users, Download, FileText
} from 'lucide-react';
import { useState } from 'react';

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
  onGenerateSchedule
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (!selectedLeague) {
      alert('Please select a league first');
      return;
    }
    
    const url = `/api/matches/download-pdf?leagueId=${selectedLeague}`;
    window.open(url, '_blank');
  };

  // Filter navigation items based on current state
  const visibleNavItems = navItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.requiresAdmin) return isLoggedIn;
    if (item.requiresLeague && !selectedLeague) return false;
    if (item.requiresLive && liveMatchCount === 0 && !isLoggedIn) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Futsal Manager</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Professional League Management</p>
              </div>
            </div>

            {/* League Selector and Actions */}
            <div className="hidden md:flex items-center gap-4">
              <select
                value={selectedLeague || ''}
                onChange={(e) => onLeagueChange(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select League</option>
                {leagues.map(league => (
                  <option key={league._id} value={league._id}>
                    {league.name}
                  </option>
                ))}
              </select>

              {/* ✅ PDF Download for Everyone */}
              {selectedLeague && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                  title="Download Schedule PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden lg:block">PDF</span>
                </button>
              )}
              
              {liveMatchCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  {liveMatchCount} Live
                </div>
              )}
            </div>

            {/* Admin Controls */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Quick Actions for Admin */}
                  <div className="hidden lg:flex items-center gap-2">
                    {selectedLeague && (
                      <>
                        <button
                          onClick={onCreateTeam}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Add Team"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                  {/* ✅ Admin-Only: Schedule Generator */}
                  {selectedLeague && isLoggedIn && (
                    <button
                      onClick={onGenerateSchedule}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      title="Generate Schedule"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  )}
                      </>
                    )}
                    <button
                      onClick={onCreateLeague}
                      className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                      title="Add League"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* User Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:block">{currentUser?.username}</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-2">
                        <button
                          onClick={() => onSectionChange('admin')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Admin Settings
                        </button>
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={onShowLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Admin Login
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <div className="px-4 py-3 space-y-2">
              
                {/* Mobile League Selector */}
                <select
                  value={selectedLeague || ''}
                  onChange={(e) => {
                    onLeagueChange(e.target.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value="">Select League</option>
                  {leagues.map(league => (
                    <option key={league._id} value={league._id}>
                      {league.name}
                    </option>
                  ))}
                </select>

                {/* ✅ Mobile PDF Download */}
                {selectedLeague && (
                  <button
                    onClick={() => {
                      handleDownloadPDF();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-green-400 hover:text-green-300 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Schedule PDF
                  </button>
                )}

              {/* Mobile Navigation */}
              {visibleNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Desktop Sidebar Navigation */}
          <nav className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 sticky top-24">
              <h2 className="text-white font-semibold mb-4">Navigation</h2>
              <div className="space-y-2">
                {visibleNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'live' && liveMatchCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        {liveMatchCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Admin Quick Actions */}
              {isLoggedIn && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-slate-400 text-sm font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={onCreateLeague}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add League
                    </button>
                    {selectedLeague && (
                      <>
                        <button
                          onClick={onCreateTeam}
                          className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
                        >
                          <Users className="w-4 h-4" />
                          Add Team
                        </button>
                        {/* ✅ Admin-Only: Schedule Generator */}
                        <button
                          onClick={onGenerateSchedule}
                          className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
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
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-9 xl:col-span-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;