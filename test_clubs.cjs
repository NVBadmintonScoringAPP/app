const http = require('http');
const base = 'https://www.tournamentsoftware.com';
const id = '85532f44-98fe-4f6d-9b02-f8053f052ee7';
function get(p) {
  return new Promise((resolve) => {
    http.get('http://localhost:8081/api/tournament-scrape?url=' + encodeURIComponent(base + p), (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
  });
}
(async () => {
  const d = await get(`/sport/clubs.aspx?id=${id}`);
  const links = [...d.matchAll(/<a[^>]*href="([^"]*club[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => m[1] + ' => ' + m[2].replace(/<[^>]+>/g, '').trim());
  console.log('CLUB LINKS', links.slice(0, 40));
  const p = await get(`/tournament/${id}/players`);
  const pl = [...p.matchAll(/data-club-id="(\d+)"/gi)].slice(0, 3);
  const i = p.indexOf('club');
  console.log('PLAYERS sample', p.slice(p.indexOf('player.aspx') - 300, p.indexOf('player.aspx') + 900).replace(/\r?\n\s*/g, ' '));
})();
