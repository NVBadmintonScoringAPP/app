import type { TournamentMatch, GameType, TournamentInfo } from '@/types';

export interface ScrapeResult {
  success: boolean;
  tournamentName?: string;
  tournamentInfo?: TournamentInfo;
  matches: TournamentMatch[];
  error?: string;
  sourceUrl?: string;
}

function cleanPlayerName(str: string): string {
  if (!str) return '';
  let s = str
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\[[^\]]+\]/g, '')
    .trim();
  s = s.replace(/\s+\d+(?:\/\d+)?$/g, '').trim();
  return s.replace(/\s+/g, ' ');
}

// Proxies to bypass browser CORS restrictions when fetching tournamentsoftware.com directly
const CORS_PROXIES = [
  (url: string) => `/api/tournament-scrape?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * Extracts Tournament ID / Key from various Tournament Software URL shapes
 */
export function extractTournamentId(url: string): string | null {
  try {
    const parsed = new URL(url);
    // 1. /sport/matches.aspx?id=GUID
    const idParam = parsed.searchParams.get('id');
    if (idParam) return idParam;

    // 2. /tournament/GUID
    const match = parsed.pathname.match(/\/tournament\/([a-zA-Z0-9\-_]+)/i);
    if (match && match[1]) return match[1];

    // 3. /sport/tournament?id=GUID
    const tidParam = parsed.searchParams.get('tid');
    if (tidParam) return tidParam;

    return null;
  } catch {
    return null;
  }
}

/**
 * Normalizes Tournament Software URL to the matches / schedule page
 */
export function normalizeMatchesUrl(url: string): string {
  try {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    const parsed = new URL(trimmed);
    const tournamentId = extractTournamentId(trimmed);

    // If it's a general tournament link, construct the matches page
    if (tournamentId && !parsed.pathname.toLowerCase().includes('matches')) {
      return `https://${parsed.host}/tournament/${tournamentId}/Matches`;
    }
    return trimmed;
  } catch {
    return url;
  }
}

/**
 * Formats YYYYMMDD date string to a friendly Bulgarian label e.g. "Ден 1 (Петък · 11 Сеп)"
 */
export function formatDayLabel(dateStr: string, index: number): string {
  if (!dateStr || dateStr.length < 8) return `Ден ${index + 1}`;
  try {
    const y = parseInt(dateStr.slice(0, 4), 10);
    const m = parseInt(dateStr.slice(4, 6), 10) - 1;
    const d = parseInt(dateStr.slice(6, 8), 10);
    const dt = new Date(y, m, d);
    const dayNames = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
    const monthNames = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
    const dayOfWeek = dayNames[dt.getDay()] || '';
    const month = monthNames[dt.getMonth()] || '';
    return `Ден ${index + 1} (${dayOfWeek} · ${d} ${month})`;
  } catch {
    return `Ден ${index + 1}`;
  }
}

export interface DisciplineInfo {
  gameType: GameType;
  discipline: 'singles' | 'doubles' | 'mixed';
  disciplineLabel: string;
  disciplineCode: string;
}

/**
 * Intelligent BWF and Bulgarian Circuit discipline detector
 */
export function detectDiscipline(category: string, hasTeamPartners: boolean): DisciplineInfo {
  const cat = (category || '').trim();

  // 1. Mixed Doubles (Смесени двойки: СмД, XD, Mixed)
  if (/СмД|СМД|смд|XD|Mixed|Смесен/i.test(cat)) {
    return {
      gameType: 'doubles',
      discipline: 'mixed',
      disciplineLabel: 'Смесени двойки',
      disciplineCode: 'СмД',
    };
  }

  // 2. Women's Doubles (Двойки жени: ЖД, WD, GD)
  if (/ЖД|Жд|жд|WD|GD/i.test(cat) || (/Двойки|Doubles/i.test(cat) && /Жен|Девой|Girl|Women|Lady/i.test(cat))) {
    return {
      gameType: 'doubles',
      discipline: 'doubles',
      disciplineLabel: 'Двойки жени',
      disciplineCode: 'ЖД',
    };
  }

  // 3. Men's Doubles (Двойки мъже: МД, MD, BD)
  if (/МД|Мд|мд|MD|BD/i.test(cat) || (/Двойки|Doubles/i.test(cat) && /Мъж|Юнош|Boy|Men/i.test(cat))) {
    return {
      gameType: 'doubles',
      discipline: 'doubles',
      disciplineLabel: 'Двойки мъже',
      disciplineCode: 'МД',
    };
  }

  // 4. Any other Doubles (Двойки)
  if (hasTeamPartners || /Двойки|Doubles/i.test(cat)) {
    return {
      gameType: 'doubles',
      discipline: 'doubles',
      disciplineLabel: 'Двойки',
      disciplineCode: 'Двойки',
    };
  }

  // 5. Women's Singles (Единично жени: ЖЕД, WS, GS)
  if (/ЖЕД|Жед|жед|WS|GS/i.test(cat) || (/Единично|Сингъл|Singles/i.test(cat) && /Жен|Девой|Girl|Women/i.test(cat))) {
    return {
      gameType: 'singles',
      discipline: 'singles',
      disciplineLabel: 'Единично жени',
      disciplineCode: 'ЖЕД',
    };
  }

  // 6. Men's Singles (Единично мъже: МЕД, MS, BS)
  if (/МЕД|Мед|мед|MS|BS/i.test(cat) || (/Единично|Сингъл|Singles/i.test(cat) && /Мъж|Юнош|Boy|Men/i.test(cat))) {
    return {
      gameType: 'singles',
      discipline: 'singles',
      disciplineLabel: 'Единично мъже',
      disciplineCode: 'МЕД',
    };
  }

  // 7. General Singles (Единично)
  if (/ЕД|Ед|ед|Сингъл|Единично|Singles/i.test(cat)) {
    return {
      gameType: 'singles',
      discipline: 'singles',
      disciplineLabel: 'Единично',
      disciplineCode: 'ЕД',
    };
  }

  return hasTeamPartners
    ? { gameType: 'doubles', discipline: 'doubles', disciplineLabel: 'Двойки', disciplineCode: 'Двойки' }
    : { gameType: 'singles', discipline: 'singles', disciplineLabel: 'Единично', disciplineCode: 'ЕД' };
}


/**
 * Converts Tournament Software times ("10:00 AM", "1:30 PM", "13:30") to 24h "HH:MM".
 * Returns '' when the time is not published.
 */
export function normalizeTime(raw: string): string {
  const m = (raw || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&');
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Parses the official clubs list of a tournament (sport/clubs.aspx) into { clubId: clubName }.
 * Club ids are tournament specific, so they must always be read from the tournament itself.
 */
export function parseClubsHtml(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of html.matchAll(/club\.aspx\?id=[^"]*?&(?:amp;)?club=(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const name = stripTags(m[2]);
    if (name) map[m[1]] = name;
  }
  return map;
}

const PLACEHOLDER_LABEL = 'Предстои определяне';

interface ParsedPlayer {
  id: string;
  name: string;
  club: string;
  placeholder: boolean;
}

/**
 * Parses Tournament Software matches HTML into structured TournamentMatch objects.
 * Nothing is invented: unknown time / court / club stay empty.
 */
export function parseTournamentSoftwareHtml(
  html: string,
  _fallbackUrl?: string,
  dateInfo?: { matchDate?: string; matchDayLabel?: string; matchDayIndex?: number },
  clubMap: Record<string, string> = {}
): TournamentMatch[] {
  const matches: TournamentMatch[] = [];
  if (!(html.includes('match--list') || html.includes('match__header') || html.includes('match__body'))) {
    return matches;
  }

  const dayKey = dateInfo?.matchDate || 'day';
  const sections = html.split(/<h5\b[^>]*match-group__header[^>]*>/i);
  let mIdx = 1;

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx];
    let sectionTime = '';
    if (sIdx > 0) {
      const headText = stripTags(section.split(/<\/h5>/i)[0]);
      const t = headText.match(/(\d{1,2}:\d{2})\s*(AM|PM)?/i);
      if (t) sectionTime = normalizeTime(`${t[1]} ${t[2] || ''}`);
    }

    const matchBlocks = section.split(/<div class="match\b(?=[\s"])/i).slice(1);

    for (const block of matchBlocks) {
      // 1. Draw (discipline / category) and group
      const drawMatch = block.match(/href="[^"]*draw\.aspx[^"]*"[^>]*><span[^>]*class="nav-link__value"[^>]*>([^<]+)<\/span>/i);
      const drawRaw = drawMatch ? cleanPlayerName(decodeEntities(drawMatch[1])) : '';
      const drawParts = drawRaw.match(/^(.*?)\s+-\s+(.+)$/);
      const eventCategory = (drawParts ? drawParts[1] : drawRaw).trim();
      const groupName = drawParts ? drawParts[2].trim() : '';

      // 2. Round
      const roundMatch =
        block.match(/<span title="([^"]+)" class="nav-link">/i) ||
        block.match(/<li class="match__header-title-item">\s*<span[^>]*title="([^"]+)"/i);
      const roundRaw = roundMatch ? decodeEntities(roundMatch[1]).trim() : '';
      const round = [groupName, roundRaw].filter(Boolean).join(' · ');

      // 3. Hall and court exactly as published: "зала “Иван Симеонов”  - 5"
      let location = '';
      let courtNumber = '';
      const footerLoc = block.match(/icon-marker[\s\S]*?nav-link__value">([^<]*)</i);
      const tooltipLoc = block.match(/title="(?:Duration:[^|"]*\|\s*)?([^"|]*?)"\s+data-toggle="tooltip"/i);
      const rawLoc = decodeEntities((footerLoc ? footerLoc[1] : tooltipLoc ? tooltipLoc[1] : '')).replace(/\s+/g, ' ').trim();
      if (rawLoc) {
        const lm = rawLoc.match(/^(.*?)\s*-\s*(\d+)$/);
        if (lm) {
          location = lm[1].trim();
          courtNumber = lm[2];
        } else {
          location = rawLoc;
        }
      }

      // 4. Finished?
      const hasWonTags = block.includes('tag--won') || block.includes('points__cell--won');
      const hasPoints = block.includes('class="points"') && block.includes('points__cell');
      const isAlreadyFinished = hasWonTags || hasPoints || block.includes('Duration:');
      let completedScore: string | undefined;
      if (isAlreadyFinished) {
        const pointCells = Array.from(
          block.matchAll(/<li[^>]*class="[^"]*points__cell[^"]*"[^>]*>\s*([0-9]+)\s*<\/li>/gi)
        ).map((m) => m[1]);
        if (pointCells.length >= 2) {
          const sets: string[] = [];
          for (let p = 0; p < pointCells.length - 1; p += 2) sets.push(`${pointCells[p]}:${pointCells[p + 1]}`);
          completedScore = sets.join(', ');
        }
      }

      // 5. Teams - each player is read together with his own club
      const teamRows = block.split(/<div class="match__row(?=[\s"])/i).slice(1);
      const teams: { p1: string; p2?: string; club: string; placeholder: boolean; players: ParsedPlayer[] }[] = [];

      for (const tRow of teamRows) {
        const players: ParsedPlayer[] = [];
        for (const vb of tRow.split(/<div class="match__row-title-value"/i).slice(1)) {
          const nameM = vb.match(/<span class="nav-link__value">([^<]+)<\/span>/i);
          if (nameM) {
            const name = cleanPlayerName(decodeEntities(nameM[1]));
            const pid = (vb.match(/data-player-id="(\d+)"/i) || [])[1] || '';
            const cid = (vb.match(/data-club-id="(\d+)"/i) || [])[1] || '';
            const isPh = /^(Bye|TBD|Winner|Loser|Победител|Загубил)\b/i.test(name);
            players.push({ id: pid, name, club: cid ? clubMap[cid] || '' : '', placeholder: isPh });
          } else {
            const txt = stripTags(vb.split(/<\/div>/i)[0]);
            if (txt) players.push({ id: '', name: txt, club: '', placeholder: true });
          }
        }
        const uniqueClubs = Array.from(new Set(players.filter((p) => !p.placeholder && p.club).map((p) => p.club)));
        teams.push({
          p1: players[0]?.name || PLACEHOLDER_LABEL,
          p2: players[1]?.name,
          club: uniqueClubs.join(' / '),
          placeholder: players.length === 0 || players.some((p) => p.placeholder),
          players,
        });
      }

      if (teams.length >= 2) {
        const hasPartners = !!teams[0].p2 || !!teams[1].p2;
        const disc = detectDiscipline(eventCategory, hasPartners);
        const catCode = eventCategory.split(/\s+/)[0] || disc.disciplineCode;
        const matchNumber = `${catCode}-${String(mIdx).padStart(2, '0')}`;
        const realPlayers = [...teams[0].players, ...teams[1].players]
          .filter((p) => !p.placeholder)
          .map((p) => ({ id: p.id, name: p.name, club: p.club }));

        matches.push({
          id: `TS-${dayKey}-${mIdx}`,
          matchNumber,
          courtNumber,
          location,
          scheduledTime: sectionTime,
          matchDate: dateInfo?.matchDate,
          matchDayLabel: dateInfo?.matchDayLabel,
          eventCategory,
          round,
          gameType: disc.gameType,
          discipline: disc.discipline,
          disciplineLabel: disc.disciplineLabel,
          team1Player1: teams[0].p1,
          team1Player2: teams[0].p2,
          team1Club: teams[0].club,
          team2Player1: teams[1].p1,
          team2Player2: teams[1].p2,
          team2Club: teams[1].club,
          format: '3x21',
          status: isAlreadyFinished ? 'finished' : 'scheduled',
          completedScore,
          isPlaceholder: teams[0].placeholder || teams[1].placeholder,
          players: realPlayers,
        });
        mIdx++;
      }
    }
  }

  return matches;
}

const BG_MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

function formatDateRange(isoDates: string[]): string {
  if (isoDates.length === 0) return '';
  const first = isoDates[0].split('-').map(Number);
  const last = isoDates[isoDates.length - 1].split('-').map(Number);
  if (first[1] === last[1] && first[0] === last[0]) {
    return first[2] === last[2]
      ? `${first[2]} ${BG_MONTHS[first[1] - 1]} ${first[0]}`
      : `${first[2]}–${last[2]} ${BG_MONTHS[first[1] - 1]} ${first[0]}`;
  }
  return `${first[2]} ${BG_MONTHS[first[1] - 1]} – ${last[2]} ${BG_MONTHS[last[1] - 1]} ${last[0]}`;
}

/**
 * Builds the verified tournament description. Everything comes from the tournament pages;
 * anything that is not published stays empty and is reported in `warnings`.
 */
export function buildFullTournamentInfo(
  overviewHtml: string,
  matchesHtml: string,
  matches: TournamentMatch[],
  extraWarnings: string[] = []
): { tournamentName: string; tournamentInfo: TournamentInfo } {
  const combinedHtml = `${overviewHtml}\n${matchesHtml}`;

  // Title - complete, exactly as published
  let name = '';
  const h2 = combinedHtml.match(/<h2[^>]*class="[^"]*media__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2) name = stripTags(h2[1]);
  if (!name) {
    const t = combinedHtml.match(/<title>(?:Matches\s*[-–—]\s*)?([^<]+?)(?:\s*\|[^<]*)?<\/title>/i);
    if (t) name = stripTags(t[1]);
  }

  // Organiser and place from the sub heading: "Organiser | Пазарджик, Bulgaria"
  let organization = '';
  let location = '';
  const sub = combinedHtml.match(/class="media__content-subinfo"[\s\S]*?<small[^>]*>([\s\S]*?)<\/small>/i);
  if (sub) {
    const parts = stripTags(sub[1]).split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      organization = parts[0];
      location = parts[1];
    } else if (parts.length === 1) {
      location = parts[0];
    }
  }
  const city = location.split(',')[0].trim();

  // Venue image alt on the overview page
  const venueAlt =
    overviewHtml.match(/<div class="media__img">[\s\S]*?<img[^>]*alt="([\s\S]*?)"/i) ||
    overviewHtml.match(/alt="((?:Спортна зала|Зала)[\s\S]*?)"/i);
  let venueFromOverview = venueAlt ? stripTags(venueAlt[1]) : '';
  if (venueFromOverview.includes('no-photo') || venueFromOverview.includes('Tournamentsoftware')) {
    venueFromOverview = '';
  }

  // Aggregates
  const playerKeys = new Set<string>();
  const noClubKeys = new Set<string>();
  const clubSet = new Set<string>();
  const courtSet = new Set<string>();
  const hallSet = new Set<string>();
  const discSet = new Set<string>();
  const roundSet = new Set<string>();
  const dateSet = new Set<string>();
  const dayMap = new Map<string, { key: string; label: string; count: number }>();
  let placeholderMatches = 0;
  let finishedMatches = 0;
  let matchesWithoutTime = 0;
  let matchesWithoutCourt = 0;

  for (const m of matches) {
    for (const p of m.players || []) {
      const key = p.id || p.name;
      playerKeys.add(key);
      if (p.club) clubSet.add(p.club);
      else noClubKeys.add(key);
    }
    if (m.courtNumber) courtSet.add(`${m.location || ''}|${m.courtNumber}`);
    else matchesWithoutCourt++;
    if (m.location) hallSet.add(m.location);
    if (m.eventCategory) discSet.add(m.eventCategory);
    if (m.round) roundSet.add(m.round);
    if (m.matchDate) dateSet.add(m.matchDate);
    if (!m.scheduledTime) matchesWithoutTime++;
    if (m.isPlaceholder) placeholderMatches++;
    if (m.status === 'finished') finishedMatches++;

    const dKey = m.matchDate || m.matchDayLabel || 'all';
    const d = dayMap.get(dKey);
    if (d) d.count++;
    else dayMap.set(dKey, { key: dKey, label: m.matchDayLabel || dKey, count: 1 });
  }

  let hallNames: string[] = [];
  if (venueFromOverview) {
    const cleanedHalls = Array.from(hallSet).map((h) =>
      h === 'Main Location' || h === 'Основна зала' ? venueFromOverview : h
    );
    if (!cleanedHalls.includes(venueFromOverview)) {
      cleanedHalls.unshift(venueFromOverview);
    }
    hallNames = Array.from(new Set(cleanedHalls));
    for (const m of matches) {
      if (!m.location || m.location === 'Main Location' || m.location === 'Основна зала') {
        m.location = venueFromOverview;
      }
    }
  } else {
    hallNames = Array.from(hallSet).filter((h) => h !== 'Main Location' && h !== 'Основна зала');
  }

  const dates = formatDateRange(Array.from(dateSet).sort());

  const warnings: string[] = [...extraWarnings];
  if (!name) warnings.push('Наименованието на турнира не беше намерено в страницата.');
  if (matches.length === 0) warnings.push('Не бяха открити срещи.');
  if (noClubKeys.size > 0) {
    warnings.push(`${noClubKeys.size} състезатели нямат въведен клуб в Tournament Software – полето им остава празно.`);
  }
  if (matchesWithoutTime > 0) warnings.push(`${matchesWithoutTime} срещи нямат публикуван час.`);
  if (matchesWithoutCourt > 0) {
    warnings.push(`${matchesWithoutCourt} срещи нямат определен корт – кортът се избира при зареждане на срещата.`);
  }
  if (placeholderMatches > 0) {
    warnings.push(`${placeholderMatches} срещи очакват определяне на състезатели (след групите) – използвайте „Синхронизирай“.`);
  }

  const tournamentInfo: TournamentInfo = {
    name,
    venueName: hallNames[0] || venueFromOverview || undefined,
    location: location || undefined,
    city: city || undefined,
    country: location.includes(',') ? location.split(',').slice(1).join(',').trim() : undefined,
    dates: dates || undefined,
    organization: organization || undefined,
    totalMatches: matches.length,
    totalPlayers: playerKeys.size,
    totalClubs: clubSet.size,
    totalCourts: courtSet.size,
    totalHalls: hallNames.length,
    hallNames,
    clubNames: Array.from(clubSet).sort((a, b) => a.localeCompare(b, 'bg')),
    days: Array.from(dayMap.values()).sort((a, b) => a.key.localeCompare(b.key)),
    disciplines: Array.from(discSet),
    rounds: Array.from(roundSet),
    placeholderMatches,
    finishedMatches,
    matchesWithoutTime,
    matchesWithoutCourt,
    playersWithoutClub: noClubKeys.size,
    warnings,
  };

  return { tournamentName: name, tournamentInfo };
}

function sortMatchesChronologically(list: TournamentMatch[]): TournamentMatch[] {
  return list
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const da = a.m.matchDate || '';
      const db = b.m.matchDate || '';
      if (da !== db) return da.localeCompare(db);
      const ta = a.m.scheduledTime || '99:99';
      const tb = b.m.scheduledTime || '99:99';
      if (ta !== tb) return ta.localeCompare(tb);
      return a.i - b.i;
    })
    .map((x) => x.m);
}

/**
 * Fetches the whole tournament (all days, clubs, overview) from one general tournament link.
 * No data is ever generated: when the site cannot be read the result is an honest error.
 */
export async function scrapeTournamentMatches(rawUrl: string): Promise<ScrapeResult> {
  const normalized = normalizeMatchesUrl(rawUrl);
  const tournamentId = extractTournamentId(normalized);
  if (!tournamentId) {
    return { success: false, matches: [], error: 'Линкът не съдържа идентификатор на турнир от Tournament Software.' };
  }

  let origin = 'https://www.tournamentsoftware.com';
  try {
    origin = new URL(normalized).origin;
  } catch {
    /* keep default */
  }
  const baseUrl = `${origin}/tournament/${tournamentId}`;
  let lastError = 'Неуспешна връзка с Tournament Software.';

  for (const getProxyUrl of CORS_PROXIES) {
    const fetchText = async (url: string): Promise<string> => {
      const res = await fetch(getProxyUrl(url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    };

    try {
      const main = await fetchText(`${baseUrl}/Matches`);
      if (!main || main.includes('form action="/cookiewall/Save"')) {
        lastError = 'Tournament Software изисква потвърждение на бисквитки.';
        continue;
      }

      const [overview, clubsHtml] = await Promise.all([
        fetchText(baseUrl).catch(() => ''),
        fetchText(`${origin}/sport/clubs.aspx?id=${tournamentId}`).catch(() => ''),
      ]);
      const clubMap = parseClubsHtml(clubsHtml);

      const dates = [...new Set(Array.from(main.matchAll(/data-value="([0-9]{8})"/g)).map((m) => m[1]))].sort();
      const warnings: string[] = [];
      let all: TournamentMatch[] = [];

      const dayInfo = (d: string, idx: number) => ({
        matchDate: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
        matchDayLabel: formatDayLabel(d, idx),
        matchDayIndex: idx + 1,
      });

      if (dates.length === 0) {
        all = parseTournamentSoftwareHtml(main, normalized, undefined, clubMap);
      } else {
        const perDay = await Promise.all(
          dates.map(async (d, idx) => {
            try {
              const html = dates.length === 1 ? main : await fetchText(`${baseUrl}/matches/${d}`);
              return { idx, d, list: parseTournamentSoftwareHtml(html, normalized, dayInfo(d, idx), clubMap), ok: true };
            } catch {
              return { idx, d, list: [] as TournamentMatch[], ok: false };
            }
          })
        );
        for (const r of perDay) {
          if (!r.ok) warnings.push(`Ден ${r.idx + 1} (${r.d}) не беше извлечен – натиснете „Синхронизирай“ отново.`);
          all.push(...r.list);
        }
      }

      if (all.length === 0) {
        lastError = 'Не бяха открити срещи за този линк.';
        continue;
      }

      all = sortMatchesChronologically(all);
      const { tournamentName, tournamentInfo } = buildFullTournamentInfo(overview, main, all, warnings);
      if (Object.keys(clubMap).length === 0) {
        tournamentInfo.warnings.push('Списъкът с клубове не беше достъпен – клубовете остават празни.');
      }

      return { success: true, matches: all, tournamentName, tournamentInfo, sourceUrl: normalized };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn('Tournament fetch failed:', err);
    }
  }

  return { success: false, matches: [], error: lastError, sourceUrl: normalized };
}
