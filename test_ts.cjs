const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  // Step 1: GET cookiewall to get initial cookies / form tokens
  const step1 = await request({
    hostname: 'www.tournamentsoftware.com',
    path: '/cookiewall/?returnurl=%2Ftournament%2Fd5dc93b1-c302-4162-8c4b-5d799b77f93d%2FMatches',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    }
  });

  const cookies1 = (step1.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log('Step 1 cookies:', cookies1);

  // Step 2: POST /cookiewall/Save with SelectedLCID=1033
  const postData = querystring.stringify({
    SelectedLCID: '1033'
  });

  const step2 = await request({
    hostname: 'www.tournamentsoftware.com',
    path: '/cookiewall/Save',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Cookie': cookies1,
      'Referer': 'https://www.tournamentsoftware.com/cookiewall/?returnurl=%2Ftournament%2Fd5dc93b1-c302-4162-8c4b-5d799b77f93d%2FMatches'
    }
  }, postData);

  const cookies2 = (step2.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log('Step 2 statusCode:', step2.statusCode, 'redirect:', step2.headers.location);
  console.log('Step 2 cookies:', cookies2);

  const allCookies = [cookies1, cookies2].filter(Boolean).join('; ');

  // Step 3: GET the actual matches page
  const step3 = await request({
    hostname: 'www.tournamentsoftware.com',
    path: '/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d/Matches',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Cookie': allCookies
    }
  });

  console.log('Step 3 statusCode:', step3.statusCode);
  console.log('Step 3 length:', step3.body.length);
  console.log('Contains Млади таланти:', step3.body.includes('Млади таланти'));

  if (step3.body.includes('Млади таланти')) {
    fs.writeFileSync('real_tournament.html', step3.body);
    console.log('SUCCESS! Saved real_tournament.html');
  }
}

run().catch(console.error);
