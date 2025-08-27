// components/teams/AddTeamLauncher.js
import React, { useState, useCallback } from 'react';
import useSingleLeagueId from '../hooks/useSingleLeagueId';
import TeamFormInline from './TeamFormInline';

export default function AddTeamLauncher({ onCreated, className = '' }) {
  const { leagueId } = useSingleLeagueId();
  const [open, setOpen] = useState(false);

  const handleSaved = useCallback((t) => { onCreated?.(t); }, [onCreated]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700'}
      >
        + Add Team
      </button>
      {open && (
        <TeamFormInline
          leagueId={leagueId}
          onSaved={handleSaved}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
