// components/hooks/useSingleLeagueId.js
import { useEffect, useState } from 'react';

export default function useSingleLeagueId() {
  const [leagueId, setLeagueId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/leagues');
        const j = await res.json();
        const league = (j?.data || j?.leagues || [])[0];
        if (alive) setLeagueId(league?._id || null);
      } catch (e) {
        console.error('useSingleLeagueId failed', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { leagueId, loading };
}
