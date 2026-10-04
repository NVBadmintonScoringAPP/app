import { useEffect, useRef, useState } from 'react';
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
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={onDismiss} />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center rounded-3xl border-2 border-amber-400/80 bg-slate-950 p-6 sm:p-8 md:p-10 shadow-2xl slide-up">
        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
          title="Затвори"
        >
          <X size={24} />
        </button>

        {/* Title & Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Официална BWF почивка
          </span>
        </div>
        <h2 className="mb-4 text-center text-xl sm:text-2xl md:text-3xl font-black text-slate-100">
          {title}
        </h2>

        {/* Circular Countdown Progress */}
        <div className="relative flex items-center justify-center my-3">
          <svg className="h-56 w-56 -rotate-90 transform" viewBox="0 0 220 220">
            {/* Background circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-800"
            />
            {/* Animated progress circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                'transition-all duration-1000 ease-linear',
                isFinished
                  ? 'text-emerald-400'
                  : isWarning
                  ? 'text-red-500 animate-pulse'
                  : 'text-amber-400'
              )}
            />
          </svg>

          {/* Time Display Centered */}
          <div className="absolute flex flex-col items-center text-center">
            <span
              className={cn(
                'tabular font-black text-5xl sm:text-6xl tracking-tight transition-colors',
                isFinished
                  ? 'text-emerald-400'
                  : isWarning
                  ? 'text-red-400 animate-pulse'
                  : 'text-slate-100'
              )}
            >
              {display}
            </span>
            <span className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              {isFinished ? 'Времето изтече!' : isPaused ? 'Паузирано' : 'Оставащо време'}
            </span>
          </div>
        </div>

        {/* Warning Badge (10s before end) */}
        {isWarning && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300 animate-bounce mb-3">
            <Bell size={14} className="animate-spin" />
            <span>{lang === 'bg' ? '10 секунди до подновяване на срещата!' : '10 seconds remaining to resume!'}</span>
          </div>
        )}

        {isFinished && (
          <div className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300 mb-3">
            {lang === 'bg' ? 'Почивката приключи — готовност за сервиране!' : 'Interval finished — ready to serve!'}
          </div>
        )}

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-2 mt-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustTime(-10)}
            className="border-zinc-800 bg-zinc-900 text-xs font-bold"
          >
            -10 {t('secondsShort')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className="border-zinc-800 bg-zinc-900 px-4 text-xs font-bold"
          >
            {isPaused ? <Play size={14} className="mr-1 text-emerald-400" /> : <Pause size={14} className="mr-1 text-amber-400" />}
            {isPaused ? t('start') : (lang === 'bg' ? 'Пауза' : 'Pause')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustTime(10)}
            className="border-zinc-800 bg-zinc-900 text-xs font-bold"
          >
            +10 {t('secondsShort')}
          </Button>

          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200"
            title={isMuted ? t('soundUnmute') : t('soundMute')}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Skip Interval Action */}
        <button
          type="button"
          onClick={onDismiss}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-base font-black text-black shadow-lg hover:bg-amber-300 active:scale-98 transition-all"
        >
          <FastForward size={18} />
          <span>{lang === 'bg' ? 'Подновяване на играта (Skip Interval)' : 'Resume Match Now (Skip Interval)'}</span>
        </button>
      </div>
    </div>
  );
}
