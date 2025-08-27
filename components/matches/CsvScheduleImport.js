// components/matches/CsvScheduleImport.js
import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';

const CsvScheduleImport = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const onTemplate = () => { window.location.href = '/api/matches/template-csv'; };

  const onImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setLoading(true); setResults([]);
    try {
      const res = await fetch('/api/matches/import-csv', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResults(data.results || []);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Import Match Schedule (CSV)</h3>
        <button onClick={onTemplate} className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg hover:bg-gray-50">
          <Download className="h-4 w-4" />
          Download CSV Template
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Expected columns: <code>date,time,homeTeam,awayTeam,venue,round,season</code>.
      </p>
      <form onSubmit={onImport} className="flex items-center gap-3">
        <input type="file" accept=".csv" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="block w-full text-sm border rounded-lg" />
        <button disabled={!file || loading} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          <Upload className="h-4 w-4" />
          {loading ? 'Importing...' : 'Import CSV'}
        </button>
      </form>
      {results.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Import Results</h4>
          <ul className="max-h-64 overflow-auto divide-y">
            {results.map((r, idx)=>(
              <li key={idx} className="py-2 text-sm flex items-center gap-2">
                {r.status === 'created' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                <span>{r.status === 'created' ? 'Created' : 'Skipped'} — {r.homeTeam} vs {r.awayTeam} {r.date ? `on ${r.date} ${r.time||''}` : ''} {r.reason ? `(${r.reason})` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CsvScheduleImport;
