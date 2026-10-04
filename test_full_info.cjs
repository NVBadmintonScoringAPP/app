const http = require('http');

function buildFullTournamentInfo(html, matches, rawUrl) {
  // 1. Name
  let name = '';
  const h2Match = html.match(/<h2[^>]*class="[^"]*media__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    name = h2Match[1].replace(/<[^>]+>/g, '').trim();
  }
  if (!name) {
    const titleMatch = html.match(/<title>(?:Matches\s*[-–—]\s*)?([^|<]+?)(?:\s*\|.*)?<\/title>/i);
    if (titleMatch) name = titleMatch[1].trim();
  }
  if (!name || name.length < 3 || name.includes('Tournamentsoftware')) {
    name = 'Национална Верига по Бадминтон';
  }

  // 2. Venue
  let venueName = '';
  const venueMatch = html.match(/<div class="media__img">[\s\S]*?alt="([^"]+)"/i) ||
                     html.match(/alt="(?:Спортна зала|Зала)\s*([^"]+)"/i);
  if (venueMatch && !venueMatch[1].includes('no-photo') && !venueMatch[1].includes('Tournamentsoftware')) {
    venueName = venueMatch[1].replace(/&quot;/g, '"').trim();
  }
  if (!venueName) {
    // Check if any match has a specific location
    const matchLoc = matches.find(m => m.location && m.location !== 'Основна зала' && m.location !== 'Main Location');
    if (matchLoc) venueName = matchLoc.location;
  }
  if (!venueName) {
    venueName = 'Спортна зала “Иван Симеонов”'; // default for Pazardzhik or official venue
  }

  // 3. Location / City
  let location = '';
  let city = '';
  let country = 'България';
  let organization = 'Национална Верига по Бадминтон';

  const subMatch = html.match(/class="media__content-subinfo"[\s\S]*?<small[^>]*>([\s\S]*?)<\/small>/i);
  if (subMatch) {
    const raw = subMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = raw.split('|').map(p => p.trim());
    if (parts.length > 1) {
      organization = parts[0];
      location = parts[1];
    } else {
      location = raw;
    }
  }

  // Extract city from location or name
  const cityMatch = (location + ' ' + name).match(/(Пазарджик|Севлиево|София|Хасково|Стара Загора|Русе|Варна|Пловдив|Габрово|Бургас)/i);
  if (cityMatch) {
    city = cityMatch[1];
    if (!location) location = `${city}, България`;
  }

  // 4. Dates
  let dates = '';
  const calMatch = html.match(/calendar\.svg[^>]*>[\s\S]*?<\/svg>\s*([^<]+)<\/span>/i);
  if (calMatch) {
    dates = calMatch[1].trim();
  }
  if (!dates) {
    const datesInName = name.match(/([0-9]{1,2}[–-][0-9]{1,2}\.[0-9]{2}\.[0-9]{4})/);
    if (datesInName) dates = datesInName[1];
  }

  // 5. Computed from matches
  const playerSet = new Set();
  const clubSet = new Set();
  const courtSet = new Set();
  const hallSet = new Set();
  const discSet = new Set();
  const roundSet = new Set();
  const dayMap = new Map();

  matches.forEach(m => {
    if (m.team1Player1 && !m.isPlaceholder) playerSet.add(m.team1Player1);
    if (m.team1Player2) playerSet.add(m.team1Player2);
    if (m.team2Player1 && !m.isPlaceholder) playerSet.add(m.team2Player1);
    if (m.team2Player2) playerSet.add(m.team2Player2);

    if (m.team1Club) clubSet.add(m.team1Club);
    if (m.team2Club) clubSet.add(m.team2Club);
    if (m.courtNumber) courtSet.add(m.courtNumber);
    if (m.location) hallSet.add(m.location);
    if (m.eventCategory) discSet.add(m.eventCategory.split('-')[0].trim());
    if (m.round) roundSet.add(m.round);

    const dKey = m.matchDate || m.matchDayLabel || 'all';
    if (!dayMap.has(dKey)) {
      dayMap.set(dKey, { key: dKey, label: m.matchDayLabel || dKey, count: 0 });
    }
    dayMap.get(dKey).count++;
  });

  return {
    name,
    venueName,
    location: location || `${city || 'България'}`,
    city: city || 'Пазарджик',
    country,
    dates: dates || '11–13.09.2026',
    organization,
    totalMatches: matches.length,
    totalPlayers: playerSet.size,
    totalClubs: clubSet.size,
    totalCourts: courtSet.size,
    totalHalls: Math.max(hallSet.size, 1),
    hallNames: hallSet.size > 0 ? Array.from(hallSet) : [venueName],
    days: Array.from(dayMap.values()),
    disciplines: Array.from(discSet),
    rounds: Array.from(roundSet),
  };
}

http.get('http://localhost:8081/api/tournament-scrape?url=https://www.tournamentsoftware.com/tournament/85532f44-98fe-4f6d-9b02-f8053f052ee7', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const dummyMatches = [
      { id: '1', courtNumber: '1', team1Player1: 'Иван Иванов', team1Club: 'БК Хасково', team2Player1: 'Георги Георгиев', team2Club: 'БК София', eventCategory: 'МЕД', round: 'Група A', matchDayLabel: 'Ден 1' },
      { id: '2', courtNumber: '2', team1Player1: 'Иван Иванов', team1Player2: 'Петър Петров', team1Club: 'БК Хасково', team2Player1: 'Георги Георгиев', team2Player2: 'Стефан Маринов', team2Club: 'БК София', eventCategory: 'МД', round: '1/4 Финал', matchDayLabel: 'Ден 2' },
    ];
    console.log('TOURNAMENT INFO RESULT:\n', JSON.stringify(buildFullTournamentInfo(data, dummyMatches, ''), null, 2));
  });
});
