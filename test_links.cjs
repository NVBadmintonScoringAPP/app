const http = require('http');

http.get('http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/85532f44-98fe-4f6d-9b02-f8053f052ee7', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Print all navigation links (e.g. Players, Events, Draws, Matches, Locations)
    const navLinks = Array.from(data.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi));
    const interesting = navLinks
      .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
      .filter(l => l.text && l.href.includes('tournament/'));
    console.log('Interesting tournament links:', interesting.slice(0, 25));

    // Also look at the media header
    const mediaHeader = data.match(/<div class="media">([\s\S]*?)<\/div>/i);
    if (mediaHeader) {
      console.log('Media header snippet:', mediaHeader[1].replace(/\s+/g, ' ').slice(0, 500));
    }
  });
});
