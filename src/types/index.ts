export type ServingSide = 'left' | 'right';
export type CourtPosition = 'right' | 'left'; // Right = even score (0,2,4...), Left = odd score (1,3,5...)
export type MatchStatus = 'in_progress' | 'completed' | 'scheduled';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type MatchFormat = '3x21' | '3x15' | 'custom';
export type GameType = 'singles' | 'doubles';
export type CardColor = 'yellow' | 'red' | 'black';

export interface CustomFormatConfig {
  pointsToWin: number;
  bestOf: number; // 1 or 3
  capAt: number;
  sideSwitchAt: number;
  intervalAt: number;
  deuceMargin: number;
}

export interface TournamentMatch {
  id: string;
  matchNumber: string;
  courtNumber: string;
  scheduledTime: string;
  matchDate?: string;
  matchDayLabel?: string;
  eventCategory: string; // e.g. "MS", "WS", "MD", "WD", "XD", "СмД", "МД", "ЖД", "МЕД", "ЖЕД"
  round: string; // e.g. "R16", "QF", "SF", "Final", "Group C"
  gameType: GameType;
  discipline?: 'singles' | 'doubles' | 'mixed';
  disciplineLabel?: string;
  team1Player1: string;
  team1Player2?: string;
  team1Club?: string;
  team2Player1: string;
  team2Player2?: string;
  team2Club?: string;
  format: MatchFormat;
  status: 'scheduled' | 'on_court' | 'finished';
  location?: string;
  completedScore?: string;
  isPlaceholder?: boolean;
  /** Real (non-placeholder) players as published by Tournament Software; club is '' when not published */
  players?: { id: string; name: string; club: string }[];
}

export interface TournamentInfo {
  name: string;
  venueName?: string;
  location?: string;
  city?: string;
  country?: string;
  dates?: string;
  organization?: string;
  totalMatches: number;
  totalPlayers: number;
  totalClubs: number;
  totalCourts: number;
  totalHalls: number;
  hallNames: string[];
  clubNames: string[];
  days: { key: string; label: string; count: number }[];
  disciplines: string[];
  rounds: string[];
  placeholderMatches: number;
  finishedMatches: number;
  matchesWithoutTime: number;
  matchesWithoutCourt: number;
  playersWithoutClub: number;
  /** Data-quality remarks produced by the automatic verification */
  warnings: string[];
}

export interface PlayerPositions {
  // Players in the Left team:
  leftRightCourt: string; // standing in right service court (even)
  leftLeftCourt: string;  // standing in left service court (odd)
  // Players in the Right team:
  rightRightCourt: string; // standing in right service court (even)
  rightLeftCourt: string;  // standing in left service court (odd)
}

export interface TossResult {
  winner: 'teamA' | 'teamB';
  choice: 'serve' | 'receive' | 'side';
  leftTeam: {
    name: string;
    partner?: string;
  };
  rightTeam: {
    name: string;
    partner?: string;
  };
  initialServingSide: ServingSide;
  firstServerName: string;
  firstReceiverName: string;
}

export interface Match {
  id: string;
  externalId?: string;
  matchNumber: string;
  playerLeftName: string;
  playerRightName: string;
  playerLeftPartner?: string;
  playerRightPartner?: string;
  playerLeftClub?: string;
  playerRightClub?: string;
  scoreLeft: number;
  scoreRight: number;
  currentSet: number;
  setsLeft: number;
  setsRight: number;
  servingSide: ServingSide;
  status: MatchStatus;
  winner: ServingSide | null;
  format: MatchFormat;
  customConfig?: CustomFormatConfig;
  gameType: GameType;
  courtNumber: string;
  scheduledTime?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  // Current on-court positions
  leftRightCourt?: string;
  leftLeftCourt?: string;
  rightRightCourt?: string;
  rightLeftCourt?: string;
  currentServer?: string;
  currentReceiver?: string;
}

export interface PointLog {
  id?: number;
  matchId: string;
  timestamp: string;
  setNumber: number;
  scoreLeft: number;
  scoreRight: number;
  server: string;
  receiver: string;
  scoredBy: ServingSide;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id?: number;
  matchId: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface RallySnapshot {
  scoreLeft: number;
  scoreRight: number;
  servingSide: ServingSide;
  currentSet: number;
  setsLeft: number;
  setsRight: number;
  positions: PlayerPositions;
  serverName: string;
  receiverName: string;
  intervalTriggered: boolean;
  deciderSwitchDone: boolean;
  setScores: Array<{ left: number; right: number }>;
  scoredBy: ServingSide;
  timestamp: string;
}

export interface ScoreHistory {
  side: ServingSide;
  scoreLeft: number;
  scoreRight: number;
  servingSide: ServingSide;
  serverPosition: 'left' | 'right';
  snapshot?: RallySnapshot;
}

export interface DisciplinaryCard {
  id?: number;
  matchId: string;
  timestamp: string;
  cardColor: CardColor;
  side: ServingSide;
  playerName: string;
  reason: string;
  syncStatus: SyncStatus;
}

