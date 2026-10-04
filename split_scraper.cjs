const fs = require('fs');
const head = fs.readFileSync('src/lib/scraperHead.tmp', 'utf8');
const tail = fs.readFileSync('src/lib/scraperTail.tmp', 'utf8');
fs.writeFileSync('src/lib/tournamentScraper.ts', head + '\n' + tail);
fs.unlinkSync('src/lib/scraperHead.tmp');
fs.unlinkSync('src/lib/scraperTail.tmp');
console.log('done');
