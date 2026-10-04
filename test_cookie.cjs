const https = require('https');
const fs = require('fs');

function request(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testWithCookie() {
  const cookie = 'st=l=1033&c=1&cp=1;';
  const res = await request({
    hostname: 'www.tournamentsoftware.com',
    path: '/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d/Matches',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Cookie': cookie,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });

  console.log('Status code:', res.statusCode);
  console.log('Redirect:', res.headers.location);
  console.log('Length:', res.body.length);
  console.log('Includes Млади таланти:', res.body.includes('Млади таланти'));

  if (res.statusCode === 200 || res.body.includes('Млади таланти')) {
    fs.writeFileSync('real_matches.html', res.body);
    console.log('Saved real_matches.html successfully!');
  }
}

testWithCookie().catch(console.error);
