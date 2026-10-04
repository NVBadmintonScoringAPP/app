import type { TournamentMatch, TournamentInfo } from '@/types';
import { scrapeTournamentMatches, parseTournamentSoftwareHtml, buildFullTournamentInfo, extractTournamentId } from './tournamentScraper';

export const DEFAULT_TOURNAMENT_URL = '';

export interface CourtConfig {
  courtNumber: string;
  location: string;
  label: string;
}

class TournamentService {
  private matches: TournamentMatch[] = [];
  private tournamentUrl: string = DEFAULT_TOURNAMENT_URL;
  private tournamentName: string = '';
  private tournamentInfo: TournamentInfo | null = null;
  private completedMatchIds: Set<string> = new Set();
  private assignedCourt: string = '1';
  private assignedLocation: string = '';
  private isManualMode: boolean = false;
  private isTournamentAuthorized: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }

  private init() {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('badminton_tournament_url');
      if (savedUrl) this.tournamentUrl = savedUrl;

      const savedName = localStorage.getItem('badminton_tournament_name');
      if (savedName) this.tournamentName = savedName;

      const savedInfo = localStorage.getItem('badminton_tournament_info');
      if (savedInfo) {
        try {
          this.tournamentInfo = JSON.parse(savedInfo);
        } catch {
          this.tournamentInfo = null;
        }
      }

      const savedCourt = localStorage.getItem('badminton_assigned_court');
      if (savedCourt) this.assignedCourt = savedCourt;

      const savedLoc = localStorage.getItem('badminton_assigned_location');
      if (savedLoc) this.assignedLocation = savedLoc;

      const savedManual = localStorage.getItem('badminton_is_manual_mode');
      if (savedManual) this.isManualMode = savedManual === 'true';

      const savedAuth = localStorage.getItem('badminton_tournament_authorized');
      if (savedAuth) this.isTournamentAuthorized = savedAuth === 'true';

      const savedCompleted = localStorage.getItem('badminton_completed_match_ids');
      if (savedCompleted) {
        try {
          this.completedMatchIds = new Set(JSON.parse(savedCompleted));
        } catch {
          this.completedMatchIds = new Set();
        }
      }

      const savedMatches = localStorage.getItem('badminton_tournament_matches');
      if (savedMatches) {
        try {
          const parsed = JSON.parse(savedMatches);
          this.matches = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.matches = [];
        }
      }
    }
  }

  public getTournamentUrl(): string {
    return this.tournamentUrl;
  }

  public setTournamentUrl(url: string) {
    this.tournamentUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_tournament_url', url);
    }
    this.notify();
  }

  public getTournamentName(): string {
    return this.tournamentName;
  }

  public setTournamentName(name: string) {
    this.tournamentName = name;
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_tournament_name', name);
    }
    this.notify();
  }

  public getTournamentInfo(): TournamentInfo | null {
    return this.tournamentInfo;
  }

  public setTournamentInfo(info: TournamentInfo | null) {
    this.tournamentInfo = info;
    if (typeof window !== 'undefined') {
      if (info) {
        localStorage.setItem('badminton_tournament_info', JSON.stringify(info));
      } else {
        localStorage.removeItem('badminton_tournament_info');
      }
    }
    this.notify();
  }

  public getAssignedCourt(): string {
    return this.assignedCourt;
  }

  public setAssignedCourt(court: string) {
    this.assignedCourt = court;
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_assigned_court', court);
    }
    this.notify();
  }

  public getAssignedLocation(): string {
    return this.assignedLocation;
  }

  public setAssignedLocation(location: string) {
    this.assignedLocation = location;
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_assigned_location', location);
    }
    this.notify();
  }

  public getIsManualMode(): boolean {
    return this.isManualMode;
  }

  public setIsManualMode(manual: boolean) {
    this.isManualMode = manual;
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_is_manual_mode', String(manual));
    }
    this.notify();
  }

  public isAuthorized(): boolean {
    return this.isTournamentAuthorized && Boolean(this.tournamentName || (this.tournamentInfo && this.tournamentInfo.totalMatches > 0)) && !this.isManualMode;
  }

  public authorizeTournamentForTablet(court?: string, location?: string): void {
    if (court) this.setAssignedCourt(court);
    if (location) this.setAssignedLocation(location);
    this.isTournamentAuthorized = true;
    this.isManualMode = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_tournament_authorized', 'true');
      localStorage.setItem('badminton_is_manual_mode', 'false');
    }
    this.notify();
  }

  public deauthorizeTournament(): void {
    this.isTournamentAuthorized = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('badminton_tournament_authorized');
    }
    this.notify();
  }

  public getAllMatches(): TournamentMatch[] {
    return [...this.matches];
  }

  /**
   * Returns dynamically all unique days/dates detected in the tournament
   */
  public getUniqueDays(): { key: string; label: string; count: number }[] {
    const dayMap = new Map<string, { key: string; label: string; count: number }>();

    for (const m of this.matches) {
      if (this.completedMatchIds.has(m.id) || m.status === 'finished') continue;
      const key = m.matchDate || m.matchDayLabel || '';
      if (key) {
        const existing = dayMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          dayMap.set(key, {
            key,
            label: m.matchDayLabel || key,
            count: 1,
          });
        }
      }
    }

    return Array.from(dayMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * Returns only unplayed/available matches (completed matches are strictly hidden!)
   * Optionally filtered by court and/or day
   */
  public getAvailableMatches(courtNumber?: string, dayKey?: string): TournamentMatch[] {
    return this.matches.filter((m) => {
      // If completed on tablet or marked finished in Tournament Software, hide it!
      if (this.completedMatchIds.has(m.id) || m.status === 'finished') {
        return false;
      }
      if (courtNumber && courtNumber !== 'all') {
        if (m.courtNumber.trim().toLowerCase() !== courtNumber.trim().toLowerCase()) {
          return false;
        }
      }
      if (dayKey && dayKey !== 'all') {
        const matchKey = m.matchDate || m.matchDayLabel || '';
        if (matchKey !== dayKey && !m.matchDayLabel?.includes(dayKey)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Returns list of all completed/scored matches (for Administrator History)
   */
  public getCompletedMatches(): TournamentMatch[] {
    return this.matches.filter((m) => this.completedMatchIds.has(m.id) || m.status === 'finished');
  }

  /**
   * Marks a match as officially finished and locked by Head Referee PIN
   */
  public markMatchCompleted(matchId: string, completedScore?: string) {
    this.completedMatchIds.add(matchId);
    const match = this.matches.find(
      (m) => m.id === matchId || m.matchNumber === matchId
    );
    if (match) {
      match.status = 'finished';
      this.completedMatchIds.add(match.id);
      if (completedScore) {
        match.completedScore = completedScore;
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_completed_match_ids', JSON.stringify([...this.completedMatchIds]));
      localStorage.setItem('badminton_tournament_matches', JSON.stringify(this.matches));
    }
  }

  /**
   * Resets and finishes the tournament, clearing matches and setting tablet ready for new tournament
   */
  public finishTournament() {
    this.matches = [];
    this.completedMatchIds.clear();
    this.tournamentName = '';
    this.tournamentInfo = null;
    this.tournamentUrl = '';
    this.isManualMode = false;
    this.isTournamentAuthorized = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('badminton_tournament_matches');
      localStorage.removeItem('badminton_completed_match_ids');
      localStorage.removeItem('badminton_tournament_url');
      localStorage.removeItem('badminton_tournament_name');
      localStorage.removeItem('badminton_tournament_info');
      localStorage.removeItem('badminton_is_manual_mode');
      localStorage.removeItem('badminton_tournament_authorized');
    }
    this.notify();
  }

  /**
   * Returns dynamically all unique courts and hall locations detected in the tournament
   */
  public getUniqueCourtsAndLocations(): CourtConfig[] {
    const map = new Map<string, CourtConfig>();

    for (const m of this.matches) {
      if (!m.courtNumber) continue; // court not published for this match
      const courtNum = m.courtNumber;
      const loc = m.location || '';
      const key = `${loc}-${courtNum}`;
      if (!map.has(key)) {
        map.set(key, {
          courtNumber: courtNum,
          location: loc,
          label: loc ? `${loc} · Корт ${courtNum}` : `Корт ${courtNum}`,
        });
      }
    }

    if (map.size === 0) {
      // Program has no courts yet: offer a plain selection, the operator decides
      const hall = this.tournamentInfo?.hallNames?.[0] || '';
      return ['1', '2', '3', '4', '5', '6'].map((n) => ({
        courtNumber: n,
        location: hall,
        label: `Корт ${n}`,
      }));
    }

    // Sort by court number numeric value
    return Array.from(map.values()).sort((a, b) => parseInt(a.courtNumber, 10) - parseInt(b.courtNumber, 10));
  }

  // 1. По Корт (By Court): извлича свободните мачове за даден корт (или всички при 'all')
  public getMatchesByCourt(courtNumber: string, dayKey?: string): TournamentMatch[] {
    return this.getAvailableMatches(courtNumber, dayKey);
  }

  public getNextMatchForCourt(courtNumber: string, dayKey?: string): TournamentMatch | undefined {
    const courtMatches = this.getAvailableMatches(courtNumber, dayKey);
    return courtMatches[0];
  }

  // 2. Чрез търсене (By Match ID / Player / Category / Day)
  public searchMatches(query: string, categoryFilter?: string, dayKey?: string): TournamentMatch[] {
    const q = query.trim().toLowerCase();
    const available = this.getAvailableMatches('all', dayKey);
    return available.filter((m) => {
      const matchIdMatch = m.id.toLowerCase().includes(q) || m.matchNumber.toLowerCase().includes(q);
      const playersMatch =
        m.team1Player1.toLowerCase().includes(q) ||
        (m.team1Player2 && m.team1Player2.toLowerCase().includes(q)) ||
        m.team2Player1.toLowerCase().includes(q) ||
        (m.team2Player2 && m.team2Player2.toLowerCase().includes(q)) ||
        (m.team1Club && m.team1Club.toLowerCase().includes(q)) ||
        (m.team2Club && m.team2Club.toLowerCase().includes(q));

      const categoryMatch = categoryFilter && categoryFilter !== 'all'
        ? m.eventCategory.toLowerCase().includes(categoryFilter.toLowerCase()) ||
          m.discipline?.toLowerCase() === categoryFilter.toLowerCase() ||
          m.gameType?.toLowerCase() === categoryFilter.toLowerCase()
        : true;

      if (!q) return categoryMatch;
      return (matchIdMatch || playersMatch) && categoryMatch;
    });
  }

  // 3. Чрез турнирен URL: извличане на всички срещи от Tournament Software
  public async syncWithTournamentUrl(url?: string): Promise<{ success: boolean; count: number; name?: string; error?: string }> {
    const targetUrl = url || this.tournamentUrl;
    const previousUrl = this.tournamentUrl;
    if (url) this.setTournamentUrl(url);

    try {
      const result = await scrapeTournamentMatches(targetUrl);
      if (result.success && result.matches.length > 0) {
        const prevId = extractTournamentId(previousUrl || '');
        const newId = extractTournamentId(targetUrl);
        if (prevId && newId && prevId.toLowerCase() !== newId.toLowerCase()) {
          this.completedMatchIds.clear();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('badminton_completed_match_ids');
          }
        }
        this.matches = result.matches;
        if (result.tournamentName) {
          this.setTournamentName(result.tournamentName);
        }
        if (result.tournamentInfo) {
          this.setTournamentInfo(result.tournamentInfo);
          if (result.tournamentInfo.venueName) {
            this.setAssignedLocation(result.tournamentInfo.venueName);
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('badminton_tournament_matches', JSON.stringify(this.matches));
        }
        return {
          success: true,
          count: this.matches.length,
          name: this.tournamentName,
        };
      }
      return { success: false, count: 0, error: result.error || 'Не бяха открити срещи за този линк' };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Грешка при извличане' };
    }
  }

  // Възможност за директно поставяне на HTML / изходен код от Tournament Software
  public parseAndImportHtml(html: string): { success: boolean; count: number } {
    const parsed = parseTournamentSoftwareHtml(html);
    if (parsed.length > 0) {
      this.matches = parsed;
      const { tournamentName, tournamentInfo } = buildFullTournamentInfo('', html, parsed);
      if (tournamentName) {
        this.setTournamentName(tournamentName);
      }
      if (tournamentInfo) {
        this.setTournamentInfo(tournamentInfo);
        if (tournamentInfo.venueName) {
          this.setAssignedLocation(tournamentInfo.venueName);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('badminton_tournament_matches', JSON.stringify(this.matches));
      }
      return { success: true, count: parsed.length };
    }
    return { success: false, count: 0 };
  }
}

let tournamentInstance: TournamentService | null = null;

export function getTournamentService(): TournamentService {
  if (!tournamentInstance) {
    tournamentInstance = new TournamentService();
  }
  return tournamentInstance;
}
