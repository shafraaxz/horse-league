// components/pages/LeagueDetails.js (cleaned, buttons fixed)
import React, { useEffect, useState, useCallback, useRef } from 'react';

const Card = ({ title, children, right }) => (
  <div className="bg-white rounded-2xl shadow border p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);

function useCloudinaryUpload() {
  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'sports-league/teams';
  const upload = async (file) => {
    if (!CLOUD || !PRESET) throw new Error('Cloudinary env vars missing');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', PRESET);
    fd.append('folder', FOLDER);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed');
    return data.secure_url;
  };
  return upload;
}

function AddTeamInline({ onCreated, user }) {
  const [name, setName] = useState('');
  const [shortName, setShort] = useState('');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [upBusy, setUpBusy] = useState(false);
  const fileRef = useRef(null);
  const uploadToCloudinary = useCloudinaryUpload();

  const uploadLogo = async (file) => {
    if (!file) return;
    setUpBusy(true); setErr('');
    try {
      const url = await uploadToCloudinary(file);
      setLogo(url);
    } catch (e) { setErr(e.message); }
    finally {
      setUpBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName, logo })
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || 'Failed to create team');
      setName(''); setShort(''); setLogo('');
      onCreated?.();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  if (!user) return <div className="text-sm text-gray-600">Login to add teams.</div>;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Field label="Team name"><input className="border rounded px-3 py-2 w-full" value={name} onChange={e=>setName(e.target.value)} required /></Field>
      <Field label="Short name"><input className="border rounded px-3 py-2 w-full" value={shortName} onChange={e=>setShort(e.target.value)} /></Field>
      <Field label="Logo">
        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 w-full" value={logo} onChange={e=>setLogo(e.target.value)} placeholder="https://... (or use Upload)" />
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>uploadLogo(e.target.files?.[0])} />
        </div>
        <div className="text-xs text-gray-500 mt-1">{upBusy ? 'Uploading…' : 'Use Upload to send to Cloudinary'}</div>
        {logo && <img src={logo} alt="" className="mt-2 h-10 rounded border" />}
      </Field>
      <div className="flex items-end">
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving || upBusy}>{saving ? 'Saving…' : 'Add Team'}</button>
      </div>
      {err && <div className="md:col-span-4 text-sm text-red-600">{err}</div>}
    </form>
  );
}

function AddPlayerInline({ teams, onCreated, user }) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, team, position })
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || 'Failed to create player');
      setName(''); setTeam(''); setPosition('');
      onCreated?.();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  if (!user) return <div className="text-sm text-gray-600">Login to add players.</div>;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Field label="Player name"><input className="border rounded px-3 py-2 w-full" value={name} onChange={e=>setName(e.target.value)} required /></Field>
      <Field label="Team">
        <select className="border rounded px-3 py-2 w-full" value={team} onChange={e=>setTeam(e.target.value)} required>
          <option value="">Select</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Position"><input className="border rounded px-3 py-2 w-full" value={position} onChange={e=>setPosition(e.target.value)} placeholder="Pivot / Winger / Fixo" /></Field>
      <div className="flex items-end">
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving}>{saving ? 'Saving…' : 'Add Player'}</button>
      </div>
      {err && <div className="md:col-span-4 text-sm text-red-600">{err}</div>}
    </form>
  );
}

function AddMatchInline({ teams, onCreated, user, season }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [homeTeam, setHome] = useState('');
  const [awayTeam, setAway] = useState('');
  const [venue, setVenue] = useState('');
  const [round, setRound] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const dt = date && time ? new Date(`${date}T${time}:00`) : null;
      const payload = { date: dt || undefined, homeTeam, awayTeam, venue, round, season, status: 'scheduled' };
      const r = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || 'Failed to create match');
      setDate(''); setTime(''); setHome(''); setAway(''); setVenue(''); setRound('');
      onCreated?.();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  if (!user) return <div className="text-sm text-gray-600">Login to add matches.</div>;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-6 gap-3">
      <Field label="Date"><input type="date" className="border rounded px-3 py-2 w-full" value={date} onChange={e=>setDate(e.target.value)} required /></Field>
      <Field label="Time"><input type="time" className="border rounded px-3 py-2 w-full" value={time} onChange={e=>setTime(e.target.value)} required /></Field>
      <Field label="Home">
        <select className="border rounded px-3 py-2 w-full" value={homeTeam} onChange={e=>setHome(e.target.value)} required>
          <option value="">Select</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Away">
        <select className="border rounded px-3 py-2 w-full" value={awayTeam} onChange={e=>setAway(e.target.value)} required>
          <option value="">Select</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Venue"><input className="border rounded px-3 py-2 w-full" value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Court A" /></Field>
      <Field label="Round"><input className="border rounded px-3 py-2 w-full" value={round} onChange={e=>setRound(e.target.value)} placeholder="Matchday 1" /></Field>
      <div className="lg:col-span-6 -mt-2 text-xs text-gray-600">Season: <span className="font-medium">{season}</span></div>
      {err && <div className="lg:col-span-6 text-sm text-red-600">{err}</div>}
      <div className="lg:col-span-6 text-right">
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving}>{saving ? 'Saving…' : 'Add Match'}</button>
      </div>
    </form>
  );
}

function AddTransferInline({ teams, players, season, onCreated, user }) {
  const [player, setPlayer] = useState('');
  const [toTeam, setToTeam] = useState('');
  const [fee, setFee] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = { player, toTeam, fee, season, date: date ? new Date(`${date}T00:00:00`) : undefined, notes };
      const r = await fetch('/api/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || 'Failed to create transfer');
      setPlayer(''); setToTeam(''); setFee(''); setDate(''); setNotes('');
      onCreated?.();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  if (!user) return <div className="text-sm text-gray-600">Login to make transfers.</div>;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <Field label="Player">
        <select className="border rounded px-3 py-2 w-full" value={player} onChange={e=>setPlayer(e.target.value)} required>
          <option value="">Select</option>
          {players.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="To Team">
        <select className="border rounded px-3 py-2 w-full" value={toTeam} onChange={e=>setToTeam(e.target.value)} required>
          <option value="">Select</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Fee"><input className="border rounded px-3 py-2 w-full" value={fee} onChange={e=>setFee(e.target.value)} placeholder="e.g., 1000" /></Field>
      <Field label="Date"><input type="date" className="border rounded px-3 py-2 w-full" value={date} onChange={e=>setDate(e.target.value)} /></Field>
      <div className="flex items-end">
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving}>{saving ? 'Saving…' : 'Make Transfer'}</button>
      </div>
      {err && <div className="md:col-span-5 text-sm text-red-600">{err}</div>}
    </form>
  );
}

export default function LeagueDetails({ user }) {
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [season, setSeason] = useState('2025/26');
  const [loading, setLoading] = useState(true);

  const loadLeague = useCallback(async () => {
    const r = await fetch('/api/leagues'); const j = await r.json();
    const l = (j?.data || j?.leagues || [])[0] || null;
    setLeague(l);
    if (l?.currentSeason) setSeason(l.currentSeason);
  }, []);

  const loadTeams = useCallback(async () => {
    const r = await fetch('/api/teams'); const j = await r.json();
    setTeams(j?.data || j?.teams || []);
  }, []);

  const loadPlayers = useCallback(async () => {
    const r = await fetch('/api/players'); const j = await r.json();
    setPlayers(j?.data || j?.players || []);
  }, []);

  const loadMatches = useCallback(async () => {
    const r = await fetch('/api/matches?season=' + encodeURIComponent(season));
    const j = await r.json();
    setMatches(j?.data || j?.matches || []);
  }, [season]);

  const loadTransfers = useCallback(async () => {
    const r = await fetch('/api/transfers?season=' + encodeURIComponent(season));
    const j = await r.json();
    setTransfers(j?.data || j?.transfers || []);
  }, [season]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadLeague(), loadTeams(), loadPlayers(), loadMatches(), loadTransfers()]);
    setLoading(false);
  }, [loadLeague, loadTeams, loadPlayers, loadMatches, loadTransfers]);

  useEffect(() => { refreshAll(); }, [refreshAll]);
  useEffect(() => { loadMatches(); loadTransfers(); }, [season, loadMatches, loadTransfers]);

  useEffect(() => {
    const h = (e) => {
      const s = e?.detail?.season;
      if (s) setSeason(s);
    };
    window.addEventListener('season-changed', h);
    return () => window.removeEventListener('season-changed', h);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{league?.name || 'The Horse Futsal League'}</h1>
        <div className="text-sm text-gray-600">Season: <span className="font-medium">{season}</span></div>
      </div>

      <Card title="Teams">
        <div className="mb-4">
          <AddTeamInline onCreated={loadTeams} user={user} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-2 px-3">Team</th>
                <th className="py-2 px-3">Short</th>
                <th className="py-2 px-3">Logo</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id} className="border-b last:border-none">
                  <td className="py-2 px-3">{t.name}</td>
                  <td className="py-2 px-3">{t.shortName || '-'}</td>
                  <td className="py-2 px-3">{t.logo ? <img src={t.logo} alt="" className="h-6" /> : '-'}</td>
                </tr>
              ))}
              {!teams.length && <tr><td className="py-3 px-3 text-gray-600" colSpan={3}>No teams yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Players">
        <div className="mb-4">
          <AddPlayerInline teams={teams} onCreated={loadPlayers} user={user} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-2 px-3">Player</th>
                <th className="py-2 px-3">Team</th>
                <th className="py-2 px-3">Position</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p._id} className="border-b last:border-none">
                  <td className="py-2 px-3">{p.name}</td>
                  <td className="py-2 px-3">{teams.find(t => String(t._id) === String(p.team))?.name || '-'}</td>
                  <td className="py-2 px-3">{p.position || '-'}</td>
                </tr>
              ))}
              {!players.length && <tr><td className="py-3 px-3 text-gray-600" colSpan={3}>No players yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Matches" right={
        <div className="flex gap-2">
          <a href="/api/matches/template-csv" className="px-3 py-2 rounded-lg border text-sm">CSV template</a>
          <a href="/api/export/schedule-pdf" className="px-3 py-2 rounded-lg border text-sm">Export PDF</a>
        </div>
      }>
        <div className="mb-4">
          <AddMatchInline teams={teams} onCreated={loadMatches} user={user} season={season} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Home</th>
                <th className="py-2 px-3">Away</th>
                <th className="py-2 px-3">Venue</th>
                <th className="py-2 px-3">Round</th>
                <th className="py-2 px-3">Season</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m._id} className="border-b last:border-none">
                  <td className="py-2 px-3">{m.date ? new Date(m.date).toLocaleString() : '-'}</td>
                  <td className="py-2 px-3">{m.homeTeam?.name || '-'}</td>
                  <td className="py-2 px-3">{m.awayTeam?.name || '-'}</td>
                  <td className="py-2 px-3">{m.venue || '-'}</td>
                  <td className="py-2 px-3">{m.round || '-'}</td>
                  <td className="py-2 px-3">{m.season || '-'}</td>
                  <td className="py-2 px-3">{m.status || '-'}</td>
                </tr>
              ))}
              {!matches.length && <tr><td className="py-3 px-3 text-gray-600" colSpan={7}>No matches yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Transfer Market">
        <div className="mb-4">
          <AddTransferInline teams={teams} players={players} season={season} onCreated={() => { loadPlayers(); loadTransfers(); }} user={user} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Player</th>
                <th className="py-2 px-3">From</th>
                <th className="py-2 px-3">To</th>
                <th className="py-2 px-3">Fee</th>
                <th className="py-2 px-3">Season</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t._id} className="border-b last:border-none">
                  <td className="py-2 px-3">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</td>
                  <td className="py-2 px-3">{t.player?.name || '-'}</td>
                  <td className="py-2 px-3">{t.fromTeam?.name || '-'}</td>
                  <td className="py-2 px-3">{t.toTeam?.name || '-'}</td>
                  <td className="py-2 px-3">{t.fee || '-'}</td>
                  <td className="py-2 px-3">{t.season || '-'}</td>
                </tr>
              ))}
              {!transfers.length && <tr><td className="py-3 px-3 text-gray-600" colSpan={6}>No transfers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

