const fs = require('fs');
const html = fs.readFileSync('multi_hall_tournament.html', 'utf8');

// Title of tournament
const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
console.log('Tournament title:', titleMatch ? titleMatch[1] : 'Unknown');

// Check location tooltips, court names, and days
const locations = new Set();
const courtTitles = Array.from(html.matchAll(/title="([^"]*(?:Location|Court|Корт|Зала)[^"]*)"/gi)).map(m => m[1]);
courtTitles.forEach(t => locations.add(t));

console.log('Unique location/court titles found in matches:', [...locations]);

// Check date/day headers
const days = new Set();
const dayMatches = Array.from(html.matchAll(/<h4 class="media__title media__title--sub"[^>]*>([^<]+)<\/h4>/gi)).map(m => m[1].trim());
dayMatches.forEach(d => days.add(d));

const navTabs = Array.from(html.matchAll(/class="nav-tab__title"[^>]*>([^<]+)<\/span>/gi)).map(m => m[1].trim());
console.log('Day headers found:', [...days]);
console.log('Nav tab dates found:', [...new Set(navTabs)]);

// Check sample matches and their court/location strings
const matchBlocks = html.split(/<div class="match\b/i).slice(1);
console.log('Total match blocks:', matchBlocks.length);

const locationCounts = {};
for (const b of matchBlocks) {
  const cMatch = b.match(/title="([^"]*(?:Location|Court|Корт|Зала)[^"]*)"/i);
  const loc = cMatch ? cMatch[1] : 'Unassigned';
  locationCounts[loc] = (locationCounts[loc] || 0) + 1;
}
console.log('Matches per location/court:', locationCounts);
