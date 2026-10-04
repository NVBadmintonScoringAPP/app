const fs = require('fs');

// Check what html files we have
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('HTML files:', files);

let html = '';
if (fs.existsSync('test_full.html')) {
  html = fs.readFileSync('test_full.html', 'utf8');
} else if (files.length > 0) {
  html = fs.readFileSync(files[0], 'utf8');
}

console.log('HTML length:', html.length);

const matchIdx = html.indexOf('match--list');
if (matchIdx !== -1) {
  console.log('Match snippet:\n', html.substring(matchIdx, matchIdx + 2000));
} else {
  console.log('match--list not found');
}
