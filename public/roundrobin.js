// roundrobin.js
function generateDoubleRoundRobin(teams) {
    const rounds = [];
    const teamCount = teams.length;
    const isOdd = teamCount % 2 !== 0;
    const teamsList = [...teams];

    if (isOdd) {
        teamsList.push("BYE"); // placeholder for odd team counts
    }

    const totalRounds = (teamsList.length - 1) * 2;
    const half = teamsList.length / 2;

    // First half (normal home/away)
    let arr = [...teamsList];
    for (let round = 0; round < teamsList.length - 1; round++) {
        const matches = [];
        for (let i = 0; i < half; i++) {
            const home = arr[i];
            const away = arr[teamsList.length - 1 - i];
            if (home !== "BYE" && away !== "BYE") {
                matches.push({ round: round + 1, homeTeam: home, awayTeam: away });
            }
        }
        rounds.push(matches);
        arr.splice(1, 0, arr.pop()); // rotate teams except the first
    }

    // Second half (swap home/away)
    const secondHalf = rounds.map((matches, idx) =>
        matches.map(m => ({
            round: idx + 1 + (teamsList.length - 1),
            homeTeam: m.awayTeam,
            awayTeam: m.homeTeam
        }))
    );

    return [...rounds, ...secondHalf];
}

// Example usage if you want to test in console:
if (typeof window !== 'undefined') {
    window.generateDoubleRoundRobin = generateDoubleRoundRobin;
}
