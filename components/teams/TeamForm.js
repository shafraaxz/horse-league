// components/teams/TeamForm.js - Production-ready single-league form
import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

const TeamForm = ({ team, onSubmit, onCancel, leagues = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    homeGround: '',
    coach: '',
    league: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        shortName: team.shortName || '',
        primaryColor: team.primaryColor || '#3b82f6',
        secondaryColor: team.secondaryColor || '#1d4ed8',
        homeGround: team.homeGround || '',
        coach: team.coach || '',
        league: team.league?._id || team.league || ''
      });
      setLogoPreview(team.logo || null);
    }
  }, [team]);

  const updateField = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Logo must be smaller than 5MB');
      return;
    }
    setUploadError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Team name is required');
    if (!formData.league) return alert('Please select a league');

    setSubmitting(true);
    try {
      let logoUrl = formData.logo || '';
      if (logoFile) {
        const body = new FormData();
        body.append('file', logoFile);
        const resp = await fetch('/api/upload', { method: 'POST', body });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || 'Logo upload failed');
        }
        const json = await resp.json();
        logoUrl = json.secure_url || json.url || '';
      }

      const payload = { ...formData, name: formData.name.trim(), logo: logoUrl };
      await onSubmit(payload);
    } catch (err) {
      alert(err.message || 'Failed to save team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Team Name</label>
          <input value={formData.name} onChange={updateField('name')} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Red Falcons" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Short Name</label>
          <input value={formData.shortName} onChange={updateField('shortName')} maxLength={5} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., RFC" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Home Ground</label>
          <input value={formData.homeGround} onChange={updateField('homeGround')} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Stadium name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Coach</label>
          <input value={formData.coach} onChange={updateField('coach')} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Coach full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          <input type="color" value={formData.primaryColor} onChange={updateField('primaryColor')} className="mt-1 h-10 w-20 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
          <input type="color" value={formData.secondaryColor} onChange={updateField('secondaryColor')} className="mt-1 h-10 w-20 rounded" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">League</label>
          <select value={formData.league} onChange={updateField('league')} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select a league…</option>
            {leagues.map((lg) => (
              <option key={lg._id} value={lg._id}>{lg.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Logo</label>
          <div className="flex items-center space-x-4">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover border" />
                <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow" onClick={() => { setLogoFile(null); setLogoPreview(null); }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : null}
            <label className="inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4 mr-2" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>
          <p className="text-xs text-gray-500 mt-1">JPG/PNG/WebP up to 5MB • Square preferred</p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <button type="button" className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={onCancel}>Cancel</button>
        <button disabled={submitting} type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {submitting ? 'Saving…' : team ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </form>
  );
};

export default TeamForm;
