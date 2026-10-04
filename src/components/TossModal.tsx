import { useState, useMemo } from 'react';
import { Coins, CheckCircle, ArrowRight, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
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
  const { lang, t } = useI18n();
  // Step 1: Who won toss
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');

  // Step 2: Winner's 3 choices (BWF Law 4.1): 'serve' | 'receive' | 'side'
  const [winnerChoice, setWinnerChoice] = useState<'serve' | 'receive' | 'side'>('serve');

  // If winner chose 'side': which side did the winner pick? ('left' or 'right')
  const [winnerSidePick, setWinnerSidePick] = useState<'left' | 'right'>('left');

  // If winner chose 'side': loser picks 'serve' or 'receive' (BWF Law 4.2)
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

  // Resolve final side allocation and serving side based on BWF Law 4
  const resolution = useMemo(() => {
    let teamOnLeft: 'teamA' | 'teamB';
    let teamOnRight: 'teamA' | 'teamB';
    let servingTeam: 'teamA' | 'teamB';

    if (winnerChoice === 'side') {
      // Winner chose side
      if (winnerSidePick === 'left') {
        teamOnLeft = tossWinner;
        teamOnRight = tossLoser;
      } else {
        teamOnRight = tossWinner;
        teamOnLeft = tossLoser;
      }
      // Loser chose serve or receive
      if (loserServePick === 'serve') {
        servingTeam = tossLoser;
      } else {
        servingTeam = tossWinner;
      }
    } else {
      // Winner chose serve or receive
      if (winnerChoice === 'serve') {
        servingTeam = tossWinner;
      } else {
        servingTeam = tossLoser;
      }
      // Loser chose side
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
      firstServerName =
        resolution.servingTeam === 'teamA' ? playerLeft : playerRight;
      firstReceiverName =
        resolution.servingTeam === 'teamA' ? playerRight : playerLeft;

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

      // First server name
      firstServerName =
        servingTeamId === 'teamA' ? firstServerTeamA : firstServerTeamB;
      const servingPartner =
        servingTeamId === 'teamA'
          ? firstServerTeamA === playerLeft
            ? playerLeftPartner || ''
            : playerLeft
          : firstServerTeamB === playerRight
          ? playerRightPartner || ''
          : playerRight;

      // First receiver name
      firstReceiverName =
        receivingTeamId === 'teamA' ? firstReceiverTeamA : firstReceiverTeamB;
      const receivingPartner =
        receivingTeamId === 'teamA'
          ? firstReceiverTeamA === playerLeft
            ? playerLeftPartner || ''
            : playerLeft
          : firstReceiverTeamB === playerRight
          ? playerRightPartner || ''
          : playerRight;

      if (isLeftTeamServing) {
        // Left team serves from Right Court at 0-0
        initialPositions.leftRightCourt = firstServerName;
        initialPositions.leftLeftCourt = servingPartner;
        // Right team receives in Right Court at 0-0 (diagonal)
        initialPositions.rightRightCourt = firstReceiverName;
        initialPositions.rightLeftCourt = receivingPartner;
      } else {
        // Right team serves from Right Court at 0-0
        initialPositions.rightRightCourt = firstServerName;
        initialPositions.rightLeftCourt = servingPartner;
        // Left team receives in Right Court at 0-0 (diagonal)
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

  return (
    <Dialog open={open} onClose={onCancel} title="" className="max-w-2xl max-h-[92vh] overflow-y-auto bg-black/95 border-zinc-800">
      <div className="space-y-4 text-zinc-100 select-none">
        {/* Brand Banner with Official Logo */}
        <div className="flex flex-col items-center justify-center -mt-1 pb-3 border-b border-zinc-800">
          <img
            src="/logo.png"
            alt="Национална Верига Бадминтон"
            className="h-10 sm:h-12 object-contain drop-shadow"
          />
          {/* Bulgarian Tricolor: Left-to-Right: White, Green (#6bc33a), Red (#e11e24) */}
          <div className="flex items-center justify-center gap-1.5 my-1" title="Български трикольор: Бяло, Зелено, Червено">
            <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300 mt-0.5">
            {t('tossTitle')}
          </span>
        </div>

        {/* Coin Toss Simulator Header */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className={cn('h-6 w-6', isFlipping && 'animate-spin')} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{t('flipCoinBtn')}</h3>
              <p className="text-xs text-zinc-400">
                {coinResultText
                  ? `${t('tossWinnerLabel')} ${coinResultText}`
                  : (lang === 'bg' ? 'Хвърлете виртуална монета или изберете победител ръчно' : 'Flip virtual coin or pick winner manually')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateCoinToss}
            disabled={isFlipping}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isFlipping ? t('flippingCoin') : t('flipCoinBtn')}
          </Button>
        </div>

        {/* Step 1: Who won toss */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Кой отбор/играч печели жребия?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTossWinner('teamA')}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all',
                tossWinner === 'teamA'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-md ring-2 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              )}
            >
              <span className="text-[10px] font-black uppercase text-emerald-400">
                {gameType === 'singles' ? 'Играч 1' : 'Отбор 1'}
              </span>
              <span className="mt-1 text-sm font-bold text-slate-100">{teamAName}</span>
              {teamAClub && (
                <span className="mt-0.5 text-[10px] font-semibold text-emerald-400/90 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                  🏛️ {teamAClub}
                </span>
              )}
              {tossWinner === 'teamA' && <CheckCircle className="mt-1.5 h-4 w-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setTossWinner('teamB')}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all',
                tossWinner === 'teamB'
                  ? 'border-red-500 bg-red-950/40 text-red-200 shadow-md ring-2 ring-red-500/30'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              )}
            >
              <span className="text-[10px] font-black uppercase text-red-400">
                {gameType === 'singles' ? 'Играч 2' : 'Отбор 2'}
              </span>
              <span className="mt-1 text-sm font-bold text-slate-100">{teamBName}</span>
              {teamBClub && (
                <span className="mt-0.5 text-[10px] font-semibold text-red-400/90 bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded">
                  🏛️ {teamBClub}
                </span>
              )}
              {tossWinner === 'teamB' && <CheckCircle className="mt-1.5 h-4 w-4 text-red-400" />}
            </button>
          </div>
        </div>

        {/* Step 2: Winner's 3 choices (BWF Law 4.1) */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Избор на победителя ({winnerDisplayName}):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setWinnerChoice('serve')}
              className={cn(
                'rounded-xl border py-3 px-2 text-center text-xs font-bold transition-all',
                winnerChoice === 'serve'
                  ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-md'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              )}
            >
              🏸 Сервис
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">Първи сервира</span>
            </button>

            <button
              type="button"
              onClick={() => setWinnerChoice('receive')}
              className={cn(
                'rounded-xl border py-3 px-2 text-center text-xs font-bold transition-all',
                winnerChoice === 'receive'
                  ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-md'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              )}
            >
              🛡️ Посрещане
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">Първи посреща</span>
            </button>

            <button
              type="button"
              onClick={() => setWinnerChoice('side')}
              className={cn(
                'rounded-xl border py-3 px-2 text-center text-xs font-bold transition-all',
                winnerChoice === 'side'
                  ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-md'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              )}
            >
              📍 Избор на поле
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">Страна на корта</span>
            </button>
          </div>
        </div>

        {/* Step 3: Loser's remaining choice (BWF Law 4.2) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
            3. Оставащ избор на втория отбор ({loserDisplayName}):
          </label>

          {winnerChoice === 'side' ? (
            <div className="space-y-3">
              {/* Winner chose side: what side does winner take? */}
              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Победителят ({winnerDisplayName}) избира да заеме:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWinnerSidePick('left')}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-bold transition-all',
                      winnerSidePick === 'left'
                        ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    )}
                  >
                    Ляво поле (Left side)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinnerSidePick('right')}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-bold transition-all',
                      winnerSidePick === 'right'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    )}
                  >
                    Дясно поле (Right side)
                  </button>
                </div>
              </div>

              {/* Loser chooses serve or receive */}
              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Загубилият ({loserDisplayName}) избира от останалите опции:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoserServePick('serve')}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-bold transition-all',
                      loserServePick === 'serve'
                        ? 'border-amber-400 bg-amber-400 text-slate-950 font-black'
                        : 'border-slate-800 bg-slate-900 text-slate-300'
                    )}
                  >
                    🏸 Да сервира (Аз сервирам)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoserServePick('receive')}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-bold transition-all',
                      loserServePick === 'receive'
                        ? 'border-amber-400 bg-amber-400 text-slate-950 font-black'
                        : 'border-slate-800 bg-slate-900 text-slate-300'
                    )}
                  >
                    🛡️ Да посреща (Победителят сервира)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-xs text-slate-400 block mb-1">
                Тъй като победителят избра {winnerChoice === 'serve' ? 'Сервис' : 'Посрещане'},{' '}
                <strong>{loserDisplayName}</strong> избира коя страна на корта да заеме:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLoserSidePick('left')}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-xs font-bold transition-all',
                    loserSidePick === 'left'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  )}
                >
                  Ляво поле (Left side)
                </button>
                <button
                  type="button"
                  onClick={() => setLoserSidePick('right')}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-xs font-bold transition-all',
                    loserSidePick === 'right'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  )}
                >
                  Дясно поле (Right side)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Doubles player assignments */}
        {gameType === 'doubles' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              4. Начални позиции на състезателите (Двойки BWF):
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Serving team first server */}
              <div>
                <span className="text-[11px] font-bold text-amber-400 block mb-1">
                  Първи сервиращ ({resolution.servingTeam === 'teamA' ? teamAName : teamBName}):
                </span>
                <div className="flex flex-col gap-1.5">
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
                          'rounded-lg border py-1.5 px-2 text-xs font-bold transition-all text-left truncate',
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        )}
                      >
                        {p} (Десен корт при 0:0)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receiving team first receiver */}
              <div>
                <span className="text-[11px] font-bold text-sky-400 block mb-1">
                  Първи посрещащ ({resolution.servingTeam === 'teamA' ? teamBName : teamAName}):
                </span>
                <div className="flex flex-col gap-1.5">
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
                          'rounded-lg border py-1.5 px-2 text-xs font-bold transition-all text-left truncate',
                          isSelected
                            ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        )}
                      >
                        {p} (Десен корт при 0:0)
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Allocation Summary Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-400">Ляво поле:</span>
            <span className="font-semibold text-slate-100">
              {resolution.teamOnLeft === 'teamA' ? teamAName : teamBName}
            </span>
            {resolution.initialServingSide === 'left' ? (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px] font-black">
                🏸 СЕРВИС
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                ПОСРЕЩАНЕ
              </span>
            )}
          </div>

          <ArrowLeftRight className="h-4 w-4 text-slate-500" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">Дясно поле:</span>
            <span className="font-semibold text-slate-100">
              {resolution.teamOnRight === 'teamA' ? teamAName : teamBName}
            </span>
            {resolution.initialServingSide === 'right' ? (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px] font-black">
                🏸 СЕРВИС
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                ПОСРЕЩАНЕ
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="lg" className="flex-1" onClick={onCancel}>
            Отказ
          </Button>
          <Button
            variant="accent"
            size="lg"
            className="flex-1 text-slate-950 font-black"
            onClick={handleConfirm}
          >
            Потвърди и започни мача
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
