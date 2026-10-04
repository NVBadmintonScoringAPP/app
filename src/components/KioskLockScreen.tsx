import { useState } from 'react';
import { Lock, ShieldCheck, Delete, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface KioskLockScreenProps {
  pin: string;
  onUnlocked: () => void;
  courtNumber?: string;
}

export function KioskLockScreen({ pin, onUnlocked, courtNumber }: KioskLockScreenProps) {
  const { lang, t } = useI18n();
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 6) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setError('');

    // Auto verify when length matches PIN length
    if (next === pin) {
      setTimeout(() => {
        onUnlocked();
      }, 150);
    } else if (next.length >= pin.length) {
      setShake(true);
      setError(t('wrongPinError'));
      setTimeout(() => {
        setShake(false);
        setEnteredPin('');
      }, 500);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setError('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-4 text-zinc-100 select-none">
      {/* Background Court Lighting Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(107,195,58,0.08),transparent_70%)] pointer-events-none" />

      {/* Top Bar for Court info and Fullscreen toggle */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            {t('appTitle')} · {courtNumber ? t('courtNum', { court: courtNumber }) : t('brandScoringApp')}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>{t('fullscreenEnter')}</span>
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Official NV Badminton Logo */}
        <img
          src="/logo.png"
          alt="Национална Верига Бадминтон"
          className="h-10 sm:h-12 object-contain drop-shadow mb-1"
        />

        {/* Bulgarian Tricolor: Left-to-Right: White, Green (#6bc33a), Red (#e11e24) */}
        <div className="flex items-center justify-center gap-1.5 mb-3" title="Български трикольор: Бяло, Зелено, Червено">
          <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
          <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
          <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">
          {t('kioskLockedHeading')}
        </h1>
        <p className="text-xs text-zinc-400 mt-1 text-center">
          {t('headRefereePinPrompt')}
        </p>

        {/* PIN Digits Display */}
        <div className={cn('flex items-center justify-center gap-3 my-5', shake && 'animate-shake')}>
          {Array.from({ length: Math.max(4, pin.length) }).map((_, idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all duration-150',
                  isFilled
                    ? 'border-emerald-400 bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50'
                    : 'border-zinc-700 bg-zinc-900'
                )}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-bold text-red-400 mb-2 text-center animate-shake">
            {error}
          </p>
        )}

        {/* Numerical Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900/90 text-xl font-black text-white hover:border-emerald-500/50 hover:bg-zinc-800 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900/90 text-xl font-black text-white hover:border-emerald-500/50 hover:bg-zinc-800 active:scale-95 transition-all shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center"
            title="Изтрий последната цифра"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-6 text-center">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>{lang === 'bg' ? 'Защитено съдийско табло · Национална верига по бадминтон' : 'Secured Umpire Board · National Badminton Circuit'}</span>
        </div>
      </div>
    </div>
  );
}
