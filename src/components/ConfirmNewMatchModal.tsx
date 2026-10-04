import { createPortal } from 'react-dom';
import { AlertTriangle, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface ConfirmNewMatchModalProps {
  open: boolean;
  scoreLeft: number;
  scoreRight: number;
  setsLeft: number;
  setsRight: number;
  playerLeft: string;
  playerRight: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmNewMatchModal({
  open,
  scoreLeft,
  scoreRight,
  setsLeft,
  setsRight,
  playerLeft,
  playerRight,
  onConfirm,
  onCancel,
}: ConfirmNewMatchModalProps) {
  const { lang } = useI18n();

  if (!open) return null;

  const hasScore = scoreLeft > 0 || scoreRight > 0 || setsLeft > 0 || setsRight > 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 overflow-hidden">
        {/* Top Bulgarian Tricolor Stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-tricolor-horizontal" />

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-black text-white">
              {lang === 'bg' ? 'Започване на нов мач?' : 'Start New Match?'}
            </h3>
            <p className="text-xs text-zinc-400">
              {lang === 'bg'
                ? 'Защита от случайно прекратяване'
                : 'Confirmation required'}
            </p>
          </div>
        </div>

        {/* Message & Current Match Status */}
        <div className="rounded-xl border border-zinc-850 bg-zinc-900/60 p-3.5 flex flex-col gap-2">
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
            {lang === 'bg'
              ? 'Сигурни ли сте, че искате да прекратите текущата среща? Всички точки ще бъдат нулирани.'
              : 'Are you sure you want to end the current match? All current points and set scores will be reset.'}
          </p>

          {hasScore && (
            <div className="mt-1 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">
                {playerLeft} vs {playerRight}
              </span>
              <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                {setsLeft}:{setsRight} ({scoreLeft}:{scoreRight})
              </span>
            </div>
          )}
        </div>

        {/* Actions: Cancel vs Confirm */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
          >
            <X size={15} className="mr-1.5" />
            {lang === 'bg' ? 'Отказ (Продължи)' : 'Cancel (Keep Playing)'}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-11 bg-[#e11e24] hover:bg-[#cc191f] active:bg-[#a61318] text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-[#e11e24]/20 cursor-pointer"
          >
            <PlusCircle size={15} className="mr-1.5" />
            {lang === 'bg' ? 'Да, нов мач' : 'Yes, New Match'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
