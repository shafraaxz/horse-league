// utils/singleLeague.js
import dbConnect from '../lib/mongodb';
import League from '../models/League';

export async function ensureSingleLeague() {
  await dbConnect();
  const name = 'The Horse Futsal League';
  const slug = 'the-horse-futsal-league';
  let league = await League.findOne({ slug }) || await League.findOne({ name });
  if (!league) {
    league = await League.create({
      name,
      slug,
      type: 'league',
      sport: 'football',
      description: 'Official futsal competition',
      currentSeason: '2025/26'
    });
  }
  return league;
}

export async function getSingleLeagueId() {
  const league = await ensureSingleLeague();
  return league._id;
}
