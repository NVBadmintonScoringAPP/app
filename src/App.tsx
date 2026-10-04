import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { ScoreCard } from '@/components/ScoreCard';
import { ControlsBar } from '@/components/ControlsBar';
import { RestOverlay } from '@/components/RestOverlay';
import { SetupModal, type SetupConfig } from '@/components/SetupModal';
import { TossModal } from '@/components/TossModal';
import { WinnerModal } from '@/components/WinnerModal';
import { CardsModal } from '@/components/CardsModal';
import { AdminModal } from '@/components/AdminModal';
import { SyncQueueModal } from '@/components/SyncQueueModal';
import { KioskLockScreen } from '@/components/KioskLockScreen';
import { WelcomeSplash } from '@/components/WelcomeSplash';
import { ConfirmNewMatchModal } from '@/components/ConfirmNewMatchModal';
import { getAudioService } from '@/lib/audio';
import { getSyncService } from '@/lib/sync';
import { getTournamentService } from '@/lib/tournamentService';
import { useI18n } from '@/lib/i18n';
import { deleteLastPointLog, getPointLogs } from '@/lib/db';
import { generatePdfScoresheet } from '@/lib/pdfScoresheet';
import { useWakeLock } from '@/lib/wakeLock';
import {
  getFormatConfig,
  checkSetWinner,
  isMatchOver,
  getServiceCourtByScore,
  getCurrentServerAndReceiver,
  calculateRallyOutcome,
  shouldSwitchSidesInDecider,
  shouldTriggerInterval,
  swapPositionsAcrossSides,
} from '@/lib/bwf';
import type {
  Match,
  MatchFormat,
  GameType,
  ServingSide,
  RallySnapshot,
  CardColor,
  PlayerPositions,
  TossResult,
  CustomFormatConfig,
} from '@/types';
import { cn } from '@/lib/utils';
import { generateUUID, toUUID } from '@/lib/uuid';

const DEFAULT_PIN = '1234';
const INTERVAL_DURATION = 60;
const SET_BREAK_DURATION = 120;

function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isPortrait;
}

export default function App() {
  const { t } = useI18n();
  const tournamentService = getTournamentService();
  const [tournamentName, setTournamentName] = useState(() => tournamentService.getTournamentName());
  const [tournamentInfo, setTournamentInfo] = useState(() => tournamentService.getTournamentInfo());
  const [assignedLocation, setAssignedLocation] = useState(
    () => tournamentService.getAssignedLocation() || ''
  );
  const [courtNumber, setCourtNumber] = useState(
    () => tournamentService.getAssignedCourt() || '1'
  );

  useEffect(() => {
    return tournamentService.subscribe(() => {
      setTournamentName(tournamentService.getTournamentName());
      setTournamentInfo(tournamentService.getTournamentInfo());
      setCourtNumber(tournamentService.getAssignedCourt());
      setAssignedLocation(tournamentService.getAssignedLocation());
    });
  }, [tournamentService]);
  const [scoreLeft, setScoreLeft] = useState(0);
  const [scoreRight, setScoreRight] = useState(0);
  const [servingSide, setServingSide] = useState<ServingSide>('left');
  const [currentSet, setCurrentSet] = useState(1);
  const [setsLeft, setSetsLeft] = useState(0);
  const [setsRight, setSetsRight] = useState(0);
  const [matchNumber, setMatchNumber] = useState('Match 1');
  const [playerLeft, setPlayerLeft] = useState('Player 1');
  const [playerRight, setPlayerRight] = useState('Player 2');
  const [playerLeftPartner, setPlayerLeftPartner] = useState('');
  const [playerRightPartner, setPlayerRightPartner] = useState('');
  const [playerLeftClub, setPlayerLeftClub] = useState('');
  const [playerRightClub, setPlayerRightClub] = useState('');
  const [format, setFormat] = useState<MatchFormat>('3x21');
  const [customConfig, setCustomConfig] = useState<CustomFormatConfig | undefined>();
  const [gameType, setGameType] = useState<GameType>('singles');

  // BWF Player positions on court (Right court = even, Left court = odd)
  const [positions, setPositions] = useState<PlayerPositions>({
    leftRightCourt: 'Player 1',
    leftLeftCourt: '',
    rightRightCourt: 'Player 2',
    rightLeftCourt: '',
  });

  const isPortrait = useIsPortrait();

  // Kiosk Lock state & Persistent Admin PIN
  const [isKioskLocked, setIsKioskLocked] = useState(false);
  const [adminPin, setAdminPin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('badminton_admin_pin') || DEFAULT_PIN;
    }
    return DEFAULT_PIN;
  });

  const handleUpdatePin = (newPin: string) => {
    setAdminPin(newPin);
    if (typeof window !== 'undefined') {
      localStorage.setItem('badminton_admin_pin', newPin);
    }
  };

  const handleResetPin = () => {
    setAdminPin(DEFAULT_PIN);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('badminton_admin_pin');
    }
  };

  // Screen WakeLock (Screen Always On for Kiosk Scoreboard)
  const { isActive: isWakeLockActive, toggleWakeLock } = useWakeLock(true);


  // Modals state
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupInitialMode, setSetupInitialMode] = useState<'tournament' | 'manual'>('manual');
  const [showToss, setShowToss] = useState(false);
  const [pendingSetup, setPendingSetup] = useState<SetupConfig | null>(null);

  const [showWinner, setShowWinner] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [restTitle, setRestTitle] = useState('Interval');
  const [restDuration, setRestDuration] = useState(INTERVAL_DURATION);
  const [showCards, setShowCards] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSyncQueue, setShowSyncQueue] = useState(false);
  const [showConfirmNewMatch, setShowConfirmNewMatch] = useState(false);

  // Kiosk guard: once the user has passed the welcome screen the app cannot be left
  // without the admin PIN (fullscreen, back-button trap, PIN lock when app is backgrounded).
  const kioskGuardActive = !showWelcome;
  useEffect(() => {
    if (!kioskGuardActive) return;

    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    enterFullscreen();
    window.addEventListener('pointerdown', enterFullscreen);

    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', onPopState);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    // If the app goes to background (user switched apps), require PIN on return
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setIsKioskLocked(true);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pointerdown', enterFullscreen);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [kioskGuardActive]);

  const [winner, setWinner] = useState<ServingSide | null>(null);
  const [matchOver, setMatchOver] = useState(false);
  const [history, setHistory] = useState<RallySnapshot[]>([]);
  const [setScores, setSetScores] = useState<Array<{ left: number; right: number }>>([]);
  const [matchId, setMatchId] = useState('');

  const [isMuted, setIsMuted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const audio = getAudioService();
  const sync = getSyncService();
  const config = getFormatConfig(format, customConfig);

  const intervalTriggeredRef = useRef(false);
  const deciderSwitchedRef = useRef(false);

  useEffect(() => {
    const unsub = sync.subscribe((online) => {
      setIsOnline(online);
    });
    return unsub;
  }, [sync]);

  // Current active server and receiver based on BWF rules
  const { serverName, receiverName } = getCurrentServerAndReceiver(
    servingSide,
    scoreLeft,
    scoreRight,
    positions,
    gameType
  );

  const persistMatch = useCallback(
    async (
      left: number,
      right: number,
      set: number,
      sLeft: number,
      sRight: number,
      serving: ServingSide,
      status: 'in_progress' | 'completed',
      matchWinner: ServingSide | null,
      currentPositions: PlayerPositions
    ) => {
      const now = new Date().toISOString();
      const id = matchId ? toUUID(matchId) : generateUUID();
      const match: Match = {
        id,
        matchNumber,
        playerLeftName: playerLeft,
        playerRightName: playerRight,
        playerLeftPartner,
        playerRightPartner,
        playerLeftClub,
        playerRightClub,
        scoreLeft: left,
        scoreRight: right,
        currentSet: set,
        setsLeft: sLeft,
        setsRight: sRight,
        servingSide: serving,
        status,
        winner: matchWinner,
        format,
        customConfig,
        gameType,
        courtNumber,
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
        leftRightCourt: currentPositions.leftRightCourt,
        leftLeftCourt: currentPositions.leftLeftCourt,
        rightRightCourt: currentPositions.rightRightCourt,
        rightLeftCourt: currentPositions.rightLeftCourt,
        currentServer: serverName,
        currentReceiver: receiverName,
      };
      if (matchId !== id) setMatchId(id);
      await sync.saveMatch(match);
    },
    [
      matchId,
      matchNumber,
      playerLeft,
      playerRight,
      playerLeftPartner,
      playerRightPartner,
      playerLeftClub,
      playerRightClub,
      format,
      customConfig,
      gameType,
      courtNumber,
      serverName,
      receiverName,
      sync,
    ]
  );

  const logPointEvent = useCallback(
    async (
      side: ServingSide,
      left: number,
      right: number,
      activeServer: string,
      activeReceiver: string
    ) => {
      const safeId = matchId ? toUUID(matchId) : generateUUID();
      if (!matchId || matchId !== safeId) setMatchId(safeId);
      await sync.logPoint({
        matchId: safeId,
        timestamp: new Date().toISOString(),
        setNumber: currentSet,
        scoreLeft: left,
        scoreRight: right,
        server: activeServer,
        receiver: activeReceiver,
        scoredBy: side,
        syncStatus: 'pending',
      });
    },
    [matchId, currentSet, sync]
  );

  // Add Point with exact BWF Rally Outcome calculation
  const handleAddPoint = useCallback(
    async (rallyWinner: ServingSide) => {
      audio.resumeOnUserAction();
      audio.playPointSound();

      // Snapshot before change for Undo
      const snapshot: RallySnapshot = {
        scoreLeft,
        scoreRight,
        servingSide,
        currentSet,
        setsLeft,
        setsRight,
        positions: { ...positions },
        serverName,
        receiverName,
        intervalTriggered: intervalTriggeredRef.current,
        deciderSwitchDone: deciderSwitchedRef.current,
        setScores: [...setScores],
        scoredBy: rallyWinner,
        timestamp: new Date().toISOString(),
      };

      // Calculate BWF rally outcome
      const outcome = calculateRallyOutcome(
        rallyWinner,
        servingSide,
        scoreLeft,
        scoreRight,
        positions,
        gameType
      );

      const newLeft = outcome.newScoreLeft;
      const newRight = outcome.newScoreRight;
      const newServing = outcome.newServingSide;
      const newPositions = outcome.newPositions;

      setScoreLeft(newLeft);
      setScoreRight(newRight);
      setServingSide(newServing);
      setPositions(newPositions);
      setHistory((prev) => [...prev, snapshot]);

      // Check for set winner
      const setWinnerSide = checkSetWinner(newLeft, newRight, config);

      if (setWinnerSide) {
        let newSetsLeft = setsLeft;
        let newSetsRight = setsRight;

        if (setWinnerSide === 'left') {
          newSetsLeft = setsLeft + 1;
          setSetsLeft(newSetsLeft);
        } else {
          newSetsRight = setsRight + 1;
          setSetsRight(newSetsRight);
        }

        const isMatchFinished = isMatchOver(newSetsLeft, newSetsRight, config);

        if (isMatchFinished) {
          setWinner(setWinnerSide);
          setMatchOver(true);
          setShowWinner(true);
          audio.playMatchEndChime();
        } else {
          setWinner(setWinnerSide);
          setShowWinner(true);
          audio.playSetWinSound();
        }

        await persistMatch(
          newLeft,
          newRight,
          currentSet,
          newSetsLeft,
          newSetsRight,
          newServing,
          isMatchFinished ? 'completed' : 'in_progress',
          isMatchFinished ? setWinnerSide : null,
          newPositions
        );
        await logPointEvent(rallyWinner, newLeft, newRight, serverName, receiverName);
      } else {
        // Check for deciding set side change at 11 pts (or 8 for 3x15)
        const triggerDeciderSwitch = shouldSwitchSidesInDecider(
          scoreLeft,
          scoreRight,
          newLeft,
          newRight,
          currentSet,
          config,
          deciderSwitchedRef.current
        );

        // Check for 60s interval at 11 pts (or 8 for 3x15)
        const triggerInterval = shouldTriggerInterval(
          scoreLeft,
          scoreRight,
          newLeft,
          newRight,
          config,
          intervalTriggeredRef.current
        );

        if (triggerDeciderSwitch) {
          deciderSwitchedRef.current = true;
          intervalTriggeredRef.current = true;
          doSwapSides();
          setRestTitle(`Почивка на ${config.sideSwitchAt}-та точка (60s) • Смяна на полетата`);
          setRestDuration(INTERVAL_DURATION);
          setShowRest(true);
        } else if (triggerInterval) {
          intervalTriggeredRef.current = true;
          setRestTitle(`Почивка на ${config.intervalAt}-та точка (60s)`);
          setRestDuration(INTERVAL_DURATION);
          setShowRest(true);
        }

        await persistMatch(
          newLeft,
          newRight,
          currentSet,
          setsLeft,
          setsRight,
          newServing,
          'in_progress',
          null,
          newPositions
        );
        await logPointEvent(rallyWinner, newLeft, newRight, serverName, receiverName);
      }
    },
    [
      scoreLeft,
      scoreRight,
      servingSide,
      currentSet,
      setsLeft,
      setsRight,
      positions,
      gameType,
      config,
      serverName,
      receiverName,
      setScores,
      audio,
      logPointEvent,
      persistMatch,
    ]
  );

  // Full Lossless Undo
  const handleUndo = async () => {
    if (history.length === 0) return;
    audio.resumeOnUserAction();

    const last = history[history.length - 1];
    setScoreLeft(last.scoreLeft);
    setScoreRight(last.scoreRight);
    setServingSide(last.servingSide);
    setCurrentSet(last.currentSet);
    setSetsLeft(last.setsLeft);
    setSetsRight(last.setsRight);
    setPositions(last.positions);
    setSetScores(last.setScores);
    intervalTriggeredRef.current = last.intervalTriggered;
    deciderSwitchedRef.current = last.deciderSwitchDone;

    setHistory(history.slice(0, -1));
    setShowWinner(false);
    setWinner(null);
    setMatchOver(false);

    if (matchId) {
      await sync.undoPoint(matchId);
      await deleteLastPointLog(matchId);
    }
  };

  // Court side swap on screen (e.g. after set or decider switch)
  const doSwapSides = () => {
    setPlayerLeft(playerRight);
    setPlayerRight(playerLeft);
    setPlayerLeftPartner(playerRightPartner);
    setPlayerRightPartner(playerLeftPartner);
    setPlayerLeftClub(playerRightClub);
    setPlayerRightClub(playerLeftClub);
    setScoreLeft(scoreRight);
    setScoreRight(scoreLeft);
    setSetsLeft(setsRight);
    setSetsRight(setsLeft);
    setServingSide(servingSide === 'left' ? 'right' : 'left');
    setPositions(swapPositionsAcrossSides(positions));
  };

  const handleManualSwapSides = () => {
    audio.resumeOnUserAction();
    doSwapSides();
  };

  // Manual swap of player courts within a specific team (corrections)
  const handleSwapTeamCourts = (side: ServingSide) => {
    audio.resumeOnUserAction();
    setPositions((prev) => {
      if (side === 'left') {
        return {
          ...prev,
          leftRightCourt: prev.leftLeftCourt,
          leftLeftCourt: prev.leftRightCourt,
        };
      } else {
        return {
          ...prev,
          rightRightCourt: prev.rightLeftCourt,
          rightLeftCourt: prev.rightRightCourt,
        };
      }
    });
  };

  // Next set transition (winner of previous set serves first as per BWF rules!)
  const handleStartNewSet = async () => {
    // 1. Record completed set score
    const finishedSet = { left: scoreLeft, right: scoreRight };
    setSetScores((prev) => [...prev, finishedSet]);

    // 2. Identify winner of previous set ('left' or 'right')
    const prevWinnerSide = winner;

    // 3. Swap players across court ends for next set (BWF Law 8.1.1, 8.1.2)
    const newPlayerLeft = playerRight;
    const newPlayerRight = playerLeft;
    const newPlayerLeftPartner = playerRightPartner;
    const newPlayerRightPartner = playerLeftPartner;
    const newPlayerLeftClub = playerRightClub;
    const newPlayerRightClub = playerLeftClub;
    const newSetsLeft = setsRight;
    const newSetsRight = setsLeft;

    setPlayerLeft(newPlayerLeft);
    setPlayerRight(newPlayerRight);
    setPlayerLeftPartner(newPlayerLeftPartner);
    setPlayerRightPartner(newPlayerRightPartner);
    setPlayerLeftClub(newPlayerLeftClub);
    setPlayerRightClub(newPlayerRightClub);
    setSetsLeft(newSetsLeft);
    setSetsRight(newSetsRight);

    // 4. CRITICAL: ZERO THE SCORES for the new set! (Зануляване на резултата)
    setScoreLeft(0);
    setScoreRight(0);

    // 5. Serving side for the new set:
    // BWF Law 7.4: The winning side of a game shall serve first in the next game.
    // If the winning team was on 'right', they have now moved to 'left'. So 'left' serves!
    // If the winning team was on 'left', they have now moved to 'right'. So 'right' serves!
    const nextServingSide: ServingSide = prevWinnerSide === 'right' ? 'left' : 'right';
    setServingSide(nextServingSide);

    // 6. Court positions for the new set
    const swappedPositions = swapPositionsAcrossSides(positions);
    setPositions(swappedPositions);

    // 7. Increment current set number
    const nextSet = currentSet + 1;
    setCurrentSet(nextSet);

    // 8. Reset set flags & undo history
    setWinner(null);
    setShowWinner(false);
    intervalTriggeredRef.current = false;
    deciderSwitchedRef.current = false;
    setHistory([]);

    // 9. Persist the new set to DB at 0 - 0
    await persistMatch(
      0, // left
      0, // right
      nextSet,
      newSetsLeft,
      newSetsRight,
      nextServingSide,
      'in_progress',
      null,
      swappedPositions
    );

    // 10. Start the official 120s BWF break between sets cleanly!
    setRestTitle(`Почивка между геймове (120s) - Гейм ${currentSet}`);
    setRestDuration(SET_BREAK_DURATION);
    setShowRest(true);
  };

  const handleResetMatch = () => {
    setScoreLeft(0);
    setScoreRight(0);
    setServingSide('left');
    setCurrentSet(1);
    setSetsLeft(0);
    setSetsRight(0);
    setHistory([]);
    setSetScores([]);
    setWinner(null);
    setMatchOver(false);
    setShowWinner(false);
    setMatchId('');
    intervalTriggeredRef.current = false;
    deciderSwitchedRef.current = false;
  };

  // Step 1: Finish Setup -> Open Toss
  const handleSetupStart = (cfg: SetupConfig) => {
    setPendingSetup(cfg);
    setShowSetup(false);
    setShowToss(true);
  };

  // Step 2: Confirm Toss -> Start Game
  const handleConfirmToss = async (tossResult: TossResult, initialPositions: PlayerPositions) => {
    if (!pendingSetup) return;

    setMatchNumber(pendingSetup.matchNumber);
    // Assign Left and Right player names based on the toss resolution!
    setPlayerLeft(tossResult.leftTeam.name);
    setPlayerLeftPartner(tossResult.leftTeam.partner || '');
    setPlayerRight(tossResult.rightTeam.name);
    setPlayerRightPartner(tossResult.rightTeam.partner || '');

    // Assign Left and Right club affiliations based on who was chosen to start on the left side!
    if (tossResult.leftTeam.name.includes(pendingSetup.playerLeft)) {
      setPlayerLeftClub(pendingSetup.playerLeftClub || '');
      setPlayerRightClub(pendingSetup.playerRightClub || '');
    } else {
      setPlayerLeftClub(pendingSetup.playerRightClub || '');
      setPlayerRightClub(pendingSetup.playerLeftClub || '');
    }

    setCourtNumber(pendingSetup.courtNumber);
    setFormat(pendingSetup.format);
    setCustomConfig(pendingSetup.customConfig);
    setGameType(pendingSetup.gameType);

    // Reset scoring & game state cleanly BEFORE setting toss selections
    setScoreLeft(0);
    setScoreRight(0);
    setCurrentSet(1);
    setSetsLeft(0);
    setSetsRight(0);
    setHistory([]);
    setSetScores([]);
    setWinner(null);
    setMatchOver(false);
    setShowWinner(false);
    intervalTriggeredRef.current = false;
    deciderSwitchedRef.current = false;

    // Initial serving side determined by toss
    setServingSide(tossResult.initialServingSide);
    setPositions(initialPositions);

    setShowToss(false);
    const chosenMatchId = pendingSetup.matchId ? toUUID(pendingSetup.matchId) : generateUUID();
    setMatchId(chosenMatchId);

    // Persist initial match to DB immediately to satisfy foreign key constraint on point_logs
    const initialMatch: Match = {
      id: chosenMatchId,
      matchNumber: pendingSetup.matchNumber,
      playerLeftName: tossResult.leftTeam.name,
      playerRightName: tossResult.rightTeam.name,
      playerLeftPartner: tossResult.leftTeam.partner || undefined,
      playerRightPartner: tossResult.rightTeam.partner || undefined,
      scoreLeft: 0,
      scoreRight: 0,
      currentSet: 1,
      setsLeft: 0,
      setsRight: 0,
      servingSide: tossResult.initialServingSide,
      status: 'in_progress',
      winner: null,
      format: pendingSetup.format,
      customConfig: pendingSetup.customConfig,
      gameType: pendingSetup.gameType,
      courtNumber: pendingSetup.courtNumber,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sync.saveMatch(initialMatch);
  };

  const handleToggleMute = () => {
    audio.resumeOnUserAction();
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const handleNewMatch = () => {
    setShowConfirmNewMatch(true);
  };

  const handleConfirmNewMatch = () => {
    setShowConfirmNewMatch(false);
    handleResetMatch();
    setShowWinner(false);
    setShowWelcome(true);
  };

  const handleForceNewMatch = () => {
    handleResetMatch();
    setShowWinner(false);
    setShowWelcome(false);
    setShowSetup(true);
  };

  const handleTournamentFinished = () => {
    handleResetMatch();
    setShowWinner(false);
    setShowSetup(false);
    setShowToss(false);
    setShowWelcome(true);
  };

  const handleConfirmMatchFinished = () => {
    const allSets = [...setScores, { left: scoreLeft, right: scoreRight }];
    const summaryScore = allSets.map((s) => `${s.left}:${s.right}`).join(', ');
    if (matchId) {
      tournamentService.markMatchCompleted(matchId, summaryScore);
    }
    handleResetMatch();
    setShowWinner(false);
    setShowWelcome(true);
  };

  const handleIssueCard = async (card: {
    cardColor: CardColor;
    side: ServingSide;
    playerName: string;
    reason: string;
  }) => {
    const safeId = matchId ? toUUID(matchId) : generateUUID();
    if (!matchId || matchId !== safeId) setMatchId(safeId);
    await sync.logCard({
      matchId: safeId,
      timestamp: new Date().toISOString(),
      cardColor: card.cardColor,
      side: card.side,
      playerName: card.playerName,
      reason: card.reason,
      syncStatus: 'pending',
    });
  };

  const handleDownloadScoresheet = async () => {
    const safeId = matchId ? toUUID(matchId) : generateUUID();
    const pointLogs = matchId ? await getPointLogs(safeId) : [];
    const currentMatch: Match = {
      id: safeId,
      matchNumber,
      playerLeftName: playerLeft,
      playerRightName: playerRight,
      playerLeftPartner,
      playerRightPartner,
      scoreLeft,
      scoreRight,
      currentSet,
      setsLeft,
      setsRight,
      servingSide,
      status: matchOver ? 'completed' : 'in_progress',
      winner,
      format,
      customConfig,
      gameType,
      courtNumber,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    generatePdfScoresheet(currentMatch, pointLogs, setScores);
  };



  const isDeuceActive =
    scoreLeft >= config.pointsToWin - 1 &&
    scoreRight >= config.pointsToWin - 1 &&
    Math.abs(scoreLeft - scoreRight) < 2;

  const winnerName = winner === 'left' ? playerLeft : playerRight;

  return (
    <div className="flex h-screen flex-col bg-black text-white select-none overflow-hidden">
      {/* -1. Welcome Splash Screen */}
      <WelcomeSplash
        open={showWelcome}
        tournamentName={tournamentName}
        tournamentInfo={tournamentInfo}
        assignedCourt={courtNumber}
        assignedLocation={assignedLocation}
        isManualMode={tournamentService.getIsManualMode()}
        isOnline={isOnline}
        onStartMatchSelection={() => {
          setSetupInitialMode('tournament');
          setShowWelcome(false);
          setShowSetup(true);
        }}
        onStartManualMatch={() => {
          setSetupInitialMode('manual');
          setShowWelcome(false);
          setShowSetup(true);
        }}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      {/* 0. Kiosk Screen Lock Mode */}
      {isKioskLocked && (
        <KioskLockScreen
          pin={adminPin}
          courtNumber={courtNumber}
          onUnlocked={() => setIsKioskLocked(false)}
        />
      )}

      {/* 1. Setup Dialog */}
      <SetupModal
        open={showSetup}
        initialMode={setupInitialMode}
        onClose={() => {
          setShowSetup(false);
          setShowWelcome(true);
        }}
        onStart={handleSetupStart}
      />

      {/* 2. Toss Dialog */}
      {pendingSetup && (
        <TossModal
          key={`${pendingSetup.matchId || pendingSetup.matchNumber}-${pendingSetup.gameType}-${pendingSetup.playerLeft}-${pendingSetup.playerRight}`}
          open={showToss}
          gameType={pendingSetup.gameType}
          teamAName={pendingSetup.playerLeft + (pendingSetup.playerLeftPartner ? ` & ${pendingSetup.playerLeftPartner}` : '')}
          teamBName={pendingSetup.playerRight + (pendingSetup.playerRightPartner ? ` & ${pendingSetup.playerRightPartner}` : '')}
          teamAClub={pendingSetup.playerLeftClub}
          teamBClub={pendingSetup.playerRightClub}
          playerLeft={pendingSetup.playerLeft}
          playerLeftPartner={pendingSetup.playerLeftPartner}
          playerRight={pendingSetup.playerRight}
          playerRightPartner={pendingSetup.playerRightPartner}
          onConfirmToss={handleConfirmToss}
          onCancel={() => {
            setShowToss(false);
            setShowSetup(true);
          }}
        />
      )}

      {/* 3. Set/Match Winner Modal with Referee Locked Verification */}
      <WinnerModal
        open={showWinner}
        winnerName={winnerName}
        playerLeft={playerLeft}
        playerRight={playerRight}
        playerLeftPartner={playerLeftPartner}
        playerRightPartner={playerRightPartner}
        playerLeftClub={playerLeftClub}
        playerRightClub={playerRightClub}
        eventCategory={matchNumber}
        courtNumber={courtNumber}
        scoreLeft={scoreLeft}
        scoreRight={scoreRight}
        setsLeft={setsLeft}
        setsRight={setsRight}
        isMatchOver={matchOver}
        setScores={setScores}
        adminPin={adminPin}
        onNextSet={handleStartNewSet}
        onConfirmMatchFinished={handleConfirmMatchFinished}
        onDownloadPdf={handleDownloadScoresheet}
      />

      {/* 4. Admin PIN Modal */}
      <AdminModal
        open={showAdmin}
        pin={adminPin}
        onClose={() => setShowAdmin(false)}
        onUpdatePin={handleUpdatePin}
        onResetPin={handleResetPin}
        onLockKiosk={() => {
          setShowAdmin(false);
          setIsKioskLocked(true);
        }}
        onForceNewMatch={() => {
          setShowAdmin(false);
          handleForceNewMatch();
        }}
        onTournamentFinished={() => {
          setShowAdmin(false);
          handleTournamentFinished();
        }}
        onDownloadPdf={handleDownloadScoresheet}
        wakeLockActive={isWakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        onCourtChanged={(court, loc) => {
          setCourtNumber(court);
          setAssignedLocation(loc);
        }}
      />

      {/* 5. Cards Modal */}
      <CardsModal
        open={showCards}
        onClose={() => setShowCards(false)}
        onIssue={handleIssueCard}
        playerLeft={playerLeft}
        playerRight={playerRight}
      />

      {/* 6. Sync Queue Modal */}
      <SyncQueueModal open={showSyncQueue} onClose={() => setShowSyncQueue(false)} matchId={matchId} />

      {/* 8. Rest / Interval Overlay */}
      <RestOverlay
        open={showRest}
        duration={restDuration}
        title={restTitle}
        courtNumber={courtNumber}
        onDismiss={() => setShowRest(false)}
      />

      {/* 9. Confirm New Match Modal (Protection against accidental reset) */}
      <ConfirmNewMatchModal
        open={showConfirmNewMatch}
        scoreLeft={scoreLeft}
        scoreRight={scoreRight}
        setsLeft={setsLeft}
        setsRight={setsRight}
        playerLeft={playerLeft}
        playerRight={playerRight}
        onConfirm={handleConfirmNewMatch}
        onCancel={() => setShowConfirmNewMatch(false)}
      />



      {/* Header */}
      <Header
        courtNumber={courtNumber}
        locationName={assignedLocation}
        matchNumber={matchNumber}
        currentSet={currentSet}
        setsLeft={setsLeft}
        setsRight={setsRight}
        format={format}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onAdminPress={() => setShowAdmin(true)}
      />

      {/* Deuce Notification Banner */}
      {isDeuceActive && (
        <div className="bg-red-950/80 border-y border-red-500/50 py-1.5 text-center shadow-lg">
          <span className="text-sm font-extrabold uppercase tracking-widest text-red-300 animate-pulse">
            {t('deuceBanner', { margin: config.deuceMargin, cap: config.capAt })}
          </span>
        </div>
      )}

      {/* Main Scoring Area */}
      {(() => {
        // BWF Rule: Both server and receiver stand in the court (Right for even, Left for odd)
        // determined strictly by the SERVING side's score!
        const serverScore = servingSide === 'left' ? scoreLeft : scoreRight;
        const activeRallyCourt = getServiceCourtByScore(serverScore);

        return (
          <div
            className={cn(
              'flex flex-1 gap-1.5 sm:gap-2 p-1.5 sm:p-2 md:gap-4 md:p-4 min-h-0 bg-black overflow-hidden',
              isPortrait ? 'flex-col' : 'flex-row'
            )}
          >
            {/* Team Left / Top ScoreCard */}
            <ScoreCard
              side="left"
              teamLabel={t('leftSide')}
              playerName={playerLeft}
              partnerName={gameType === 'doubles' ? playerLeftPartner : undefined}
              clubName={playerLeftClub}
              score={scoreLeft}
              isServing={servingSide === 'left'}
              isReceiving={servingSide === 'right'}
              activeRallyCourt={activeRallyCourt}
              activeServerName={servingSide === 'left' ? serverName : undefined}
              activeReceiverName={servingSide === 'right' ? receiverName : undefined}
              rightCourtPlayer={positions.leftRightCourt}
              leftCourtPlayer={positions.leftLeftCourt}
              gameType={gameType}
              colorTheme="green"
              isPortrait={isPortrait}
              onScore={() => handleAddPoint('left')}
              onSwapTeamCourts={gameType === 'doubles' ? () => handleSwapTeamCourts('left') : undefined}
            />

            {/* Center Net Divider with Bulgarian National Colors (Top White, Middle Green #6bc33a, Bottom Red #e11e24) */}
            {isPortrait ? (
              <div className="flex w-full items-center justify-center py-0.5 shrink-0" title="Мрежа (разделител)">
                <div className="w-full h-1 sm:h-1.5 rounded-full bg-gradient-to-r from-white via-[#6bc33a] to-[#e11e24] shadow-md shadow-emerald-500/30" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center relative px-1 shrink-0" title="Мрежа (разделител)">
                <div className="h-full w-1.5 rounded-full bg-gradient-to-b from-white via-[#6bc33a] to-[#e11e24] shadow-md shadow-emerald-500/30" />
              </div>
            )}

            {/* Team Right / Bottom ScoreCard */}
            <ScoreCard
              side="right"
              teamLabel={t('rightSide')}
              playerName={playerRight}
              partnerName={gameType === 'doubles' ? playerRightPartner : undefined}
              clubName={playerRightClub}
              score={scoreRight}
              isServing={servingSide === 'right'}
              isReceiving={servingSide === 'left'}
              activeRallyCourt={activeRallyCourt}
              activeServerName={servingSide === 'right' ? serverName : undefined}
              activeReceiverName={servingSide === 'left' ? receiverName : undefined}
              rightCourtPlayer={positions.rightRightCourt}
              leftCourtPlayer={positions.rightLeftCourt}
              gameType={gameType}
              colorTheme="red"
              isPortrait={isPortrait}
              onScore={() => handleAddPoint('right')}
              onSwapTeamCourts={gameType === 'doubles' ? () => handleSwapTeamCourts('right') : undefined}
            />
          </div>
        );
      })()}

      {/* Bottom Controls Bar */}
      <ControlsBar
        onUndo={handleUndo}
        onSwap={handleManualSwapSides}
        onNewMatch={handleNewMatch}
        canUndo={history.length > 0}
      />
    </div>
  );
}


