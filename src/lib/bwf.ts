import type {
  MatchFormat,
  ServingSide,
  GameType,
  CourtPosition,
  PlayerPositions,
  CustomFormatConfig,
} from '@/types';

export interface FormatConfig {
  pointsToWin: number;
  capAt: number;
  deuceMargin: number;
  sideSwitchAt: number;
  intervalAt: number;
  bestOf: number;
}

export const FORMAT_CONFIGS: Record<MatchFormat, FormatConfig> = {
  '3x21': {
    pointsToWin: 21,
    capAt: 30,
    deuceMargin: 2,
    sideSwitchAt: 11,
    intervalAt: 11,
    bestOf: 3,
  },
  '3x15': {
    pointsToWin: 15,
    capAt: 21,
    deuceMargin: 2,
    sideSwitchAt: 8,
    intervalAt: 8,
    bestOf: 3,
  },
  custom: {
    pointsToWin: 21,
    capAt: 30,
    deuceMargin: 2,
    sideSwitchAt: 11,
    intervalAt: 11,
    bestOf: 3,
  },
};

export function getFormatConfig(format: MatchFormat, custom?: CustomFormatConfig): FormatConfig {
  if (format === 'custom' && custom) {
    return {
      pointsToWin: custom.pointsToWin,
      capAt: custom.capAt || custom.pointsToWin + 9,
      deuceMargin: custom.deuceMargin || 2,
      sideSwitchAt: custom.sideSwitchAt || Math.ceil(custom.pointsToWin / 2),
      intervalAt: custom.intervalAt || Math.ceil(custom.pointsToWin / 2),
      bestOf: custom.bestOf || 3,
    };
  }
  return FORMAT_CONFIGS[format];
}

/**
 * Checks if a set is won according to BWF rules.
 * - Winner must reach pointsToWin with at least deuceMargin (e.g. 21-19, 22-20)
 * - Or reach the hard cap (e.g. 30 in 21-point system, 21 in 15-point system)
 */
export function checkSetWinner(
  scoreLeft: number,
  scoreRight: number,
  config: FormatConfig
): ServingSide | null {
  if (scoreLeft >= config.capAt) return 'left';
  if (scoreRight >= config.capAt) return 'right';
  if (scoreLeft >= config.pointsToWin && scoreLeft - scoreRight >= config.deuceMargin) {
    return 'left';
  }
  if (scoreRight >= config.pointsToWin && scoreRight - scoreLeft >= config.deuceMargin) {
    return 'right';
  }
  return null;
}

/**
 * Returns true if the set is currently in deuce (e.g. 20-20 in 21-pt, 14-14 in 15-pt)
 */
export function isDeuce(scoreLeft: number, scoreRight: number, config: FormatConfig): boolean {
  const deuceThreshold = config.pointsToWin - 1;
  return (
    scoreLeft >= deuceThreshold &&
    scoreRight >= deuceThreshold &&
    scoreLeft === scoreRight &&
    scoreLeft < config.capAt
  );
}

/**
 * Checks if the match has been won (best of N)
 */
export function isMatchOver(setsLeft: number, setsRight: number, config: FormatConfig): boolean {
  const setsToWin = Math.ceil(config.bestOf / 2);
  return setsLeft >= setsToWin || setsRight >= setsToWin;
}

/**
 * In BWF, Even score -> Right service court, Odd score -> Left service court
 */
export function getServiceCourtByScore(score: number): CourtPosition {
  return score % 2 === 0 ? 'right' : 'left';
}

/**
 * Legacy helper for compatibility
 */
export function getServerPosition(score: number): 'left' | 'right' {
  return getServiceCourtByScore(score);
}

/**
 * Determines current active server and receiver based on court positions and serving side.
 */
export function getCurrentServerAndReceiver(
  servingSide: ServingSide,
  scoreLeft: number,
  scoreRight: number,
  positions: PlayerPositions,
  gameType: GameType
): { serverName: string; receiverName: string; serverCourt: CourtPosition; receiverCourt: CourtPosition } {
  if (servingSide === 'left') {
    const serverCourt = getServiceCourtByScore(scoreLeft);
    const receiverCourt = serverCourt; // Diagonal court: right serves to right, left serves to left
    const serverName =
      gameType === 'singles'
        ? positions.leftRightCourt || 'Team Left'
        : serverCourt === 'right'
        ? positions.leftRightCourt
        : positions.leftLeftCourt;

    const receiverName =
      gameType === 'singles'
        ? positions.rightRightCourt || 'Team Right'
        : receiverCourt === 'right'
        ? positions.rightRightCourt
        : positions.rightLeftCourt;

    return { serverName, receiverName, serverCourt, receiverCourt };
  } else {
    const serverCourt = getServiceCourtByScore(scoreRight);
    const receiverCourt = serverCourt;
    const serverName =
      gameType === 'singles'
        ? positions.rightRightCourt || 'Team Right'
        : serverCourt === 'right'
        ? positions.rightRightCourt
        : positions.rightLeftCourt;

    const receiverName =
      gameType === 'singles'
        ? positions.leftRightCourt || 'Team Left'
        : receiverCourt === 'right'
        ? positions.leftRightCourt
        : positions.leftLeftCourt;

    return { serverName, receiverName, serverCourt, receiverCourt };
  }
}

/**
 * BWF Official Law 10 & 11:
 * - When serving side wins rally:
 *     1. Serving side scores 1 point.
 *     2. Same server serves from alternate court.
 *     3. In doubles, ONLY the serving side players swap service courts. Receiving side does NOT swap.
 * - When receiving side wins rally:
 *     1. Receiving side scores 1 point and becomes new serving side.
 *     2. In doubles, NEITHER side swaps courts.
 *     3. New server is whoever is standing in the court matching their new score (even->right, odd->left).
 */
export function calculateRallyOutcome(
  rallyWinner: ServingSide,
  currentServingSide: ServingSide,
  scoreLeft: number,
  scoreRight: number,
  positions: PlayerPositions,
  gameType: GameType
): {
  newScoreLeft: number;
  newScoreRight: number;
  newServingSide: ServingSide;
  newPositions: PlayerPositions;
} {
  const newScoreLeft = rallyWinner === 'left' ? scoreLeft + 1 : scoreLeft;
  const newScoreRight = rallyWinner === 'right' ? scoreRight + 1 : scoreRight;

  const newPositions: PlayerPositions = { ...positions };

  if (rallyWinner === currentServingSide) {
    // Serving side won the rally!
    if (gameType === 'doubles') {
      if (currentServingSide === 'left') {
        // Left team swaps courts
        const temp = newPositions.leftRightCourt;
        newPositions.leftRightCourt = newPositions.leftLeftCourt;
        newPositions.leftLeftCourt = temp;
      } else {
        // Right team swaps courts
        const temp = newPositions.rightRightCourt;
        newPositions.rightRightCourt = newPositions.rightLeftCourt;
        newPositions.rightLeftCourt = temp;
      }
    }
    return {
      newScoreLeft,
      newScoreRight,
      newServingSide: currentServingSide,
      newPositions,
    };
  } else {
    // Receiving side won the rally!
    // No court swapping occurs for either team.
    return {
      newScoreLeft,
      newScoreRight,
      newServingSide: rallyWinner,
      newPositions,
    };
  }
}

/**
 * BWF Law 8.1.5:
 * In the deciding game (3rd set, or 1st set if best-of-1),
 * sides change when either side first scores 11 points (in 21-pt) or 8 points (in 15-pt).
 */
export function shouldSwitchSidesInDecider(
  prevScoreLeft: number,
  prevScoreRight: number,
  newScoreLeft: number,
  newScoreRight: number,
  currentSet: number,
  config: FormatConfig,
  alreadySwitchedThisSet: boolean
): boolean {
  if (alreadySwitchedThisSet) return false;
  const isDecider = config.bestOf === 1 ? currentSet === 1 : currentSet === config.bestOf;
  if (!isDecider) return false;

  const prevLeading = Math.max(prevScoreLeft, prevScoreRight);
  const newLeading = Math.max(newScoreLeft, newScoreRight);

  return prevLeading < config.sideSwitchAt && newLeading >= config.sideSwitchAt;
}

/**
 * BWF Law 16.2.1:
 * Interval of 60 seconds when leading score reaches 11 points (or 8 points in 15-pt) in ANY game.
 */
export function shouldTriggerInterval(
  prevScoreLeft: number,
  prevScoreRight: number,
  newScoreLeft: number,
  newScoreRight: number,
  config: FormatConfig,
  alreadyTriggeredThisSet: boolean
): boolean {
  if (alreadyTriggeredThisSet) return false;

  const prevLeading = Math.max(prevScoreLeft, prevScoreRight);
  const newLeading = Math.max(newScoreLeft, newScoreRight);

  return prevLeading < config.intervalAt && newLeading >= config.intervalAt;
}

/**
 * BWF between-sets side switch prompt
 */
export function shouldPromptSideSwitchBetweenSets(currentSet: number, config: FormatConfig): boolean {
  return currentSet < config.bestOf;
}

/**
 * Helper to invert player positions when sides of the court are swapped on screen.
 */
export function swapPositionsAcrossSides(positions: PlayerPositions): PlayerPositions {
  return {
    leftRightCourt: positions.rightRightCourt,
    leftLeftCourt: positions.rightLeftCourt,
    rightRightCourt: positions.leftRightCourt,
    rightLeftCourt: positions.leftLeftCourt,
  };
}

