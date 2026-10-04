import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Coins, CheckCircle, RotateCcw, ArrowLeftRight, Play, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { GameType, PlayerPositions, TossResult } from '@/types';

interface TossModalProps {
  open: boolean;
  gameType: GameType;
  teamAName: string;
  teamBName: string;
  teamAClub?: string;
  teamBClub?: string;
  playerLeft: string;
  playerLeftPartner?: string;
  playerRight: string;
  playerRightPartner?: string;
  onConfirmToss: (result: TossResult, initialPositions: PlayerPositions) => void;
  onCancel: () => void;
}

export function TossModal({
  open,
  gameType,
  teamAName,
  teamBName,
  teamAClub,
  teamBClub,
  playerLeft,
  playerLeftPartner,
  playerRight,
  playerRightPartner,
  onConfirmToss,
  onCancel,
}: TossModalProps) {
  const { lang, isTranslationEnabled, setLanguage, t } = useI18n();

  // Step 1: Who won toss
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');

  // Step 2: Winner's 3 choices: 'serve' | 'receive' | 'side'
  const [winnerChoice, setWinnerChoice] = useState<'serve' | 'receive' | 'side'>('serve');

  // If winner chose 'side': which side did the winner pick? ('left' or 'right')
  const [winnerSidePick, setWinnerSidePick] = useState<'left' | 'right'>('left');

  // If winner chose 'side': loser picks 'serve' or 'receive'
  const [loserServePick, setLoserServePick] = useState<'serve' | 'receive'>('receive');

  // If winner chose 'serve' or 'receive': loser picks which side they want ('left' or 'right')
  const [loserSidePick, setLoserSidePick] = useState<'left' | 'right'>('right');

  // Doubles first server / receiver
  const [firstServerTeamA, setFirstServerTeamA] = useState(playerLeft);
  const [firstServerTeamB, setFirstServerTeamB] = useState(playerRight);
  const [firstReceiverTeamA, setFirstReceiverTeamA] = useState(playerLeft);
  const [firstReceiverTeamB, setFirstReceiverTeamB] = useState(playerRight);

  // Coin toss visual effect
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResultText, setCoinResultText] = useState<string | null>(null);

  const handleSimulateCoinToss = () => {
    setIsFlipping(true);
    setCoinResultText(null);
    setTimeout(() => {
      const winner: 'teamA' | 'teamB' = Math.random() < 0.5 ? 'teamA' : 'teamB';
      setTossWinner(winner);
      setCoinResultText(winner === 'teamA' ? teamAName : teamBName);
      setIsFlipping(false);
    }, 700);
  };

  const tossLoser = tossWinner === 'teamA' ? 'teamB' : 'teamA';
  const winnerDisplayName = tossWinner === 'teamA' ? teamAName : teamBName;
  const loserDisplayName = tossLoser === 'teamA' ? teamAName : teamBName;

  // Resolve final side allocation and serving side based on official BWF rules
  const resolution = useMemo(() => {
    let teamOnLeft: 'teamA' | 'teamB';
    let teamOnRight: 'teamA' | 'teamB';
    let servingTeam: 'teamA' | 'teamB';

    if (winnerChoice === 'side') {
      if (winnerSidePick === 'left') {
        teamOnLeft = tossWinner;
        teamOnRight = tossLoser;
      } else {
        teamOnRight = tossWinner;
        teamOnLeft = tossLoser;
      }
      if (loserServePick === 'serve') {
        servingTeam = tossLoser;
      } else {
        servingTeam = tossWinner;
      }
    } else {
      if (winnerChoice === 'serve') {
        servingTeam = tossWinner;
      } else {
        servingTeam = tossLoser;
      }
      if (loserSidePick === 'left') {
        teamOnLeft = tossLoser;
        teamOnRight = tossWinner;
      } else {
        teamOnRight = tossLoser;
        teamOnLeft = tossWinner;
      }
    }

    const initialServingSide: 'left' | 'right' = teamOnLeft === servingTeam ? 'left' : 'right';

    return {
      teamOnLeft,
      teamOnRight,
      servingTeam,
      initialServingSide,
    };
  }, [tossWinner, tossLoser, winnerChoice, winnerSidePick, loserServePick, loserSidePick]);

  const handleConfirm = () => {
    const leftTeamData =
      resolution.teamOnLeft === 'teamA'
        ? { name: playerLeft, partner: playerLeftPartner }
        : { name: playerRight, partner: playerRightPartner };

    const rightTeamData =
      resolution.teamOnRight === 'teamA'
        ? { name: playerLeft, partner: playerLeftPartner }
        : { name: playerRight, partner: playerRightPartner };

    let firstServerName = '';
    let firstReceiverName = '';

    const initialPositions: PlayerPositions = {
      leftRightCourt: '',
      leftLeftCourt: '',
      rightRightCourt: '',
      rightLeftCourt: '',
    };

    if (gameType === 'singles') {
      firstServerName = resolution.servingTeam === 'teamA' ? playerLeft : playerRight;
      firstReceiverName = resolution.servingTeam === 'teamA' ? playerRight : playerLeft;

      // In singles at 0-0, player is in right service court (0 is even)
      initialPositions.leftRightCourt = leftTeamData.name;
      initialPositions.leftLeftCourt = leftTeamData.name;
      initialPositions.rightRightCourt = rightTeamData.name;
      initialPositions.rightLeftCourt = rightTeamData.name;
    } else {
      // Doubles setup
      const isLeftTeamServing = resolution.initialServingSide === 'left';
      const servingTeamId = resolution.servingTeam;
      const receivingTeamId = servingTeamId === 'teamA' ? 'teamB' : 'teamA';

      firstServerName = servingTeamId === 'teamA' ? firstServerTeamA : firstServerTeamB;
      const servingPartner =
        servingTeamId === 'teamA'
          ? firstServerTeamA === playerLeft
            ? playerLeftPartner || ''
            : playerLeft
          : firstServerTeamB === playerRight
          ? playerRightPartner || ''
          : playerRight;

      firstReceiverName = receivingTeamId === 'teamA' ? firstReceiverTeamA : firstReceiverTeamB;
      const receivingPartner =
        receivingTeamId === 'teamA'
          ? firstReceiverTeamA === playerLeft
            ? playerLeftPartner || ''
            : playerLeft
          : firstReceiverTeamB === playerRight
          ? playerRightPartner || ''
          : playerRight;

      if (isLeftTeamServing) {
        initialPositions.leftRightCourt = firstServerName;
        initialPositions.leftLeftCourt = servingPartner;
        initialPositions.rightRightCourt = firstReceiverName;
        initialPositions.rightLeftCourt = receivingPartner;
      } else {
        initialPositions.rightRightCourt = firstServerName;
        initialPositions.rightLeftCourt = servingPartner;
        initialPositions.leftRightCourt = firstReceiverName;
        initialPositions.leftLeftCourt = receivingPartner;
      }
    }

    onConfirmToss(
      {
        winner: tossWinner,
        choice: winnerChoice,
        leftTeam: leftTeamData,
        rightTeam: rightTeamData,
        initialServingSide: resolution.initialServingSide,
        firstServerName,
        firstReceiverName,
      },
      initialPositions
    );
  };

  const choiceButtonClass = (active: boolean) =>
    cn(
      'rounded-xl border py-2.5 px-2 text-center text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center',
      active
        ? 'border-[#6bc33a] bg-[#6bc33a] text-black shadow-md shadow-[#6bc33a]/25'
        : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700'
    );

  const subChoiceClass = (active: boolean, color: 'green' | 'red') =>
    cn(
      'flex-1 py-2 rounded-lg border text-xs font-black transition-all cursor-pointer text-center',
      active
        ? color === 'green'
          ? 'border-[#6bc33a] bg-[#6bc33a] text-black shadow-md'
          : 'border-[#e11e24] bg-[#e11e24] text-white shadow-md'
        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Top tricolor stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-lg flex flex-col gap-3 select-none">
        {/* Top Header Row: Back button (Left), Status Badge (Center), Language Switcher (Right) */}
        <div className="w-full flex items-center justify-between z-20">
          <button
            type="button"
            onClick={onCancel}
            className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-zinc-700 text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title={lang === 'bg' ? 'Обратно към настройките' : 'Back to setup'}
          >
            <span>←</span>
            <span>{lang === 'bg' ? 'Назад' : 'Back'}</span>
          </button>

          <div className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg border border-[#6bc33a]/30 bg-[#6bc33a]/10 text-[#6bc33a] text-[10px] font-black shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6bc33a] animate-pulse" />
            <span>{lang === 'bg' ? 'Официален жребий' : 'Coin Toss'}</span>
          </div>

          {isTranslationEnabled ? (
            <button
              type="button"
              onClick={() => setLanguage(lang === 'bg' ? 'en' : 'bg')}
              className="h-7 w-7 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
              title={lang === 'bg' ? 'Switch interface to English' : 'Превключи интерфейса на Български'}
            >
              <Globe size={14} className="text-zinc-400 hover:text-[#6bc33a]" />
            </button>
          ) : (
            <div className="h-7 w-7" />
          )}
        </div>

        {/* Brand Card: IDENTICAL to WelcomeSplash & SetupModal */}
        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-2 sm:p-2.5 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
          {/* Bulgarian Tricolor Top Accent Stripe: White -> Green -> Red */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-tricolor-horizontal" />

          {/* Official NV Logo */}
          <div className="w-full flex items-center justify-center pt-0.5">
            <img
              src="/logo.png"
              alt="Национална Верига Бадминтон"
              className="w-full max-h-[64px] sm:max-h-[74px] object-contain drop-shadow-2xl"
            />
          </div>

          {/* Official Subtitle inside card */}
          <div className="w-full pt-1 mt-0.5 border-t border-zinc-800/80">
            <h2 className="text-[10px] sm:text-[11px] font-black text-[#6bc33a] uppercase tracking-widest text-center">
              {t('appSubtitle')}
            </h2>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full space-y-2 pt-0.5 text-left">
          {/* Coin Toss Simulator Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-2.5 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6bc33a]/15 text-[#6bc33a] border border-[#6bc33a]/30 shrink-0">
                <Coins className={cn('h-5 w-5', isFlipping && 'animate-spin')} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-white leading-tight">
                  {lang === 'bg' ? 'Жребий с монета' : 'Coin Toss'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold truncate">
                  {coinResultText
                    ? `${lang === 'bg' ? 'Печели:' : 'Winner:'} ${coinResultText}`
                    : (lang === 'bg' ? 'Хвърлете монета или посочете победител' : 'Flip coin or select winner')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateCoinToss}
              disabled={isFlipping}
              className="border-[#6bc33a]/40 bg-[#6bc33a]/10 hover:bg-[#6bc33a]/20 text-[#6bc33a] text-xs font-black h-8 shrink-0 cursor-pointer"
            >
              <RotateCcw className={cn('mr-1.5 h-3.5 w-3.5', isFlipping && 'animate-spin')} />
              <span>{isFlipping ? (lang === 'bg' ? 'Хвърля се...' : 'Flipping...') : (lang === 'bg' ? 'Хвърли монета' : 'Flip Coin')}</span>
            </Button>
          </div>

          {/* 1. Who won toss */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {lang === 'bg' ? '1. Победител от жребия' : '1. Toss Winner'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Team A Button */}
              <button
                type="button"
                onClick={() => setTossWinner('teamA')}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer relative overflow-hidden',
                  tossWinner === 'teamA'
                    ? 'border-[#6bc33a] bg-[#6bc33a]/15 text-white ring-2 ring-[#6bc33a]/40 shadow-lg'
                    : 'border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700'
                )}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#6bc33a]" />
                <span className="text-[10px] font-black uppercase text-[#6bc33a]">
                  {gameType === 'singles' ? (lang === 'bg' ? 'Състезател 1' : 'Player 1') : (lang === 'bg' ? 'Отбор А' : 'Team A')}
                </span>
                <span className="mt-0.5 text-xs font-black text-white truncate max-w-full">{teamAName}</span>
                {teamAClub && (
                  <span className="text-[9px] font-bold text-zinc-400 truncate max-w-full">{teamAClub}</span>
                )}
                {tossWinner === 'teamA' && <CheckCircle className="mt-1 h-3.5 w-3.5 text-[#6bc33a]" />}
              </button>

              {/* Team B Button */}
              <button
                type="button"
                onClick={() => setTossWinner('teamB')}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer relative overflow-hidden',
                  tossWinner === 'teamB'
                    ? 'border-[#e11e24] bg-[#e11e24]/15 text-white ring-2 ring-[#e11e24]/40 shadow-lg'
                    : 'border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700'
                )}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e11e24]" />
                <span className="text-[10px] font-black uppercase text-[#e11e24]">
                  {gameType === 'singles' ? (lang === 'bg' ? 'Състезател 2' : 'Player 2') : (lang === 'bg' ? 'Отбор Б' : 'Team B')}
                </span>
                <span className="mt-0.5 text-xs font-black text-white truncate max-w-full">{teamBName}</span>
                {teamBClub && (
                  <span className="text-[9px] font-bold text-zinc-400 truncate max-w-full">{teamBClub}</span>
                )}
                {tossWinner === 'teamB' && <CheckCircle className="mt-1 h-3.5 w-3.5 text-[#e11e24]" />}
              </button>
            </div>
          </div>

          {/* 2. Winner's Choice */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {lang === 'bg' ? `2. Избор на победителя (${winnerDisplayName})` : `2. Winner's Choice (${winnerDisplayName})`}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setWinnerChoice('serve')}
                className={choiceButtonClass(winnerChoice === 'serve')}
              >
                <span>🏸 {lang === 'bg' ? 'Сервис' : 'Serve'}</span>
                <span className="text-[9px] opacity-80 mt-0.5 font-bold">
                  {lang === 'bg' ? 'Първи сервира' : 'Serves first'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWinnerChoice('receive')}
                className={choiceButtonClass(winnerChoice === 'receive')}
              >
                <span>🛡️ {lang === 'bg' ? 'Посрещане' : 'Receive'}</span>
                <span className="text-[9px] opacity-80 mt-0.5 font-bold">
                  {lang === 'bg' ? 'Първи посреща' : 'Receives first'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWinnerChoice('side')}
                className={choiceButtonClass(winnerChoice === 'side')}
              >
                <span>📍 {lang === 'bg' ? 'Поле' : 'Side'}</span>
                <span className="text-[9px] opacity-80 mt-0.5 font-bold">
                  {lang === 'bg' ? 'Избор на страна' : 'Choice of ends'}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Loser's Remaining Choice */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-2.5 space-y-2 shadow-lg">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6bc33a]">
              {lang === 'bg' ? `3. Оставащ избор за ${loserDisplayName}` : `3. Remaining choice for ${loserDisplayName}`}
            </label>

            {winnerChoice === 'side' ? (
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1 font-bold">
                    {lang === 'bg' ? `Победителят (${winnerDisplayName}) заема:` : `Winner (${winnerDisplayName}) takes:`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWinnerSidePick('left')}
                      className={subChoiceClass(winnerSidePick === 'left', 'green')}
                    >
                      {lang === 'bg' ? 'Ляво поле' : 'Left Side'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWinnerSidePick('right')}
                      className={subChoiceClass(winnerSidePick === 'right', 'green')}
                    >
                      {lang === 'bg' ? 'Дясно поле' : 'Right Side'}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1 font-bold">
                    {lang === 'bg' ? `Вторият (${loserDisplayName}) избира:` : `${loserDisplayName} chooses:`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLoserServePick('serve')}
                      className={subChoiceClass(loserServePick === 'serve', 'green')}
                    >
                      🏸 {lang === 'bg' ? 'Да сервира' : 'To Serve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoserServePick('receive')}
                      className={subChoiceClass(loserServePick === 'receive', 'green')}
                    >
                      🛡️ {lang === 'bg' ? 'Да посреща' : 'To Receive'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1 font-bold">
                  {lang === 'bg' ? `${loserDisplayName} избира поле:` : `${loserDisplayName} chooses side:`}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoserSidePick('left')}
                    className={subChoiceClass(loserSidePick === 'left', 'green')}
                  >
                    {lang === 'bg' ? 'Ляво поле' : 'Left Side'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoserSidePick('right')}
                    className={subChoiceClass(loserSidePick === 'right', 'green')}
                  >
                    {lang === 'bg' ? 'Дясно поле' : 'Right Side'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Doubles Player Initial Service Positions */}
          {gameType === 'doubles' && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-2.5 space-y-2 shadow-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                {lang === 'bg' ? '4. Първи сервиращ и посрещащ (Двойки)' : '4. First server & receiver'}
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[#6bc33a] block mb-1">
                    {lang === 'bg' ? 'Първи сервиращ:' : 'First Server:'}
                  </span>
                  <div className="flex flex-col gap-1">
                    {(resolution.servingTeam === 'teamA'
                      ? [playerLeft, playerLeftPartner].filter(Boolean)
                      : [playerRight, playerRightPartner].filter(Boolean)
                    ).map((p) => {
                      const isSelected =
                        resolution.servingTeam === 'teamA'
                          ? firstServerTeamA === p
                          : firstServerTeamB === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            resolution.servingTeam === 'teamA'
                              ? setFirstServerTeamA(p!)
                              : setFirstServerTeamB(p!)
                          }
                          className={cn(
                            'rounded-lg border py-1.5 px-2 text-xs font-bold transition-all text-left truncate cursor-pointer',
                            isSelected
                              ? 'border-[#6bc33a] bg-[#6bc33a]/20 text-[#6bc33a]'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-sky-400 block mb-1">
                    {lang === 'bg' ? 'Първи посрещащ:' : 'First Receiver:'}
                  </span>
                  <div className="flex flex-col gap-1">
                    {(resolution.servingTeam === 'teamA'
                      ? [playerRight, playerRightPartner].filter(Boolean)
                      : [playerLeft, playerLeftPartner].filter(Boolean)
                    ).map((p) => {
                      const isSelected =
                        resolution.servingTeam === 'teamA'
                          ? firstReceiverTeamB === p
                          : firstReceiverTeamA === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            resolution.servingTeam === 'teamA'
                              ? setFirstReceiverTeamB(p!)
                              : setFirstReceiverTeamA(p!)
                          }
                          className={cn(
                            'rounded-lg border py-1.5 px-2 text-xs font-bold transition-all text-left truncate cursor-pointer',
                            isSelected
                              ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Allocation Summary Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-2.5 flex items-center justify-between text-xs relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-tricolor-horizontal" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-black text-[#6bc33a] text-[11px] shrink-0">
                {lang === 'bg' ? 'Ляво:' : 'Left:'}
              </span>
              <span className="font-bold text-white text-[11px] truncate">
                {resolution.teamOnLeft === 'teamA' ? teamAName : teamBName}
              </span>
              {resolution.initialServingSide === 'left' ? (
                <span className="bg-[#6bc33a]/20 text-[#6bc33a] border border-[#6bc33a]/40 px-1 py-0.5 rounded text-[9px] font-black shrink-0">
                  СЕРВИС
                </span>
              ) : (
                <span className="bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded text-[9px] font-bold shrink-0">
                  ПОСРЕЩАНЕ
                </span>
              )}
            </div>

            <ArrowLeftRight className="h-3.5 w-3.5 text-zinc-500 shrink-0 mx-1" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-black text-[#e11e24] text-[11px] shrink-0">
                {lang === 'bg' ? 'Дясно:' : 'Right:'}
              </span>
              <span className="font-bold text-white text-[11px] truncate">
                {resolution.teamOnRight === 'teamA' ? teamAName : teamBName}
              </span>
              {resolution.initialServingSide === 'right' ? (
                <span className="bg-[#6bc33a]/20 text-[#6bc33a] border border-[#6bc33a]/40 px-1 py-0.5 rounded text-[9px] font-black shrink-0">
                  СЕРВИС
                </span>
              ) : (
                <span className="bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded text-[9px] font-bold shrink-0">
                  ПОСРЕЩАНЕ
                </span>
              )}
            </div>
          </div>

          {/* Action Button: Confirm & Start Match */}
          <div className="pt-1">
            <Button
              size="lg"
              className="w-full h-10 sm:h-11 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black text-xs sm:text-sm shadow-lg shadow-[#6bc33a]/25 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              onClick={handleConfirm}
            >
              <Play size={15} className="fill-black stroke-black" />
              <span>{lang === 'bg' ? 'Потвърди жребия и започни мача →' : 'Confirm Toss & Start Match →'}</span>
            </Button>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Bottom tricolor stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />
    </div>,
    document.body
  );
}
