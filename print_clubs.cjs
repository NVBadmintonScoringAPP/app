const fs = require('fs');
const content = fs.readFileSync('src/lib/realMatchesSevlievo.ts', 'utf8');
const jsonStr = content.slice(content.indexOf('SEVLIEVO_REAL_MATCHES: TournamentMatch[] = ') + 'SEVLIEVO_REAL_MATCHES: TournamentMatch[] = '.length).trim().replace(/;$/, '');
const matches = JSON.parse(jsonStr);

console.log('Total matches:', matches.length);
const clubs = new Set();
matches.forEach(m => { clubs.add(m.team1Club); clubs.add(m.team2Club); });
console.log('Unique clubs across matches:', [...clubs]);

matches.slice(0, 10).forEach((m, i) => {
  console.log(`${i+1}. [Корт ${m.courtNumber}] ${m.eventCategory}: ${m.team1Player1} (${m.team1Club}) vs ${m.team2Player1} (${m.team2Club})`);
});
