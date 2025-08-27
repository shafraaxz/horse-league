// components/pages/TeamsPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

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
    } catch (e) {
      setErr(e.message);
    } finally {
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
      onCreated?.(j.data);
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  if (!user) return (
    <div className="text-sm text-gray-600">Login to add teams.</div>
  );

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

export default function TeamsPage({ user }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/teams');
      const j = await r.json();
      setTeams(j?.data || j?.teams || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const h = () => {};
    window.addEventListener('season-changed', h);
    return () => window.removeEventListener('season-changed', h);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
      </div>

      <AddTeamInline onCreated={load} user={user} />

      <div className="bg-white rounded-2xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left border-b">
              <th className="py-2 px-3">Team</th>
              <th className="py-2 px-3">Short</th>
              <th className="py-2 px-3">Logo</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="py-3 px-3" colSpan={3}>Loading…</td></tr>}
            {!loading && !teams.length && <tr><td className="py-3 px-3 text-gray-600" colSpan={3}>No teams yet.</td></tr>}
            {teams.map(t => (
              <tr key={t._id} className="border-b last:border-none">
                <td className="py-2 px-3">{t.name}</td>
                <td className="py-2 px-3">{t.shortName || '-'}</td>
                <td className="py-2 px-3">{t.logo ? <img src={t.logo} alt="" className="h-6" /> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

