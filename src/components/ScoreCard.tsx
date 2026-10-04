import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { ServingSide, GameType, CourtPosition } from '@/types';

interface ScoreCardProps {
  side: ServingSide;
  teamLabel?: string;
  playerName: string;
  partnerName?: string;
  clubName?: string;
  score: number;
  isServing: boolean;
  isReceiving?: boolean;
  activeRallyCourt?: CourtPosition;
  activeServerName?: string;
  activeReceiverName?: string;
  rightCourtPlayer?: string;
  leftCourtPlayer?: string;
  gameType?: GameType;
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
  colorTheme,
  isPortrait = false,
  onScore,
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
          active: 'border-amber-400 bg-amber-950/20 shadow-xl ring-2 ring-amber-400/40',
          button: 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-black shadow-lg',
          badge: 'bg-amber-400 text-black font-black',
          border: 'border-zinc-800 bg-zinc-950',
          accentText: 'text-amber-400',
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
            {teamLabel || (side === 'left' ? t('leftSide') : t('rightSide'))}
          </span>
          {clubName && (
            <span className="text-[10px] sm:text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-200 shadow-sm truncate max-w-[150px] sm:max-w-none">
              🏛️ {clubName}
            </span>
          )}
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

      {/* 2. Players Display */}
      <div className={cn("rounded-xl border border-zinc-850 bg-zinc-900/70 flex flex-col justify-center", isPortrait ? "my-1 px-3 py-2" : "my-2 px-3.5 py-2.5")}>
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-white truncate">
          {playerName}
          {partnerName && (
            <span className="text-zinc-300 font-bold"> / {partnerName}</span>
          )}
        </div>
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
