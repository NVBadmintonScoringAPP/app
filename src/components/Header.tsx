import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Volume2, VolumeX, Shield, Maximize, Minimize, Lock, Sun, SunDim, Download, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { MatchFormat } from '@/types';

interface HeaderProps {
  courtNumber: string;
  locationName?: string;
  matchNumber: string;
  currentSet: number;
  setsLeft: number;
  setsRight: number;
  format: MatchFormat;
  isOnline: boolean;
  pendingCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onAdminPress: () => void;
  onLockKiosk: () => void;
  wakeLockActive?: boolean;
  onToggleWakeLock?: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export function Header({
  courtNumber,
  locationName,
  matchNumber,
  currentSet,
  setsLeft,
  setsRight,
  format,
  isOnline,
  pendingCount,
  isMuted,
  onToggleMute,
  onAdminPress,
  onLockKiosk,
  wakeLockActive,
  onToggleWakeLock,
  canInstallPwa,
  onInstallPwa,
}: HeaderProps) {
  const { lang, isTranslationEnabled, setLanguage, t } = useI18n();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Triple-click / triple-tap detector on logo for Head Referee PIN entrance
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onAdminPress();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 750);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="flex items-center justify-between nv-header-border bg-black px-3 sm:px-4 py-1.5 md:px-6 shadow-2xl select-none">
      {/* Left: Official NV Logo with 3-click handler + Court & Match Badge */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
          title={t('headerTripleTap')}
        >
          <img
            src="/logo.png"
            alt="Национална Верига Бадминтон"
            className="h-8 sm:h-9 object-contain drop-shadow group-hover:brightness-110 transition-all"
          />
          <div className="hidden 2xl:flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
              {t('appTitle')}
            </span>
            <span className="text-[8px] font-bold text-emerald-400">
              {t('brandScoringApp')}
            </span>
          </div>
        </div>

        {/* Bulgarian Tricolor Indicator: Top-to-Bottom: White, Green (#6bc33a), Red (#e11e24) */}
        <div className="flex flex-col gap-0.5 justify-center py-0.5" title="Български трикольор: Бяло, Зелено, Червено">
          <span className="h-1.5 w-3.5 rounded-full bg-white shadow-sm" />
          <span className="h-1.5 w-3.5 rounded-full bg-[#6bc33a] shadow-sm" />
          <span className="h-1.5 w-3.5 rounded-full bg-[#e11e24] shadow-sm" />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{t('courtUpper')}</div>
          <div className="text-base sm:text-lg font-black text-white">{courtNumber}</div>
        </div>

        <div className="hidden lg:flex flex-col">
          <span className="text-xs font-bold text-slate-100">{matchNumber}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
            {locationName || (format === '3x21' ? 'BWF 3×21' : 'BWF 3×15')}
          </span>
        </div>
      </div>

      {/* Center: Current Set & Sets Score Tracker */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 border border-slate-700 px-3 py-0.5 text-xs font-extrabold text-white">
            {t('gameUpper')} {currentSet}
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-200">
            {t('games')}: <strong className="text-emerald-400">{setsLeft}</strong> — <strong className="text-red-400">{setsRight}</strong>
          </span>
        </div>
      </div>

      {/* Right: Quick Kiosk Actions & Status */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Switcher (Visible on tablets/desktop if enabled by Admin) */}
        {isTranslationEnabled && (
          <button
            type="button"
            onClick={() => setLanguage(lang === 'bg' ? 'en' : 'bg')}
            className="hidden sm:flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-black px-2 sm:px-2.5 text-xs font-black text-white hover:border-emerald-400 hover:bg-emerald-950/40 transition-all shadow-md active:scale-95"
            title={lang === 'bg' ? 'Switch interface to English' : 'Превключи интерфейса на Български'}
          >
            <Globe size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] font-black tracking-wide">
              {lang === 'bg' ? '🇬🇧 EN' : '🇧🇬 BG'}
            </span>
          </button>
        )}

        {/* Online / Sync indicator */}
        <div
          className={cn(
            'flex h-7 sm:h-8 md:h-9 items-center gap-1 rounded-xl border px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold',
            isOnline
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          )}
          title={isOnline ? `${t('online')} (Cloud Sync)` : `${t('offline')} (IndexedDB)`}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden md:inline">{isOnline ? t('online') : t('offline')}</span>
          {pendingCount > 0 && (
            <span className="flex h-3.5 min-w-3.5 sm:h-4 sm:min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 sm:px-1 text-[8px] sm:text-[9px] font-black text-slate-950">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Fullscreen Kiosk button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-colors"
          title={isFullscreen ? t('fullscreenExit') : t('fullscreenEnter')}
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>

        {/* Mute button */}
        <button
          type="button"
          onClick={onToggleMute}
          className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
          title={isMuted ? t('soundUnmute') : t('soundMute')}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* WakeLock (Screen Always On) toggle - tablets/desktop */}
        {onToggleWakeLock && (
          <button
            type="button"
            onClick={onToggleWakeLock}
            className={cn(
              'hidden md:flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 text-xs font-bold transition-all',
              wakeLockActive
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
            )}
            title={wakeLockActive ? t('wakeLockActiveTitle') : t('wakeLockInactiveTitle')}
          >
            {wakeLockActive ? <Sun size={14} className="animate-spin-slow text-amber-400" /> : <SunDim size={14} />}
            <span className="hidden xl:inline">{wakeLockActive ? t('wakeLockActive') : t('wakeLockNormal')}</span>
          </button>
        )}

        {/* PWA Install Button (desktop/tablets) */}
        {canInstallPwa && onInstallPwa && (
          <button
            type="button"
            onClick={onInstallPwa}
            className="hidden lg:flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-2 sm:px-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all animate-pulse"
            title={t('installPwaTitle')}
          >
            <Download size={14} />
            <span className="hidden xl:inline">{t('installPwa')}</span>
          </button>
        )}

        {/* Lock Screen Button */}
        <button
          type="button"
          onClick={onLockKiosk}
          className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors shadow-sm"
          title={t('lockKioskTitle')}
        >
          <Lock size={14} />
        </button>

        {/* Admin PIN Settings */}
        <button
          type="button"
          onClick={onAdminPress}
          className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
          title={t('adminSettingsTitle')}
        >
          <Shield size={14} />
        </button>
      </div>
    </header>
  );
}
