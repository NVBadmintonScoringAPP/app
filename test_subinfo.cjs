const http = require('http');

http.get('http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/85532f44-98fe-4f6d-9b02-f8053f052ee7', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('<div class="media__content-subinfo"');
    if (idx !== -1) {
      console.log('SUBINFO HTML:\n', data.slice(idx, idx + 1200));
    }
  });
});
