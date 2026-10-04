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

  const themeStyles =
    colorTheme === 'green'
      ? {
          active: 'border-emerald-500 bg-emerald-950/40 shadow-2xl shadow-emerald-950/60 ring-2 ring-emerald-500/40',
          button: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black',
          badge: 'bg-emerald-500 text-black font-black',
          border: 'border-emerald-900/60 bg-black/95',
          accentText: 'text-emerald-400',
        }
      : colorTheme === 'red'
      ? {
          active: 'border-red-500 bg-red-950/40 shadow-2xl shadow-red-950/60 ring-2 ring-red-500/40',
          button: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black',
          badge: 'bg-red-500 text-white font-black',
          border: 'border-red-900/60 bg-black/95',
          accentText: 'text-red-400',
        }
      : {
          active: 'border-sky-500/80 bg-sky-950/40 shadow-xl shadow-sky-950/50',
          button: 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-black',
          badge: 'bg-sky-500 text-black font-black',
          border: 'border-sky-900/50 bg-black/95',
          accentText: 'text-sky-400',
        };

  return (
    <div
      className={cn(
        'relative flex flex-1 flex-col justify-between rounded-2xl border-2 transition-all select-none',
        isPortrait ? 'p-2 sm:p-3.5 md:p-6' : 'p-3 sm:p-4 md:p-6',
        themeStyles.border,
        isServing && themeStyles.active
      )}
    >
      {/* Top Header: Team label & Status Badge */}
      <div className={cn("flex items-center justify-between gap-2 border-b border-zinc-800/80", isPortrait ? "pb-1.5" : "pb-3")}>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className={cn('text-xs font-black uppercase tracking-widest', themeStyles.accentText)}>
            {teamLabel}
          </span>
          {clubName && (
            <span className="text-[10px] sm:text-[11px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-amber-300 shadow-sm truncate max-w-[150px] sm:max-w-none">
              🏛️ {clubName}
            </span>
          )}
          <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
            ({side === 'left' ? t('leftSide') : t('rightSide')})
          </span>
        </div>

        {/* Serving / Receiving Badges */}
        <div className="flex items-center gap-1.5">
          {isServing && (
            <span
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider animate-pulse shadow-md',
                themeStyles.badge
              )}
            >
              <span className="text-xs sm:text-sm">🏸</span> {t('service')}
            </span>
          )}
          {isReceiving && (
            <span className="flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              🛡️ {t('receiving')}
            </span>
          )}
        </div>
      </div>

      {/* Players Court Positions Zone (BWF Court representation) */}
      <div className={cn("rounded-xl border border-zinc-800/80 bg-zinc-950/60", isPortrait ? "my-1 p-1.5 sm:p-2" : "my-2 p-2.5 sm:p-3")}>
        {gameType === 'singles' ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-zinc-100 md:text-2xl">{playerName}</span>
                {clubName && (
                  <span className="text-xs bg-zinc-900 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black tracking-wide">
                    {clubName}
                  </span>
                )}
                {isServing && (
                  <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded font-bold">
                    🏸 {t('service')}
                  </span>
                )}
                {isReceiving && (
                  <span className="text-xs bg-sky-400/20 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded font-bold">
                    🛡️ {t('receiving')}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {isServing ? `${t('service')}: ` : `${t('receiving')}: `}
                <strong className={cn(
                  'font-bold',
                  activeRallyCourt === 'left' ? 'text-amber-400' : 'text-sky-400'
                )}>
                  {activeRallyCourt === 'right' ? t('rightCourtLabel') : t('leftCourtLabel')}
                </strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 pb-1 border-b border-zinc-800/60">
              <span>{t('serviceCourt')} ({t('doubles')})</span>
              {onSwapTeamCourts && (
                <button
                  type="button"
                  onClick={onSwapTeamCourts}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors p-1"
                  title={t('swapPositions')}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{t('swapPositions')}</span>
                </button>
              )}
            </div>

            {/* Doubles grid: Right court (Even) and Left court (Odd) */}
            <div className="grid grid-cols-2 gap-2">
              {/* Right Court */}
              <div
                className={cn(
                  'rounded-lg border p-2 transition-all',
                  activeRallyCourt === 'right'
                    ? isServing
                      ? 'border-amber-400/80 bg-amber-400/15 shadow-sm'
                      : 'border-sky-400/80 bg-sky-400/15 shadow-sm'
                    : 'border-zinc-800/80 bg-zinc-900/80'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">
                    {t('rightCourtLabel')}
                  </span>
                  {rightCourtPlayer === activeServerName && isServing && (
                    <span className="text-[10px] font-bold text-amber-400">🏸 {t('service')}</span>
                  )}
                  {rightCourtPlayer === activeReceiverName && isReceiving && (
                    <span className="text-[10px] font-bold text-sky-400">🛡️ {t('receiving')}</span>
                  )}
                </div>
                <div className="font-bold text-sm sm:text-base text-zinc-100 truncate">
                  {rightCourtPlayer || playerName}
                </div>
              </div>

              {/* Left Court */}
              <div
                className={cn(
                  'rounded-lg border p-2 transition-all',
                  activeRallyCourt === 'left'
                    ? isServing
                      ? 'border-amber-400/80 bg-amber-400/15 shadow-sm'
                      : 'border-sky-400/80 bg-sky-400/15 shadow-sm'
                    : 'border-zinc-800/80 bg-zinc-900/80'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">
                    {t('leftCourtLabel')}
                  </span>
                  {leftCourtPlayer === activeServerName && isServing && (
                    <span className="text-[10px] font-bold text-amber-400">🏸 {t('service')}</span>
                  )}
                  {leftCourtPlayer === activeReceiverName && isReceiving && (
                    <span className="text-[10px] font-bold text-sky-400">🛡️ {t('receiving')}</span>
                  )}
                </div>
                <div className="font-bold text-sm sm:text-base text-zinc-100 truncate">
                  {leftCourtPlayer || partnerName || t('partnerPlaceholder')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Massive Score Display */}
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center cursor-pointer rounded-2xl bg-black/40 hover:bg-black/60 active:scale-[0.99] transition-all",
          isPortrait ? "my-1 p-1 sm:p-2 min-h-0" : "my-3 p-3"
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
      >
        <span
          className={cn(
            "tabular font-black leading-none text-zinc-50 tracking-tight drop-shadow-md",
            isPortrait ? "text-6xl sm:text-7xl md:text-9xl" : "text-7xl sm:text-8xl md:text-9xl"
          )}
        >
          {score}
        </span>
        <span className={cn("font-bold uppercase tracking-widest text-zinc-500", isPortrait ? "mt-0.5 text-[10px]" : "mt-2 text-xs")}>
          {t('points')}
        </span>
      </div>

      {/* Tap to Score Button */}
      <button
        type="button"
        onClick={onScore}
        className={cn(
          'flex w-full items-center justify-center rounded-xl font-black text-white transition-all shadow-lg active:scale-[0.98]',
          isPortrait ? 'py-2.5 sm:py-3.5 text-sm sm:text-base' : 'py-3.5 sm:py-4 text-base sm:text-lg',
          themeStyles.button
        )}
      >
        +1 {t('points')}
      </button>
    </div>
  );
}
