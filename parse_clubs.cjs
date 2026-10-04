const fs = require('fs');
const html = fs.readFileSync('clubs.html', 'utf8');

// Modern TS club links or table
const clubMap = {};

// Match club names
const clubMatches = Array.from(html.matchAll(/href="[^"]*club\.aspx\?id=[^"]*&amp;club=([0-9]+)"[^>]*>([\s\S]*?)<\/a>/gi));
clubMatches.forEach(m => {
  const id = m[1];
  const name = m[2].replace(/<[^>]+>/g, '').trim();
  if (name && !clubMap[id]) {
    clubMap[id] = name;
  }
});

console.log('Clubs Map:', JSON.stringify(clubMap, null, 2));

// Also let's check players page redirect
console.log('Unique clubs count:', Object.keys(clubMap).length);
