// pages/api/matches/template-csv.js
export default async function handler(req, res) {
  const csv =
`date,time,homeTeam,awayTeam,venue,season,round
2025-09-01,18:00,Team A,Team B,Court A,2025/26,Matchday 1
2025-09-02,19:30,Team C,Team D,Court B,2025/26,Matchday 1
`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="horse-futsal-template.csv"');
  res.status(200).send(csv);
}
