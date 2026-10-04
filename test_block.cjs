const http = require('http');
http.get('http://localhost:8081/api/tournament-scrape?url=' + encodeURIComponent('https://www.tournamentsoftware.com/tournament/85532f44-98fe-4f6d-9b02-f8053f052ee7/matches/20260912'), (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const i = d.indexOf('<div class="match ');
    console.log(d.slice(i, i + 4500).replace(/\r?\n\s*/g, ' '));
    const g = d.indexOf('match-group__header');
    console.log('\nGROUP:', d.slice(g - 50, g + 300).replace(/\r?\n\s*/g, ' '));
  });
});
