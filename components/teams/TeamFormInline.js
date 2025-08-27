// components/teams/TeamFormInline.js
import React, { useState } from 'react';

export default function TeamFormInline({ leagueId, onSaved, onClose }) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = { name, shortName };
      if (logo) body.logo = logo;
      if (leagueId) body.league = leagueId;
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed to create team');
      onSaved?.(j.data);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Create Team</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="JT Sports Club" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Short Name</label>
            <input value={shortName} onChange={e=>setShortName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="JT" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo URL (optional)</label>
            <input value={logo} onChange={e=>setLogo(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="https://..." />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
