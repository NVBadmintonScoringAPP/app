import { Undo, ArrowLeftRight, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ControlsBarProps {
  onUndo: () => void;
  onSwap: () => void;
  onNewMatch: () => void;
  canUndo: boolean;
}

export function ControlsBar({
  onUndo,
  onSwap,
  onNewMatch,
  canUndo,
}: ControlsBarProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 border-t border-zinc-800 bg-black px-3 sm:px-6 py-2 sm:py-3 select-none">
      {/* 1. Undo Point Button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border py-2.5 sm:py-3.5 px-3 transition-all active:scale-[0.98] shadow-md cursor-pointer',
          canUndo
            ? 'border-amber-500/40 bg-zinc-900/90 text-amber-300 hover:border-amber-400 hover:bg-amber-500/10'
            : 'border-zinc-850 bg-zinc-950/60 text-zinc-600 opacity-40 cursor-not-allowed'
        )}
      >
        <Undo size={19} className={canUndo ? 'text-amber-400' : 'text-zinc-600'} />
        <span className="text-xs sm:text-sm font-black tracking-wide">
          {t('undo')}
        </span>
      </button>

      {/* 2. Swap Sides Button */}
      <button
        type="button"
        onClick={onSwap}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-sky-500/40 bg-zinc-900/90 py-2.5 sm:py-3.5 px-3 text-sky-300 hover:border-sky-400 hover:bg-sky-500/10 transition-all active:scale-[0.98] shadow-md cursor-pointer"
      >
        <ArrowLeftRight size={19} className="text-sky-400" />
        <span className="text-xs sm:text-sm font-black tracking-wide">
          {t('swapSides')}
        </span>
      </button>

      {/* 3. New Match Button */}
      <button
        type="button"
        onClick={onNewMatch}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#6bc33a]/40 bg-zinc-900/90 py-2.5 sm:py-3.5 px-3 text-[#6bc33a] hover:border-[#6bc33a] hover:bg-[#6bc33a]/10 transition-all active:scale-[0.98] shadow-md cursor-pointer"
      >
        <PlusCircle size={19} className="text-[#6bc33a]" />
        <span className="text-xs sm:text-sm font-black tracking-wide">
          {t('newMatch')}
        </span>
      </button>
    </div>
  );
}
