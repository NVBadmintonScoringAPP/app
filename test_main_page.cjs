const http = require('http');

http.get('http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/85532f44-98fe-4f6d-9b02-f8053f052ee7', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Print title, info blocks, location, venue, dates
    console.log('--- HTML SNIPPETS ---');
    const titleMatch = data.match(/<title>([\s\S]*?)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1].trim() : 'NONE');

    // Look for venue / address
    const venueMatches = Array.from(data.matchAll(/class="[^"]*venue[^"]*"[^>]*>([\s\S]*?)<\//gi));
    console.log('Venues:', venueMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()));

    // Look for location list or location items
    const locMatches = Array.from(data.matchAll(/class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\//gi));
    console.log('Locations:', locMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()));

    // Look for date range or time
    const dateRangeMatch = data.match(/class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\//i);
    console.log('Date block:', dateRangeMatch ? dateRangeMatch[1].replace(/<[^>]+>/g, '').trim() : 'NONE');

    // Look for city / address in page
    const addressMatches = Array.from(data.matchAll(/<address[^>]*>([\s\S]*?)<\/address>/gi));
    console.log('Addresses:', addressMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()));

    // Look for description or info items
    const infoItems = Array.from(data.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi));
    console.log('DT/DD pairs:', infoItems.map(m => `${m[1].replace(/<[^>]+>/g, '').trim()}: ${m[2].replace(/<[^>]+>/g, '').trim()}`));
  });
});
