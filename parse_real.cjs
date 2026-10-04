const fs = require('fs');

const html = fs.readFileSync('real_matches.html', 'utf8');

// Let's inspect the match structures:
// Look for draw links, player links, match cards, match times
console.log('Matches length:', html.length);

// Check for draw links
const drawMatches = html.match(/href="[^"]*draw\.aspx[^"]*"/g) || [];
console.log('Draw links count:', drawMatches.length);

// Check for player links
const playerMatches = html.match(/href="[^"]*player\.aspx[^"]*"[^>]*>([^<]+)<\/a>/g) || [];
console.log('Player links count:', playerMatches.length);
console.log('Sample player links:', playerMatches.slice(0, 10));

// Let's find matches grouping
// In Tournament Software modern layout, matches are inside .match or .match--group or table or li
const timeMatches = html.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/gi) || [];
console.log('Times found:', timeMatches.slice(0, 15));
