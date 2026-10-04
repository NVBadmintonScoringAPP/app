const fs = require('fs');

const html = fs.readFileSync('real_matches.html', 'utf8');

// Match parser for Tournament Software modern match--list layout
function parseTournamentSoftwareMatches(htmlContent) {
  const matches = [];

  // Match blocks: <div class="match ... match--list" ...>
  // Let's split by class="match or class="match__header
  const matchBlocks = htmlContent.split(/<div class="match\b/i).slice(1);
  console.log('Total match blocks found:', matchBlocks.length);

  let matchIndex = 1;

  for (const block of matchBlocks) {
    // 1. Category and Draw (e.g. GS U13 - Group C)
    const drawMatch = block.match(/href="[^"]*draw\.aspx[^"]*"[^>]*><span[^>]*class="nav-link__value"[^>]*>([^<]+)<\/span>/i);
    const eventCategory = drawMatch ? drawMatch[1].trim() : 'Национална Верига';

    // 2. Round (e.g. Round 1, Quarterfinal, etc.)
    const roundMatch = block.match(/<li class="match__header-title-item">\s*<span[^>]*title="([^"]+)"/i) ||
                       block.match(/<span title="([^"]+)" class="nav-link">/i);
    const round = roundMatch ? roundMatch[1].trim() : 'Кръг 1';

    // 3. Court number: look for title="Main Location - 1" or title="Court 1" or Court 1
    const courtMatch = block.match(/title="(?:Main Location\s*-\s*|Court\s*|Корт\s*)([0-9]+)"/i) ||
                       block.match(/(?:Location|Корт|Court)\s*[-:]?\s*([0-9]+)/i);
    const courtNumber = courtMatch ? courtMatch[1] : String(((matchIndex - 1) % 4) + 1);

    // 4. Scheduled Time: look for time in previous group or block
    const timeMatch = block.match(/\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(?:AM|PM)?\b/i);
    const scheduledTime = timeMatch ? timeMatch[0] : '10:00';

    // 5. Players: look for <div class="match__row-title">...<span class="nav-link__value">Player Name</span>
    const rowBlocks = block.split(/<div class="match__row\b/i).slice(1);
    const playerNames = [];

    for (const rBlock of rowBlocks) {
      // Find all player names in this row (singles has 1, doubles has 2)
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

      // Format category code
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
console.log('Successfully extracted matches count:', matches.length);
console.log('Sample match 1:', JSON.stringify(matches[0], null, 2));
console.log('Sample match 2:', JSON.stringify(matches[1], null, 2));
console.log('Sample match 3:', JSON.stringify(matches[2], null, 2));

// Summary of courts:
const courtCounts = {};
matches.forEach(m => {
  courtCounts[m.courtNumber] = (courtCounts[m.courtNumber] || 0) + 1;
});
console.log('Courts breakdown:', courtCounts);
