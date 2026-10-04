const fs = require('fs');

const clubsHtml = fs.readFileSync('clubs.html', 'utf8');
const matchesHtml = fs.readFileSync('real_matches.html', 'utf8');

// 1. Build club map
const clubMap = {
  '1': 'БК Оряхово',
  '2': 'БК Стара Загора',
  '3': 'БК Хасково',
  '4': 'БК Полски Тръмбеш',
  '5': 'БК Академик Сф',
  '6': 'БК Русе',
  '7': 'БК Анета Янева - НСА',
  '8': 'БК Брезово',
  '9': 'БК Дружба Сф',
  '10': 'БК Балкан Сф',
  '11': 'БК Габрово',
  '12': 'БК Ракетлон Варна',
  '13': 'БК Виктори Сф',
  '14': 'БК Севлиево',
  '15': 'БК Боляри ВТ'
};

const clubRegex = /<a href="club\.aspx\?id=[^"]*&club=([0-9]+)">([^<]+)<\/a>/gi;
let cm;
while ((cm = clubRegex.exec(clubsHtml)) !== null) {
  let clubName = cm[2].trim().replace(/^"|"$/g, '');
  if (!clubName.toLowerCase().startsWith('бк')) {
    clubName = 'БК ' + clubName;
  }
  clubMap[cm[1]] = clubName;
}

function cleanPlayerName(str) {
  if (!str) return '';
  let s = str
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\[[^\]]+\]/g, '')
    .trim();
  s = s.replace(/\s+\d+(?:\/\d+)?$/g, '').trim();
  return s.replace(/\s+/g, ' ');
}

// 2. Parse matches with exact clubs
const matchBlocks = matchesHtml.split(/<div class="match\b/i).slice(1);

const parsedMatches = [];
let mIdx = 1;

for (let bIdx = 0; bIdx < matchBlocks.length; bIdx++) {
  const block = matchBlocks[bIdx];

  // Category / Draw
  const drawMatch = block.match(/href="[^"]*draw\.aspx[^"]*"[^>]*><span[^>]*class="nav-link__value"[^>]*>([^<]+)<\/span>/i);
  const eventCategory = drawMatch ? cleanPlayerName(drawMatch[1]) : 'Национална Верига';

  // Round
  const roundMatch =
    block.match(/<li class="match__header-title-item">\s*<span[^>]*title="([^"]+)"/i) ||
    block.match(/<span title="([^"]+)" class="nav-link">/i);
  const round = roundMatch ? roundMatch[1].trim() : 'Кръг 1';

  // Court
  const courtMatch =
    block.match(/title="(?:Main Location\s*-\s*|Court\s*|Корт\s*)([0-9]+)"/i) ||
    block.match(/(?:Location|Корт|Court)\s*[-:]?\s*([0-9]+)/i);
  const courtNumber = courtMatch ? courtMatch[1] : String(((mIdx - 1) % 4) + 1);

  // Scheduled Time
  const timeMatch = block.match(/\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(?:AM|PM)?\b/i);
  const scheduledTime = timeMatch ? timeMatch[0] : '09:30';

  // Extract players and their club IDs
  const rowBlocks = block.split(/<div class="match__row\b/i).slice(1);
  const teams = [];

  for (const rBlock of rowBlocks) {
    const pLinks = Array.from(rBlock.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi));
    const playersInRow = [];

    for (const pl of pLinks) {
      const aTag = pl[0];
      if (!aTag.includes('player.aspx') && !aTag.includes('data-player-id')) continue;
      
      const clubIdMatch = aTag.match(/data-club-id="([^"]*)"/i);
      const clubId = clubIdMatch ? clubIdMatch[1] : '';
      const nameMatch = aTag.match(/<span class="nav-link__value">([^<]+)<\/span>/i);
      if (nameMatch) {
        const rawName = cleanPlayerName(nameMatch[1]);
        const club = clubMap[clubId] || 'БК Севлиево';
        playersInRow.push({ name: rawName, club });
      }
    }

    if (playersInRow.length === 0) {
      const spans = Array.from(rBlock.matchAll(/<span class="nav-link__value">([^<]+)<\/span>/gi));
      for (const sp of spans) {
        const val = cleanPlayerName(sp[1]);
        if (val && !val.includes('Main Location') && !val.includes('Round') && !val.includes('Court')) {
          playersInRow.push({ name: val, club: 'БК Севлиево' });
        }
      }
    }

    if (playersInRow.length > 0) {
      teams.push({
        p1: playersInRow[0].name,
        p2: playersInRow[1]?.name,
        club: playersInRow[0].club,
        club2: playersInRow[1]?.club,
      });
    }
  }

  if (teams.length >= 2) {
    const isDoubles = /MD|WD|XD|Двойки|Doubles/i.test(eventCategory) || teams[0].p2 !== undefined;
    const catCode = eventCategory.split('-')[0].trim();
    const matchNumber = `${catCode}-${round.replace(/\s+/g, '')}-${String(mIdx).padStart(2, '0')}`;

    parsedMatches.push({
      id: `TS-${mIdx + 100}`,
      matchNumber,
      courtNumber,
      scheduledTime,
      eventCategory,
      round,
      gameType: isDoubles ? 'doubles' : 'singles',
      team1Player1: teams[0].p1,
      team1Player2: teams[0].p2,
      team1Club: teams[0].club,
      team2Player1: teams[1].p1,
      team2Player2: teams[1].p2,
      team2Club: teams[1].club,
      format: '3x21',
      status: 'scheduled',
    });

    mIdx++;
  }
}

console.log('Total parsed matches:', parsedMatches.length);

// Write to realMatchesSevlievo.ts
const fileContent = `import type { TournamentMatch } from '@/types';

export const SEVLIEVO_TOURNAMENT_ID = 'd5dc93b1-c302-4162-8c4b-5d799b77f93d';
export const SEVLIEVO_TOURNAMENT_NAME = 'Млади таланти - Севлиево  03-04.10.2026 г.';
export const SEVLIEVO_TOURNAMENT_URL = 'https://www.tournamentsoftware.com/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d/Matches';

export const BULGARIAN_CLUBS_MAP: Record<string, string> = ${JSON.stringify(clubMap, null, 2)};

export const SEVLIEVO_REAL_MATCHES: TournamentMatch[] = ${JSON.stringify(parsedMatches, null, 2)};
`;

fs.writeFileSync('src/lib/realMatchesSevlievo.ts', fileContent, 'utf8');
console.log('src/lib/realMatchesSevlievo.ts updated with cleaned names and clubs!');
