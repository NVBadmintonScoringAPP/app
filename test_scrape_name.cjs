const http = require('http');

http.get('http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/85532f44-98fe-4f6d-9b02-f8053f052ee7/Matches', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('DATA LENGTH:', data.length);
    const titleM = data.match(/<title>([\s\S]*?)<\/title>/i);
    console.log('TITLE:', titleM ? titleM[1].trim() : 'NONE');

    const h2M = data.match(/<h2[^>]*class="[^"]*media__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
    console.log('H2 MEDIA TITLE:', h2M ? h2M[1].replace(/<[^>]+>/g, '').trim() : 'NONE');

    const h1M = data.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    console.log('H1:', h1M ? h1M[1].replace(/<[^>]+>/g, '').trim() : 'NONE');

    // Look for venue / location in header
    const venueM = data.match(/class="[^"]*venue[^"]*"[^>]*>([\s\S]*?)<\//i);
    console.log('VENUE:', venueM ? venueM[1].replace(/<[^>]+>/g, '').trim() : 'NONE');

    // Look for organization
    const orgM = data.match(/class="[^"]*organization[^"]*"[^>]*>([\s\S]*?)<\//i);
    console.log('ORG:', orgM ? orgM[1].replace(/<[^>]+>/g, '').trim() : 'NONE');
  });
});
