// pages/index.js - Main Application for The Horse Futsal League (buttons fixed, no duplicates)
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Home, Users, Calendar, Trophy, Settings, RefreshCw, User, LogOut, Menu, X } from 'lucide-react';

// Import page components
import AdminPage from '../components/pages/AdminPage';
import TransferMarketPage from '../components/pages/TransferMarketPage';
import LeagueDetails from '../components/pages/LeagueDetails';
import TeamsPage from '../components/pages/TeamsPage';
import MatchesPage from '../components/pages/MatchesPage';

const Navigation = ({ currentPage, onNavigate, user, onLogout, isMobile = false, onClose }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, description: 'League overview and latest updates' },
    { id: 'teams-page', label: 'Teams', icon: Users, description: 'Team management and rosters' },
    { id: 'matches-page', label: 'Matches', icon: Calendar, description: 'Fixtures and results' },
    { id: 'transfer-market', label: 'Transfer Market', icon: RefreshCw, description: 'Player transfers and registration' },
    { id: 'league-details', label: 'League Table', icon: Trophy, description: 'Standings and statistics' },
  ];
  const adminItems = [{ id: 'admin', label: 'Admin Panel', icon: Settings, description: 'System administration' }];
  const NavButton = ({ item, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all group ${
        isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
      <div className="flex-1">
        <div className="font-medium">{item.label}</div>
        {!isMobile && <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{item.description}</div>}
      </div>
    </button>
  );
  return (
    <nav className={`space-y-2 ${isMobile ? 'px-4' : ''}`}>
      {navItems.map(item => (
        <NavButton key={item.id} item={item} isActive={currentPage === item.id} onClick={() => { onNavigate(item.id); if (isMobile) onClose?.(); }} />
      ))}
      {user && ['admin','super_admin'].includes(user.role) && (
        <>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">Administration</h3>
          </div>
          {adminItems.map(item => (
            <NavButton key={item.id} item={item} isActive={currentPage === item.id} onClick={() => { onNavigate(item.id); if (isMobile) onClose?.(); }} />
          ))}
        </>
      )}
    </nav>
  );
};

const MobileMenu = ({ isOpen, onClose, currentPage, onNavigate, user, onLogout }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold text-sm">HF</div>
            <span className="font-bold text-gray-900">The Horse Futsal League</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-4">
          <Navigation currentPage={currentPage} onNavigate={onNavigate} user={user} onLogout={onLogout} isMobile={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

const Header = ({ onMenuToggle, user, onLogout, onNavigate }) => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden lg:flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold">HF</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">The Horse Futsal League</h1>
            <p className="text-sm text-gray-600">Season 2025/26</p>
          </div>
        </div>
        <div className="lg:hidden flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold text-sm">HF</div>
          <span className="font-bold text-gray-900">HFL</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <button onClick={onLogout} className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <button onClick={() => onNavigate('login')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium">
              <User className="w-4 h-4" /> Admin Login
            </button>
          )}
        </div>
      </div>
    </div>
  </header>
);

const LoginForm = ({ onLogin, error, loading }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const submit = (e) => { e.preventDefault(); onLogin(credentials); };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center text-2xl font-bold mb-4">HF</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">The Horse Futsal League</h1>
            <p className="text-gray-600">Admin Login</p>
          </div>
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-800">{error}</p></div>}
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={credentials.username} onChange={(e)=>setCredentials(s=>({...s, username:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={credentials.password} onChange={(e)=>setCredentials(s=>({...s, password:e.target.value}))} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-8 text-center text-sm text-gray-600">Default login: <strong>admin</strong> / <strong>admin123</strong></div>
        </div>
      </div>
    </div>
  );
};

const MessageToast = ({ message, type, onClose }) => {
  useEffect(()=>{ const t=setTimeout(onClose,5000); return ()=>clearTimeout(t); },[onClose]);
  if (!message) return null;
  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${type==='success'?'bg-green-500':type==='error'?'bg-red-500':'bg-blue-500'} text-white`}>
      <div className="flex items-center justify-between">
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

const HomePage = ({ user, onMessage, onNavigate }) => {
  const [stats, setStats] = useState({ totalTeams:0, totalPlayers:0, totalMatches:0, totalGoals:0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ (async()=>{
    try{
      setLoading(true);
      const s = await fetch('/api/stats/overview'); if (s.ok){ const j=await s.json(); if (j.success) setStats(j.data); }
      const a = await fetch('/api/activity/recent'); if (a.ok){ const j=await a.json(); if (j.success) setRecentActivity(j.data||[]); }
      const m = await fetch('/api/matches?status=upcoming&limit=3'); if (m.ok){ const j=await m.json(); if (j.success) setUpcomingMatches(j.data||[]); }
    } finally { setLoading(false); }
  })(); },[]);
  if (loading) return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></div>);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">HF</div>
          <div>
            <h1 className="text-4xl font-bold mb-2">The Horse Futsal League</h1>
            <p className="text-xl text-blue-100 mb-4">Season 2025/26 - Premier Futsal Competition</p>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2"><Trophy className="w-4 h-4" />{stats.totalTeams} Teams</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4" />{stats.totalPlayers} Players</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{stats.totalMatches} Matches</span>
            </div>
          </div>
        </div>
      </div>
      {/* Call to Action for non-logged users */}
      {!user && (
        <div className="mt-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Join The Horse Futsal League</h2>
          <p className="text-green-100 mb-6">Are you a team manager or administrator? Get access to manage teams, players, and matches.</p>
          <button onClick={() => onNavigate('login')} className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Admin Login</button>
        </div>
      )}
    </div>
  );
};

export default function HorseFutsalLeague(){
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` }})
        .then(res=>res.json()).then(d=>{ if (d.success) setUser(d.user); else localStorage.removeItem('token'); })
        .catch(()=>localStorage.removeItem('token'))
        .finally(()=>setAuthChecked(true));
    } else setAuthChecked(true);
  },[]);

  const showMessage = (text, type='info') => setMessage({text, type});
  const clearMessage = () => setMessage({text:'', type:''});

  const handleLogin = async (credentials) => {
    setLoading(true); setError('');
    try{
      const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(credentials) });
      const j = await r.json();
      if (j.success){ localStorage.setItem('token', j.token); setUser(j.user); showMessage(`Welcome back, ${j.user.name}!`,'success'); setCurrentPage('home'); }
      else setError(j.message || 'Login failed');
    } catch(e){ setError('Login failed. Please try again.'); } finally { setLoading(false); }
  };
  const handleLogout = () => { localStorage.removeItem('token'); setUser(null); setCurrentPage('home'); showMessage('Logged out successfully','success'); };

  const pageProps = { user, onMessage: showMessage, onNavigate: setCurrentPage };
  const renderPage = () => {
    switch(currentPage){
      case 'login': return <LoginForm onLogin={handleLogin} error={error} loading={loading} />;
      case 'admin': return <AdminPage {...pageProps} />;
      case 'transfer-market': return <TransferMarketPage {...pageProps} />;
      case 'league-details': return <LeagueDetails {...pageProps} />;
      case 'teams-page': return <TeamsPage {...pageProps} />;
      case 'matches-page': return <MatchesPage {...pageProps} />;
      case 'home':
      default: return <HomePage {...pageProps} />;
    }
  };

  if (!authChecked) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center text-2xl font-bold mb-4">HF</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading The Horse Futsal League...</p>
      </div>
    </div>);
  }

  if (!user && ['admin'].includes(currentPage)) { setCurrentPage('login'); return null; }
  if (user && currentPage === 'login') { setCurrentPage('home'); return null; }

  return (
    <>
      <Head>
        <title>The Horse Futsal League - Premier Futsal Competition</title>
        <meta name="description" content="The Horse Futsal League - Season 2025/26. Premier futsal competition featuring the best teams and players." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
        <div className="flex">
          <div className="hidden lg:block w-80 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-6">
              <Navigation currentPage={currentPage} onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
            </div>
          </div>
          <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentPage={currentPage} onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
          <div className="flex-1 min-h-screen">{renderPage()}</div>
        </div>
        <MessageToast message={message.text} type={message.type} onClose={clearMessage} />
      </div>
    </>
  );
}

