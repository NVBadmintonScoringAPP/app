const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  const url = 'http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d/Matches';
  console.log('Fetching:', url);
  const res = await fetch(url);
  console.log('STATUS:', res.status, 'LENGTH:', res.data.length);

  // Look for dates
  const dates = [...new Set(Array.from(res.data.matchAll(/data-value="([0-9]{8})"/g)).map(m => m[1]))];
  console.log('DATES:', dates);

  // Look for matches
  const matchBlocks = res.data.split(/<div class="match\b(?=[\s"])/i).slice(1);
  console.log('MATCH BLOCKS IN MAIN:', matchBlocks.length);

  // If dates exist, let's test fetching the first date
  // Test clubs
  const clubsUrl = 'http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/sport/clubs.aspx?id=d5dc93b1-c302-4162-8c4b-5d799b77f93d';
  const clubsRes = await fetch(clubsUrl);
  console.log('CLUBS STATUS:', clubsRes.status, 'LENGTH:', clubsRes.data.length);
  const clubsMatches = [...clubsRes.data.matchAll(/club\.aspx\?id=[^"]*?&(?:amp;)?club=(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log('CLUBS FOUND:', clubsMatches.length);
  if (clubsMatches.length > 0) {
    console.log('SAMPLE CLUBS:', clubsMatches.slice(0, 5).map(m => `${m[1]}: ${m[2].trim()}`));
  }
}

main().catch(console.error);
