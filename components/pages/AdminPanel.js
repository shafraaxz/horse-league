// components/pages/AdminPanel.js
import React, { useEffect, useState, useCallback } from 'react';
import SeasonSetter from '../admin/SeasonSetter';
import CsvScheduleImport from '../admin/CsvScheduleImport';

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="bg-white rounded-2xl shadow border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

const QuickTeamForm = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName, logo })
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed');
      setName(''); setShortName(''); setLogo('');
      onCreated?.(j.data);
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Field label="Team name">
        <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
      </Field>
      <Field label="Short name">
        <input className="w-full border rounded-lg px-3 py-2" value={shortName} onChange={e=>setShortName(e.target.value)} />
      </Field>
      <Field label="Logo URL">
        <input className="w-full border rounded-lg px-3 py-2" value={logo} onChange={e=>setLogo(e.target.value)} placeholder="https://..." />
      </Field>
      {err && <div className="md:col-span-3 text-sm text-red-600">{err}</div>}
      <div className="md:col-span-3 text-right">
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Team'}
        </button>
      </div>
    </form>
  );
};

const QuickPlayerForm = ({ teams, onCreated }) => {
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, team, position })
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed');
      setName(''); setTeam(''); setPosition('');
      onCreated?.(j.data);
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Field label="Player name">
        <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
      </Field>
      <Field label="Team">
        <select className="w-full border rounded-lg px-3 py-2" value={team} onChange={e=>setTeam(e.target.value)} required>
          <option value="">Select team</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Position">
        <input className="w-full border rounded-lg px-3 py-2" value={position} onChange={e=>setPosition(e.target.value)} placeholder="e.g., Pivot" />
      </Field>
      {err && <div className="md:col-span-3 text-sm text-red-600">{err}</div>}
      <div className="md:col-span-3 text-right">
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Player'}
        </button>
      </div>
    </form>
  );
};

const QuickMatchForm = ({ teams, onCreated }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [venue, setVenue] = useState('');
  const [round, setRound] = useState('');
  const [season, setSeason] = useState('2025/26');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const iso = date && time ? new Date(`${date}T${time}:00`) : null;
      const payload = {
        date: iso || undefined,
        homeTeam, awayTeam, venue, round, season,
        status: 'scheduled'
      };
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed');
      setDate(''); setTime(''); setHomeTeam(''); setAwayTeam(''); setVenue(''); setRound('');
      onCreated?.(j.data);
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-6 gap-3">
      <Field label="Date"><input type="date" className="w-full border rounded-lg px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} required /></Field>
      <Field label="Time"><input type="time" className="w-full border rounded-lg px-3 py-2" value={time} onChange={e=>setTime(e.target.value)} required /></Field>
      <Field label="Home"><select className="w-full border rounded-lg px-3 py-2" value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} required>
        <option value="">Select</option>{teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select></Field>
      <Field label="Away"><select className="w-full border rounded-lg px-3 py-2" value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} required>
        <option value="">Select</option>{teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select></Field>
      <Field label="Venue"><input className="w-full border rounded-lg px-3 py-2" value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Court A" /></Field>
      <Field label="Round"><input className="w-full border rounded-lg px-3 py-2" value={round} onChange={e=>setRound(e.target.value)} placeholder="Matchday 1" /></Field>
      <Field label="Season"><input className="w-full border rounded-lg px-3 py-2" value={season} onChange={e=>setSeason(e.target.value)} /></Field>
      {err && <div className="lg:col-span-6 text-sm text-red-600">{err}</div>}
      <div className="lg:col-span-6 text-right">
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Match'}
        </button>
      </div>
    </form>
  );
};

export default function AdminPanel() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);

  const refreshTeams = useCallback(async () => {
    const r = await fetch('/api/teams'); const j = await r.json();
    setTeams(j?.data || j?.teams || []);
  }, []);
  const refreshMatches = useCallback(async () => {
    const r = await fetch('/api/matches'); const j = await r.json();
    setMatches(j?.data || j?.matches || []);
  }, []);

  useEffect(() => { refreshTeams(); refreshMatches(); }, [refreshTeams, refreshMatches]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Tools — The Horse Futsal League</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Current Season">
          <SeasonSetter onSaved={() => { /* no-op */ }} />
        </Section>

        <Section
          title="Schedule via CSV"
          right={
            <div className="flex gap-2">
              <a href="/api/matches/template-csv" className="px-3 py-2 rounded-lg border">Download CSV template</a>
              <a href="/api/export/schedule-pdf" className="px-3 py-2 rounded-lg border">Download schedule PDF</a>
            </div>
          }
        >
          <CsvScheduleImport onImported={() => refreshMatches()} />
        </Section>
      </div>

      <Section title="Teams">
        <QuickTeamForm onCreated={refreshTeams} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-2">Name</th><th>Short</th><th>Logo</th></tr></thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id} className="border-b last:border-none">
                  <td className="py-2">{t.name}</td>
                  <td>{t.shortName || '-'}</td>
                  <td>{t.logo ? <img src={t.logo} alt="" className="h-6" /> : '-'}</td>
                </tr>
              ))}
              {!teams.length && <tr><td className="py-2 text-gray-500" colSpan={3}>No teams yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Players">
        <QuickPlayerForm teams={teams} onCreated={() => { /* optional refresh */ }} />
      </Section>

      <Section title="Matches">
        <QuickMatchForm teams={teams} onCreated={refreshMatches} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b">
              <th className="py-2">Date</th><th>Home</th><th>Away</th><th>Venue</th><th>Round</th><th>Season</th><th>Status</th>
            </tr></thead>
            <tbody>
              {matches.map(m => (
                <tr key={m._id} className="border-b last:border-none">
                  <td className="py-2">{m.date ? new Date(m.date).toLocaleString() : '-'}</td>
                  <td>{m.homeTeam?.name || '-'}</td>
                  <td>{m.awayTeam?.name || '-'}</td>
                  <td>{m.venue || '-'}</td>
                  <td>{m.round || '-'}</td>
                  <td>{m.season || '-'}</td>
                  <td>{m.status || '-'}</td>
                </tr>
              ))}
              {!matches.length && <tr><td className="py-2 text-gray-500" colSpan={7}>No matches yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
