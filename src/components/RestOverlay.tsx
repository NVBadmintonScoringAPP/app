import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, FastForward, Bell, Volume2, VolumeX } from 'lucide-react';
import { getAudioService } from '@/lib/audio';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RestOverlayProps {
  open: boolean;
  duration: number;
  title: string;
  onDismiss: () => void;
}

export function RestOverlay({ open, duration, title, onDismiss }: RestOverlayProps) {
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
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none animate-fade-in">
      {/* Top tricolor stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />

      {/* Main scrollable/adaptable content - 100% solid black, nothing behind visible */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-xl flex flex-col items-center rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 md:p-8 shadow-2xl">
          {/* Close / Dismiss Button */}
          <button
            onClick={onDismiss}
            className="absolute right-3.5 top-3.5 rounded-xl p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Затвори"
          >
            <X size={22} />
          </button>

          {/* Logo */}
          <img
            src="/logo.png"
            alt="Национална Верига Бадминтон"
            className="max-h-[40px] sm:max-h-[50px] object-contain drop-shadow mb-1"
          />

          {/* Bulgarian Tricolor Indicator */}
          <div className="flex items-center justify-center gap-1.5 my-1">
            <span className="h-1.5 w-6 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
            <span className="h-1.5 w-6 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
            <span className="h-1.5 w-6 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
          </div>

          {/* Title & Badge */}
          <div className="flex items-center gap-2 mt-1 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Официална BWF почивка
            </span>
          </div>

          <h2 className="mb-2 text-center text-lg sm:text-2xl font-black text-white px-6">
            {title}
          </h2>

          {/* Circular Countdown Progress */}
          <div className="relative flex items-center justify-center my-2">
            <svg className="h-44 w-44 sm:h-52 sm:w-52 -rotate-90 transform" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-zinc-800"
              />
              {/* Animated progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-1000 ease-linear',
                  isFinished
                    ? 'text-[#6bc33a]'
                    : isWarning
                    ? 'text-[#e11e24] animate-pulse'
                    : 'text-amber-400'
                )}
              />
            </svg>

            {/* Time Display Centered */}
            <div className="absolute flex flex-col items-center text-center">
              <span
                className={cn(
                  'tabular font-black text-4xl sm:text-5xl md:text-6xl tracking-tight transition-colors',
                  isFinished
                    ? 'text-[#6bc33a]'
                    : isWarning
                    ? 'text-[#e11e24] animate-pulse'
                    : 'text-white'
                )}
              >
                {display}
              </span>
              <span className="mt-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                {isFinished ? 'Времето изтече!' : isPaused ? 'Паузирано' : 'Оставащо време'}
              </span>
            </div>
          </div>

          {/* Warning Badge (10s before end) */}
          {isWarning && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300 animate-bounce mb-2">
              <Bell size={14} className="animate-spin" />
              <span>{lang === 'bg' ? '10 секунди до подновяване на срещата!' : '10 seconds remaining to resume!'}</span>
            </div>
          )}

          {isFinished && (
            <div className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300 mb-2">
              {lang === 'bg' ? 'Почивката приключи — готовност за сервиране!' : 'Interval finished — ready to serve!'}
            </div>
          )}

          {/* Timer Control Buttons */}
          <div className="flex items-center gap-2 mt-1 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdjustTime(-10)}
              className="border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              -10 {t('secondsShort')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="border-zinc-800 bg-zinc-900 px-3.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              {isPaused ? <Play size={14} className="mr-1 text-[#6bc33a]" /> : <Pause size={14} className="mr-1 text-amber-400" />}
              {isPaused ? t('start') : (lang === 'bg' ? 'Пауза' : 'Pause')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdjustTime(10)}
              className="border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              +10 {t('secondsShort')}
            </Button>

            <button
              type="button"
              onClick={toggleMute}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              title={isMuted ? t('soundUnmute') : t('soundMute')}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* Skip Interval Action */}
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onDismiss}
            className="w-full h-12 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <FastForward size={18} className="mr-2" />
            <span>{lang === 'bg' ? 'Подновяване на играта (Skip Interval)' : 'Resume Match Now (Skip Interval)'}</span>
          </Button>
        </div>
      </div>

      {/* Bottom tricolor stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />
    </div>,
    document.body
  );
}
