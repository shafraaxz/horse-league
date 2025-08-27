// components/league/SeasonSetter.js
import React, { useEffect, useState } from 'react';
import { Calendar, Save } from 'lucide-react';

const SeasonSetter = () => {
  const [season, setSeason] = useState('2025/26');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    (async ()=>{
      try { const res = await fetch('/api/seasons'); const data = await res.json(); if (data.currentSeason) setSeason(data.currentSeason); } catch {}
    })();
  }, []);

  const onSave = async (e)=>{
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/seasons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ season }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      alert('Season saved: ' + data.currentSeason);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 border">
      <h3 className="text-xl font-semibold mb-4">Season</h3>
      <form onSubmit={onSave} className="flex items-center gap-3">
        <div className="relative">
          <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="pl-10 pr-3 py-2 border rounded-lg" value={season} onChange={(e)=>setSeason(e.target.value)} placeholder="2025/26" />
        </div>
        <button disabled={loading} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          <Save className="h-4 w-4" />
          Save
        </button>
      </form>
    </div>
  );
};

export default SeasonSetter;
