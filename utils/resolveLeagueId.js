// utils/resolveLeagueId.js
import { ensureSingleLeague } from './singleLeague';

export async function resolveLeagueId(input) {
  if (typeof input === 'string' && input.trim()) return input.trim();
  if (input && input._id) return String(input._id);
  const leagueDoc = await ensureSingleLeague();
  return String(leagueDoc._id);
}
