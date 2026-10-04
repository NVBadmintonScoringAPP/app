const https = require('https');
const fs = require('fs');

async function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'www.tournamentsoftware.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'st=l=1033&c=1&cp=1;',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'bg,en;q=0.9',
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Fetching clubs...');
  const res1 = await fetchUrl('/sport/clubs.aspx?id=d5dc93b1-c302-4162-8c4b-5d799b77f93d');
  console.log('Clubs status:', res1.status, 'length:', res1.data.length);
  fs.writeFileSync('clubs.html', res1.data);

  console.log('Fetching players...');
  const res2 = await fetchUrl('/sport/players.aspx?id=d5dc93b1-c302-4162-8c4b-5d799b77f93d');
  console.log('Players status:', res2.status, 'length:', res2.data.length);
  fs.writeFileSync('players.html', res2.data);
}

run().catch(console.error);
