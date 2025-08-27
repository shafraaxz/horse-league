// components/layout/TopNav.js
import React, { useEffect, useState } from 'react';

function SeasonQuickSwitch() {
  const [season, setSeason] = useState('');
  const [saving, setSaving] = useState(false);
  const seasons = ['2022/23','2023/24','2024/25','2025/26','2026/27','2027/28'];

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/leagues');
        const j = await r.json();
        const l = (j?.data || j?.leagues || [])[0];
        if (l?.currentSeason) setSeason(l.currentSeason);
      } catch {}
    })();
  }, []);

  const save = async () => {
    if (!season) return;
    setSaving(true);
    try {
      const r = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSeason: season })
      });
      await r.json().catch(()=>({}));
      try {
        window.dispatchEvent(new CustomEvent('season-changed', { detail: { season } }));
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600">Season</label>
      <input
        list="hf-seasons"
        className="border rounded px-2 py-1 text-sm w-28"
        value={season}
        onChange={e=>setSeason(e.target.value)}
        placeholder="2025/26"
      />
      <datalist id="hf-seasons">
        {seasons.map(s => <option key={s} value={s} />)}
      </datalist>
      <button onClick={save} className="px-2 py-1 text-sm rounded border bg-white">{saving ? '…' : 'Set'}</button>
    </div>
  );
}

export default function TopNav({ onNavigate, user, authChecked, onLoggedOut }) {
  return (
    <header className="bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">HF</div>
          <span className="font-semibold">The Horse Futsal League</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <button onClick={() => onNavigate('home')} className="px-3 py-1.5 rounded hover:bg-gray-100">Home</button>
          <button onClick={() => onNavigate('teams-page')} className="px-3 py-1.5 rounded hover:bg-gray-100">Teams</button>
          <button onClick={() => onNavigate('matches-page')} className="px-3 py-1.5 rounded hover:bg-gray-100">Matches</button>
          <button onClick={() => onNavigate('league-details')} className="px-3 py-1.5 rounded hover:bg-gray-100">League</button>
          <div className="w-px h-5 bg-gray-200" />
          <SeasonQuickSwitch />
          <div className="w-px h-5 bg-gray-200" />
          {authChecked && (
            user ? (
              <button
                onClick={async () => {
                  for (const url of ['/api/auth/logout', '/api/auth/signout']) {
                    try { await fetch(url, { method: 'POST', credentials: 'include' }); } catch {}
                  }
                  onLoggedOut?.();
                }}
                className="px-3 py-1.5 rounded border"
              >
                Logout
              </button>
            ) : (
              <button onClick={() => onNavigate('auth')} className="px-3 py-1.5 rounded border">Admin Login</button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
