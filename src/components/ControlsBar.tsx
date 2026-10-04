import { Undo, ArrowLeftRight, Square, Timer, ClipboardList, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ControlsBarProps {
  onUndo: () => void;
  onSwap: () => void;
  onCards: () => void;
  onInterval: () => void;
  onNewMatch: () => void;
  onSyncQueue: () => void;
  pendingCount: number;
  canUndo: boolean;
}

export function ControlsBar({
  onUndo,
  onSwap,
  onCards,
  onInterval,
  onNewMatch,
  onSyncQueue,
  pendingCount,
  canUndo,
}: ControlsBarProps) {
  const { t } = useI18n();

  const buttons = [
    {
      icon: Undo,
      label: t('undo'),
      onClick: onUndo,
      color: 'text-amber-400',
      bgColor: 'hover:border-amber-400/50 hover:bg-amber-500/10',
      disabled: !canUndo,
    },
    {
      icon: ArrowLeftRight,
      label: t('swapSides'),
      onClick: onSwap,
      color: 'text-sky-400',
      bgColor: 'hover:border-sky-400/50 hover:bg-sky-500/10',
    },
    {
      icon: Square,
      label: t('cardsBwf'),
      onClick: onCards,
      color: 'text-red-400',
      bgColor: 'hover:border-red-400/50 hover:bg-red-500/10',
    },
    {
      icon: Timer,
      label: t('interval60'),
      onClick: onInterval,
      color: 'text-emerald-400',
      bgColor: 'hover:border-emerald-400/50 hover:bg-emerald-500/10',
    },
    {
      icon: ClipboardList,
      label: t('syncQueue'),
      onClick: onSyncQueue,
      color: 'text-violet-400',
      bgColor: 'hover:border-violet-400/50 hover:bg-violet-500/10',
      badge: pendingCount,
    },
    {
      icon: PlusCircle,
      label: t('newMatch'),
      onClick: onNewMatch,
      color: 'text-zinc-300',
      bgColor: 'hover:border-zinc-500/50 hover:bg-zinc-800',
    },
  ];

  return (
    <div className="flex items-center justify-around gap-1 sm:gap-1.5 border-t border-zinc-800 bg-black px-1 sm:px-4 py-1.5 sm:py-2.5 md:gap-3 select-none">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-zinc-950/80 py-1.5 sm:py-2.5 px-0.5 sm:px-2 transition-all active:scale-95 shadow-sm min-w-0',
            btn.bgColor,
            btn.disabled && 'opacity-30 cursor-not-allowed hover:bg-zinc-950/80 hover:border-zinc-800/80'
          )}
        >
          <div className="relative">
            <btn.icon size={17} className={cn(btn.color, 'sm:w-5 sm:h-5')} />
            {btn.badge && btn.badge > 0 ? (
              <span className="absolute -right-2.5 -top-2 flex h-3.5 min-w-3.5 sm:h-4 sm:min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 sm:px-1 text-[8px] sm:text-[9px] font-black text-black shadow-md">
                {btn.badge}
              </span>
            ) : null}
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-zinc-300 text-center truncate max-w-full">
            {btn.label}
          </span>
        </button>
      ))}
    </div>
  );
}
