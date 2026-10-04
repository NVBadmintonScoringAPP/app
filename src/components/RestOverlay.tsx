import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, FastForward, Bell, Volume2, VolumeX, Timer, X } from 'lucide-react';
import { getAudioService } from '@/lib/audio';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RestOverlayProps {
  open: boolean;
  duration: number;
  title: string;
  courtNumber?: string;
  onDismiss: () => void;
}

export function RestOverlay({ open, duration, title, courtNumber, onDismiss }: RestOverlayProps) {
  const { lang, t } = useI18n();
  const [remaining, setRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedWarning = useRef(false);
  const firedEnd = useRef(false);

  const audio = getAudioService();

  useEffect(() => {
    if (!open) {
      setRemaining(duration);
      setIsPaused(false);
      firedWarning.current = false;
      firedEnd.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setRemaining(duration);
    setIsPaused(false);
    firedWarning.current = false;
    firedEnd.current = false;

    // Start interval countdown
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;

        // 10 seconds remaining warning (50th second of a 60s break or 110th second of 120s break)
        if (next === 10 && !firedWarning.current) {
          firedWarning.current = true;
          audio.play50SecondAlert();
        }

        // Interval end sound
        if (next <= 0 && !firedEnd.current) {
          firedEnd.current = true;
          if (duration >= 120) {
            audio.play120SecondSiren();
          } else {
            audio.play60SecondSiren();
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, duration]);

  // Handle pause / resume
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          if (next === 10 && !firedWarning.current) {
            firedWarning.current = true;
            audio.play50SecondAlert();
          }
          if (next <= 0 && !firedEnd.current) {
            firedEnd.current = true;
            audio.play60SecondSiren();
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const handleAdjustTime = (delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta));
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  if (!open) return null;

  const minutes = Math.floor(Math.max(0, remaining) / 60);
  const seconds = Math.max(0, remaining) % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isWarning = remaining <= 10 && remaining > 0;
  const isFinished = remaining === 0;

  // Percentage for progress ring
  const progressPercent = Math.min(100, Math.max(0, ((duration - remaining) / duration) * 100));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none animate-fade-in">
      {/* Top Bulgarian Tricolor Stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />

      {/* Main Screen Content - Perfectly Centered, Full Screen, Pure Black Background */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center px-4 py-3 sm:py-6">
        <div className="w-full max-w-lg flex flex-col items-center text-center space-y-3">
          
          {/* Brand Card: IDENTICAL to WelcomeSplash & SetupModal */}
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-2 sm:p-2.5 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
            {/* Bulgarian Tricolor Top Accent Stripe: White -> Green -> Red */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-tricolor-horizontal" />

            <div className="w-full flex items-center justify-between">
              <div className="w-8" />
              <img
                src="/logo.png"
                alt="Национална Верига Бадминтон"
                className="max-h-[44px] sm:max-h-[58px] landscape:max-h-[38px] object-contain drop-shadow-md"
              />
              <div className="flex items-center gap-1.5">
                {courtNumber && (
                  <div className="flex items-center gap-1 rounded-lg border border-[#6bc33a]/40 bg-[#6bc33a]/10 px-2 py-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#6bc33a]">{t('courtUpper')}</span>
                    <span className="text-xs font-black text-white">{courtNumber}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onDismiss}
                  className="h-7 w-7 rounded-lg border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={lang === 'bg' ? 'Затвори' : 'Close'}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="w-full pt-1.5 mt-1 border-t border-zinc-800/80 flex items-center justify-center gap-1.5">
              <Timer size={12} className="text-[#6bc33a]" />
              <h2 className="text-[10px] sm:text-[11px] font-black text-[#6bc33a] uppercase tracking-wider text-center">
                {title}
              </h2>
            </div>
          </div>

          {/* Circular Countdown Progress Card */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6bc33a] to-transparent" />

            {/* Circular Countdown Progress with Branded Colors */}
            <div className="relative flex items-center justify-center my-2">
              <svg className="h-44 w-44 sm:h-52 sm:w-52 -rotate-90 transform" viewBox="0 0 190 190">
                {/* Background circle */}
                <circle
                  cx="95"
                  cy="95"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  className="text-zinc-850"
                />
                {/* Animated progress circle - NV Green (#6bc33a) normally, Red (#e11e24) on warning */}
                <circle
                  cx="95"
                  cy="95"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-1000 ease-linear',
                    isWarning
                      ? 'text-[#e11e24] animate-pulse'
                      : 'text-[#6bc33a]'
                  )}
                />
              </svg>

              {/* Time Display Centered */}
              <div className="absolute flex flex-col items-center text-center">
                <span
                  className={cn(
                    'tabular font-black text-5xl sm:text-6xl tracking-tight transition-colors',
                    isWarning
                      ? 'text-[#e11e24] animate-pulse'
                      : 'text-white drop-shadow-[0_4px_16px_rgba(107,195,58,0.25)]'
                  )}
                >
                  {display}
                </span>
                <span className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {isFinished ? 'Времето изтече!' : isPaused ? 'Паузирано' : 'Оставащо време'}
                </span>
              </div>
            </div>

            {/* Warning Badge (10s before end) */}
            {isWarning && (
              <div className="flex items-center gap-1.5 rounded-full bg-[#e11e24]/20 border border-[#e11e24]/40 px-3 py-1 text-xs font-black text-[#e11e24] animate-bounce my-1.5">
                <Bell size={14} className="animate-spin" />
                <span>{lang === 'bg' ? '10 секунди до подновяване на срещата!' : '10 seconds remaining to resume!'}</span>
              </div>
            )}

            {isFinished && (
              <div className="rounded-full bg-[#6bc33a]/20 border border-[#6bc33a]/40 px-3 py-1 text-xs font-black text-[#6bc33a] my-1.5">
                {lang === 'bg' ? 'Почивката приключи — готовност за сервиране!' : 'Interval finished — ready to serve!'}
              </div>
            )}

            {/* Timer Control Buttons */}
            <div className="flex items-center justify-center gap-2 mt-2 w-full max-w-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdjustTime(-10)}
                className="flex-1 h-9 border-zinc-800 bg-zinc-900 text-xs font-black text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                -10 {t('secondsShort')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="flex-1 h-9 border-zinc-800 bg-zinc-900 text-xs font-black text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                {isPaused ? <Play size={13} className="mr-1 text-[#6bc33a]" /> : <Pause size={13} className="mr-1 text-[#6bc33a]" />}
                {isPaused ? t('start') : (lang === 'bg' ? 'Пауза' : 'Pause')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdjustTime(10)}
                className="flex-1 h-9 border-zinc-800 bg-zinc-900 text-xs font-black text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                +10 {t('secondsShort')}
              </Button>

              <button
                type="button"
                onClick={toggleMute}
                className="h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer shrink-0 transition-colors"
                title={isMuted ? t('soundUnmute') : t('soundMute')}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>

          {/* Skip Interval Action - Official NV Lime Green Branded Button */}
          <div className="w-full pt-1">
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={onDismiss}
              className="w-full h-12 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black text-sm rounded-xl shadow-lg shadow-[#6bc33a]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FastForward size={18} />
              <span>{lang === 'bg' ? 'Подновяване на играта (Skip Interval)' : 'Resume Match Now (Skip Interval)'}</span>
            </Button>
          </div>

        </div>
      </div>

      {/* Bottom Bulgarian Tricolor Stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />
    </div>,
    document.body
  );
}
