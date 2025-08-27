// components/auth/AuthPanel.js
import React, { useState } from 'react';

export default function AuthPanel({ onLoggedIn, onNavigate }) {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const login = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || j?.message || `Login failed (${res.status})`);
      const user = j?.user || j?.data?.user || j;
      if (!user) throw new Error('Login succeeded but user payload missing');
      onLoggedIn?.(user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow p-6 border">
      <h1 className="text-2xl font-semibold mb-4">Admin Login</h1>
      <p className="text-gray-600 text-sm mb-4">Sign in to manage The Horse Futsal League.</p>
      {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

      <form onSubmit={login} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            type="email"
            placeholder="admin@demo.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="text-gray-600 hover:underline"
            onClick={() => onNavigate?.('home')}
          >
            ← Back
          </button>
          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        Tip: If you haven’t seeded an admin yet, open DevTools console and run:
        <br />
        <pre className="mt-1 bg-gray-100 rounded p-2 overflow-x-auto">
          <code>
{`fetch('/api/setup', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)`}
          </code>
        </pre>
      </div>
    </div>
  );
}
