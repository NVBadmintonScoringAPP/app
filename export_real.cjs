const fs = require('fs');

const html = fs.readFileSync('real_matches.html', 'utf8');

function parseTournamentSoftwareMatches(htmlContent) {
  const matches = [];
  const matchBlocks = htmlContent.split(/<div class="match\b/i).slice(1);
  let matchIndex = 1;

  for (const block of matchBlocks) {
    const drawMatch = block.match(/href="[^"]*draw\.aspx[^"]*"[^>]*><span[^>]*class="nav-link__value"[^>]*>([^<]+)<\/span>/i);
    const eventCategory = drawMatch ? drawMatch[1].trim() : 'Национална Верига';

    const roundMatch = block.match(/<li class="match__header-title-item">\s*<span[^>]*title="([^"]+)"/i) ||
                       block.match(/<span title="([^"]+)" class="nav-link">/i);
    const round = roundMatch ? roundMatch[1].trim() : 'Кръг 1';

    const courtMatch = block.match(/title="(?:Main Location\s*-\s*|Court\s*|Корт\s*)([0-9]+)"/i) ||
                       block.match(/(?:Location|Корт|Court)\s*[-:]?\s*([0-9]+)/i);
    const courtNumber = courtMatch ? courtMatch[1] : String(((matchIndex - 1) % 4) + 1);

    const timeMatch = block.match(/\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(?:AM|PM)?\b/i);
    const scheduledTime = timeMatch ? timeMatch[0] : '09:30';

    const rowBlocks = block.split(/<div class="match__row\b/i).slice(1);
    const playerNames = [];

    for (const rBlock of rowBlocks) {
      const pMatches = Array.from(rBlock.matchAll(/<span class="nav-link__value">([^<]+)<\/span>/gi));
      const names = pMatches.map(m => m[1].trim()).filter(n => n && !n.includes('Main Location') && !n.includes('Round'));
      playerNames.push(...names);
    }

    if (playerNames.length >= 2) {
      const isDoubles = /MD|WD|XD|Двойки|Doubles/i.test(eventCategory) || playerNames.length >= 4;
      const gameType = isDoubles ? 'doubles' : 'singles';

      let team1P1 = playerNames[0];
      let team1P2 = undefined;
      let team2P1 = playerNames[1];
      let team2P2 = undefined;

      if (isDoubles && playerNames.length >= 4) {
        team1P1 = playerNames[0];
        team1P2 = playerNames[1];
        team2P1 = playerNames[2];
        team2P2 = playerNames[3];
      }

      const catCode = eventCategory.split('-')[0].trim();
      const matchNumber = `${catCode}-${round.replace(/\s+/g, '')}-${String(matchIndex).padStart(2, '0')}`;

      matches.push({
        id: `TS-${matchIndex + 100}`,
        matchNumber,
        courtNumber,
        scheduledTime,
        eventCategory,
        round,
        gameType,
        team1Player1: team1P1,
        team1Player2: team1P2,
        team1Club: 'БК Севлиево',
        team2Player1: team2P1,
        team2Player2: team2P2,
        team2Club: 'БК Севлиево',
        format: '3x21',
        status: 'scheduled',
      });

      matchIndex++;
    }
  }

  return matches;
}

const matches = parseTournamentSoftwareMatches(html);
const tsCode = `import type { TournamentMatch } from '@/types';

export const SEVLIEVO_TOURNAMENT_URL = 'https://www.tournamentsoftware.com/tournament/d5dc93b1-c302-4162-8c4b-5d799b77f93d/Matches';
export const SEVLIEVO_TOURNAMENT_NAME = 'Млади таланти - Севлиево';

export const SEVLIEVO_REAL_MATCHES: TournamentMatch[] = ${JSON.stringify(matches, null, 2)};
`;

fs.writeFileSync('src/lib/realMatchesSevlievo.ts', tsCode, 'utf8');
console.log('Created src/lib/realMatchesSevlievo.ts with', matches.length, 'matches!');
