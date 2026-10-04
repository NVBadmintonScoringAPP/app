const http = require('http');

function extractMetadata(html) {
  // 1. Tournament Name
  let name = '';
  const h2Match = html.match(/<h2[^>]*class="[^"]*media__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    name = h2Match[1].replace(/<[^>]+>/g, '').trim();
  }
  if (!name) {
    const titleMatch = html.match(/<title>(?:Matches\s*[-–—]\s*)?([^|<]+?)(?:\s*\|.*)?<\/title>/i);
    if (titleMatch) name = titleMatch[1].trim();
  }

  // 2. Hall / Venue Name
  let venueName = '';
  const venueMatch = html.match(/<div class="media__img">[\s\S]*?alt="([^"]+)"/i);
  if (venueMatch) {
    venueName = venueMatch[1].replace(/&quot;/g, '"').trim();
  }

  // 3. Location / City / Org
  let location = '';
  let organization = '';
  const subMatch = html.match(/class="media__content-subinfo"[\s\S]*?<small[^>]*>([\s\S]*?)<\/small>/i);
  if (subMatch) {
    const raw = subMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = raw.split('|').map(p => p.trim());
    if (parts.length > 1) {
      organization = parts[0];
      location = parts[1];
    } else {
      location = raw;
    }
  }

  // 4. Dates
  let dates = '';
  const calMatch = html.match(/calendar\.svg[^>]*>[\s\S]*?<\/svg>\s*([^<]+)<\/span>/i);
  if (calMatch) {
    dates = calMatch[1].trim();
  }

  return { name, venueName, location, organization, dates };
}

http.get('http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode, 'LEN:', data.length);
    console.log('EXTRACTED METADATA:', JSON.stringify(extractMetadata(data), null, 2));
  });
});
