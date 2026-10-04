// Test scrapeTournamentMatches on user URL
const http = require('http');

global.fetch = function(url, opts) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    }).on('error', reject);
  });
};

function parseClubsHtml(html) {
  const map = {};
  for (const m of html.matchAll(/club\.aspx\?id=[^"]*?&(?:amp;)?club=(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const name = m[2].replace(/<[^>]+>/g, '').trim();
    if (name) map[m[1]] = name;
  }
  return map;
}

function cleanPlayerName(str) {
  if (!str) return '';
  return str.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').replace(/\[[^\]]+\]/g, '').replace(/\s+\d+(?:\/\d+)?$/g, '').trim();
}

function normalizeTime(raw) {
  const m = (raw || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const ap = m[3] ? m[3].toUpperCase() : '';
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

async function testFull() {
  const rawUrl = 'https://www.tournamentsoftware.com/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d/Matches';
  const tid = 'd5dc93b1-c302-4162-8c4b-5d799b77f93d';
  const proxy = (u) => `http://localhost:8081/api/tournament-scrape?url=${encodeURIComponent(u)}`;

  const mainRes = await fetch(proxy(`https://www.tournamentsoftware.com/tournament/${tid}/Matches`));
  const main = await mainRes.text();

  const ovRes = await fetch(proxy(`https://www.tournamentsoftware.com/tournament/${tid}`));
  const ov = await ovRes.text();

  const clRes = await fetch(proxy(`https://www.tournamentsoftware.com/sport/clubs.aspx?id=${tid}`));
  const cl = await clRes.text();
  const clubMap = parseClubsHtml(cl);

  console.log('CLUBS MAP COUNT:', Object.keys(clubMap).length);

  const dates = [...new Set(Array.from(main.matchAll(/data-value="([0-9]{8})"/g)).map((m) => m[1]))].sort();
  console.log('DATES:', dates);

  let allMatches = [];
  for (let idx = 0; idx < dates.length; idx++) {
    const d = dates[idx];
    const dayUrl = `https://www.tournamentsoftware.com/tournament/${tid}/matches/${d}`;
    const dayRes = await fetch(proxy(dayUrl));
    const dayHtml = await dayRes.text();
    const dayInfo = {
      matchDate: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      matchDayLabel: formatDayLabel(d, idx),
      matchDayIndex: idx + 1,
    };
    const list = parseTournamentSoftwareHtml(dayHtml, rawUrl, dayInfo, clubMap);
    console.log(`DAY ${idx+1} (${d}): parsed ${list.length} matches`);
    allMatches.push(...list);
  }

  console.log('TOTAL MATCHES PARSED:', allMatches.length);

  const { tournamentName, tournamentInfo } = buildFullTournamentInfo(ov, main, allMatches);
  console.log('TOURNAMENT NAME:', tournamentName);
  console.log('TOURNAMENT INFO:', JSON.stringify(tournamentInfo, null, 2));
}

testFull().catch(console.error);
