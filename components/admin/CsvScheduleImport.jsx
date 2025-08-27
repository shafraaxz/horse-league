// components/admin/CsvScheduleImport.jsx
import React, { useRef, useState } from 'react';

export default function CsvScheduleImport({ onImported }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setBusy(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/matches/import-csv', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || 'Import failed');
      setMsg(`Imported ${j.inserted} matches`);
      onImported?.(j);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={e => upload(e.target.files?.[0])} />
      {busy && <span className="text-sm text-gray-600">Uploading…</span>}
      {msg && <span className="text-sm text-gray-700">{msg}</span>}
    </div>
  );
}
