import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { ServingSide, GameType, CourtPosition } from '@/types';

interface ScoreCardProps {
  side: ServingSide;
  teamLabel: string;
  playerName: string;
  partnerName?: string;
  clubName?: string;
  score: number;
  isServing: boolean;
  isReceiving?: boolean;
  activeRallyCourt: CourtPosition;
  activeServerName?: string;
  activeReceiverName?: string;
  rightCourtPlayer?: string;
  leftCourtPlayer?: string;
  gameType: GameType;
  colorTheme: 'green' | 'red' | 'blue';
  isPortrait?: boolean;
  onScore: () => void;
  onSwapTeamCourts?: () => void;
}

export function ScoreCard({
  side,
  teamLabel,
  playerName,
  partnerName,
  clubName,
  score,
  isServing,
  isReceiving,
  activeRallyCourt,
  activeServerName,
  activeReceiverName,
  rightCourtPlayer,
  leftCourtPlayer,
  gameType,
  colorTheme,
  isPortrait = false,
  onScore,
  onSwapTeamCourts,
}: ScoreCardProps) {
  const { t } = useI18n();
  const touchActive = useRef(false);

  // Exact NV Brand Colors: Green (#6bc33a), Red (#e11e24)
  const themeStyles =
    colorTheme === 'green'
      ? {
          active: 'border-[#6bc33a] bg-[#6bc33a]/[0.08] shadow-2xl shadow-[#6bc33a]/25 ring-2 ring-[#6bc33a]/50',
          button: 'bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black shadow-lg shadow-[#6bc33a]/25',
          badge: 'bg-[#6bc33a] text-black font-black shadow-md shadow-[#6bc33a]/30',
          border: 'border-zinc-800 bg-zinc-950',
          accentText: 'text-[#6bc33a]',
          glowScore: 'text-white drop-shadow-[0_4px_16px_rgba(107,195,58,0.25)]',
        }
      : colorTheme === 'red'
      ? {
          active: 'border-[#e11e24] bg-[#e11e24]/[0.08] shadow-2xl shadow-[#e11e24]/25 ring-2 ring-[#e11e24]/50',
          button: 'bg-[#e11e24] hover:bg-[#cc191f] active:bg-[#a61318] text-white font-black shadow-lg shadow-[#e11e24]/25',
          badge: 'bg-[#e11e24] text-white font-black shadow-md shadow-[#e11e24]/30',
          border: 'border-zinc-800 bg-zinc-950',
          accentText: 'text-[#e11e24]',
          glowScore: 'text-white drop-shadow-[0_4px_16px_rgba(225,30,36,0.25)]',
        }
      : {
          active: 'border-sky-500 bg-sky-950/40 shadow-xl shadow-sky-950/50 ring-2 ring-sky-500/40',
          button: 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-black shadow-lg',
          badge: 'bg-sky-500 text-black font-black',
          border: 'border-zinc-800 bg-zinc-950',
          accentText: 'text-sky-400',
          glowScore: 'text-white',
        };

  return (
    <div
      className={cn(
        'relative flex flex-1 flex-col justify-between rounded-2xl border-2 transition-all select-none overflow-hidden',
        isPortrait ? 'p-2 sm:p-3 md:p-4' : 'p-3 sm:p-4 md:p-5',
        themeStyles.border,
        isServing && themeStyles.active
      )}
    >
      {/* Top Bulgarian Tricolor Accent Stripe on Serving Side */}
      {isServing && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-tricolor-horizontal" />
      )}

      {/* 1. Header: Team label & Status Badge */}
      <div className={cn("flex items-center justify-between gap-2 border-b border-zinc-800/80", isPortrait ? "pb-1.5" : "pb-2.5")}>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className={cn('text-xs font-black uppercase tracking-widest', themeStyles.accentText)}>
            {teamLabel}
          </span>
          {clubName && (
            <span className="text-[10px] sm:text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-amber-300 shadow-sm truncate max-w-[150px] sm:max-w-none">
              🏛️ {clubName}
            </span>
          )}
          <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
            ({side === 'left' ? t('leftSide') : t('rightSide')})
          </span>
        </div>

        {/* Serving / Receiving Badge (Single, prominent, un-duplicated) */}
        <div className="flex items-center gap-1.5">
          {isServing && (
            <span
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider animate-pulse shadow-md',
                themeStyles.badge
              )}
            >
              <span className="text-xs sm:text-sm">🏸</span> {t('service')}
            </span>
          )}
          {isReceiving && (
            <span className="flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              🛡️ {t('receiving')}
            </span>
          )}
        </div>
      </div>

      {/* 2. Player Information / Service Court Zone */}
      <div className={cn("rounded-xl border border-zinc-850 bg-zinc-900/60", isPortrait ? "my-1 p-1.5 sm:p-2" : "my-2 p-2 sm:p-2.5")}>
        {gameType === 'singles' ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg md:text-xl font-black text-white">{playerName}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {isServing ? `${t('service')}: ` : `${t('receiving')}: `}
                <strong className={cn(
                  'font-bold',
                  isServing ? themeStyles.accentText : 'text-sky-400'
                )}>
                  {activeRallyCourt === 'right' ? t('rightCourtLabel') : t('leftCourtLabel')}
                </strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-1 border-b border-zinc-800">
              <span>{t('serviceCourt')} ({t('doubles')})</span>
              {onSwapTeamCourts && (
                <button
                  type="button"
                  onClick={onSwapTeamCourts}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors p-0.5 cursor-pointer"
                  title={t('swapPositions')}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{t('swapPositions')}</span>
                </button>
              )}
            </div>

            {/* Doubles grid: Right court (Even) and Left court (Odd) */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Right Court */}
              <div
                className={cn(
                  'rounded-lg border p-1.5 transition-all',
                  activeRallyCourt === 'right'
                    ? isServing
                      ? 'border-[#6bc33a]/80 bg-[#6bc33a]/15 shadow-sm'
                      : 'border-sky-400/80 bg-sky-400/15 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/80'
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">
                    {t('rightCourtLabel')}
                  </span>
                  {rightCourtPlayer === activeServerName && isServing && (
                    <span className="text-[9px] font-bold text-[#6bc33a]">🏸 {t('service')}</span>
                  )}
                  {rightCourtPlayer === activeReceiverName && isReceiving && (
                    <span className="text-[9px] font-bold text-sky-400">🛡️ {t('receiving')}</span>
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                  {rightCourtPlayer || playerName}
                </div>
              </div>

              {/* Left Court */}
              <div
                className={cn(
                  'rounded-lg border p-1.5 transition-all',
                  activeRallyCourt === 'left'
                    ? isServing
                      ? 'border-[#6bc33a]/80 bg-[#6bc33a]/15 shadow-sm'
                      : 'border-sky-400/80 bg-sky-400/15 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/80'
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">
                    {t('leftCourtLabel')}
                  </span>
                  {leftCourtPlayer === activeServerName && isServing && (
                    <span className="text-[9px] font-bold text-[#6bc33a]">🏸 {t('service')}</span>
                  )}
                  {leftCourtPlayer === activeReceiverName && isReceiving && (
                    <span className="text-[9px] font-bold text-sky-400">🛡️ {t('receiving')}</span>
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                  {leftCourtPlayer || partnerName || t('partnerPlaceholder')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Massive High-Visibility Score Display (Click to add point) */}
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center cursor-pointer rounded-2xl bg-black/50 hover:bg-black/70 active:scale-[0.99] transition-all border border-zinc-850/60 my-1",
          isPortrait ? "p-2 min-h-0" : "p-3"
        )}
        onPointerDown={() => {
          touchActive.current = true;
        }}
        onPointerUp={(e) => {
          if (touchActive.current) {
            e.preventDefault();
            touchActive.current = false;
            onScore();
          }
        }}
        onPointerLeave={() => {
          touchActive.current = false;
        }}
        title="Натиснете за +1 точка"
      >
        <span
          className={cn(
            "tabular font-black leading-none tracking-tight select-none",
            themeStyles.glowScore,
            isPortrait
              ? "text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]"
              : "text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]"
          )}
        >
          {score}
        </span>
        <span className="font-black uppercase tracking-widest text-zinc-500 mt-1 text-[10px] sm:text-xs">
          {t('points')}
        </span>
      </div>

      {/* 4. Tap-to-Score Button (+1 ТОЧКА) */}
      <button
        type="button"
        onClick={onScore}
        className={cn(
          'flex w-full items-center justify-center rounded-xl font-black transition-all active:scale-[0.98] cursor-pointer mt-1',
          isPortrait ? 'py-2.5 sm:py-3 text-sm sm:text-base' : 'py-3 text-base',
          themeStyles.button
        )}
      >
        +1 {t('points')}
      </button>
    </div>
  );
}
