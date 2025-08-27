// pages/index.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import TopNav from '../components/layout/TopNav';

// Import modules, then normalize to actual components (supports default OR named exports)
import * as HomePageMod from '../components/pages/HomePage';
import * as TeamsPageMod from '../components/pages/TeamsPage';
import * as MatchesPageMod from '../components/pages/MatchesPage';
import * as LeagueManagementMod from '../components/pages/LeagueManagement';
import * as LeagueDetailsMod from '../components/pages/LeagueDetails';
import * as AdminPanelMod from '../components/pages/AdminPanel';
import * as AuthPanelMod from '../components/auth/AuthPanel';

const pick = (mod) => (mod && mod.default) ? mod.default : mod;

const VIEWS = {
  home: pick(HomePageMod),
  'teams-page': pick(TeamsPageMod),
  'matches-page': pick(MatchesPageMod),
  'league-management': pick(LeagueManagementMod),
  'league-details': pick(LeagueDetailsMod),
  'admin-panel': pick(AdminPanelMod),
  'auth': pick(AuthPanelMod),
};

const ADMIN_ONLY_VIEWS = new Set(['admin-panel', 'league-management']);

function normalizeParams(p) {
  if (p && typeof p === 'object' && !Array.isArray(p)) return p;
  if (typeof p === 'string' && p.trim()) return { leagueId: p.trim(), id: p.trim() };
  if (typeof p === 'number') return { id: String(p) };
  return {};
}

async function fetchUser() {
  const urls = ['/api/auth/me', '/api/auth/session', '/api/auth/profile'];
  for (const u of urls) {
    try {
      const r = await fetch(u, { credentials: 'include' });
      if (r.ok) {
        const j = await r.json();
        if (j?.user) return j.user;
        if (j?.data?.user) return j.data.user;
        if (j?.email || j?._id) return j;
        return j || null;
      }
    } catch {}
  }
  return null;
}

export default function MainApp(props) {
  const [currentView, setCurrentView] = useState('home');
  const [params, setParams] = useState({});
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await fetchUser();
      setUser(u || null);
      setAuthChecked(true);
    })();
  }, []);

  const navigate = (view, p = {}) => {
    const norm = normalizeParams(p);
    if (!VIEWS[view]) view = 'home';

    if (!user && ADMIN_ONLY_VIEWS.has(view)) {
      setCurrentView('auth');
      setParams({ redirectTo: view, redirectParams: norm });
      return;
    }

    setCurrentView(view);
    setParams(norm);

    if (typeof window !== 'undefined') {
      window.__nav = navigate;
      window.__setUser = setUser;
      window.__view = view;
      window.__params = norm;
      window.__viewModule = VIEWS[view];
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__nav = navigate;
      window.__setUser = setUser;
    }
  }, []);

  const onLoggedIn = (u) => {
    setUser(u);
    const { redirectTo, redirectParams } = params || {};
    if (redirectTo) {
      setTimeout(() => navigate(redirectTo, redirectParams), 0);
    } else {
      navigate('home');
    }
  };

  const onLoggedOut = () => {
    setUser(null);
    navigate('home');
  };

  const View = VIEWS[currentView] || VIEWS.home;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>The Horse Futsal League</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TopNav onNavigate={navigate} user={user} authChecked={authChecked} onLoggedOut={onLoggedOut} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <View
          onNavigate={navigate}
          params={params}
          user={user}
          onLoggedIn={onLoggedIn}
          onLoggedOut={onLoggedOut}
          {...params}
          {...props}
        />
      </main>
    </div>
  );
}
