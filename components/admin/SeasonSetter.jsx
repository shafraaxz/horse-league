// components/admin/SeasonSetter.jsx
import React, { useEffect, useState } from 'react';

export default function SeasonSetter({ onSaved }) {
  const [season, setSeason] = useState('2025/26');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/leagues');
        const j = await r.json();
        const league = (j?.data || j?.leagues || [])[0];
        if (league?.currentSeason) setSeason(league.currentSeason);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setLoading(true); setMsg('');
    try {
      const r = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSeason: season })
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || 'Failed');
      setMsg('Saved!');
      onSaved?.(j.data);
    } catch (e) {
      setMsg(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-end gap-3">
      <label className="block flex-1">
        <span className="block text-sm font-medium mb-1">Season</span>
        <input className="w-full border rounded-lg px-3 py-2" value={season} onChange={e=>setSeason(e.target.value)} placeholder="2025/26" />
      </label>
      <button onClick={save} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
        {loading ? 'Saving…' : 'Save'}
      </button>
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </div>
  );
}
