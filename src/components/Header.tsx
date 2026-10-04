import { useRef } from 'react';
import { Volume2, VolumeX, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { MatchFormat } from '@/types';

interface HeaderProps {
  courtNumber: string;
  locationName?: string;
  matchNumber: string;
  currentSet: number;
  setsLeft: number;
  setsRight: number;
  format: MatchFormat;
  isMuted: boolean;
  onToggleMute: () => void;
  onAdminPress: () => void;
}

export function Header({
  courtNumber,
  locationName,
  matchNumber,
  currentSet,
  setsLeft,
  setsRight,
  format,
  isMuted,
  onToggleMute,
  onAdminPress,
}: HeaderProps) {
  const { lang, isTranslationEnabled, setLanguage, t } = useI18n();

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

  // Determine if matchNumber is a custom round/match title or just repeating "Корт X"
  const isGenericCourtName =
    !matchNumber ||
    matchNumber.trim().toLowerCase() === `корт ${courtNumber}`.toLowerCase() ||
    matchNumber.trim().toLowerCase() === `корт${courtNumber}`.toLowerCase() ||
    matchNumber.trim().toLowerCase() === `court ${courtNumber}`.toLowerCase() ||
    matchNumber.trim().toLowerCase() === `match ${courtNumber}`.toLowerCase();

  return (
    <header className="flex items-center justify-between nv-header-border bg-black px-3 sm:px-4 py-1.5 md:px-6 shadow-2xl select-none shrink-0">
      {/* Left: Official NV Logo with 3-click handler + Court Badge */}
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
            <span className="text-[8px] font-bold text-[#6bc33a]">
              {t('brandScoringApp')}
            </span>
          </div>
        </div>

        {/* Bulgarian Tricolor Indicator: White, Green (#6bc33a), Red (#e11e24) */}
        <div className="flex flex-col gap-0.5 justify-center py-0.5" title="Български трикольор: Бяло, Зелено, Червено">
          <span className="h-1.5 w-3.5 rounded-full bg-white shadow-sm" />
          <span className="h-1.5 w-3.5 rounded-full bg-[#6bc33a] shadow-sm" />
          <span className="h-1.5 w-3.5 rounded-full bg-[#e11e24] shadow-sm" />
        </div>

        {/* Court Badge (single place for court number, no duplicate "Корт 1" next to it) */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#6bc33a]/40 bg-[#6bc33a]/10 px-2.5 py-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#6bc33a]">{t('courtUpper')}</div>
          <div className="text-base sm:text-lg font-black text-white">{courtNumber}</div>
        </div>

        {/* Location & Format Info (only shows custom match title if not duplicating Court number) */}
        <div className="hidden lg:flex flex-col">
          {!isGenericCourtName && (
            <span className="text-xs font-bold text-slate-100">{matchNumber}</span>
          )}
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[160px]">
            {locationName || (format === '3x21' ? 'BWF 3×21' : 'BWF 3×15')}
          </span>
        </div>
      </div>

      {/* Center: Current Set & Sets Score Tracker (Unified, ZERO duplication of 'Гейм/Геймове') */}
      <div className="flex flex-col items-center">
        <span className="rounded-full bg-zinc-900 border border-zinc-700 px-3.5 py-1 text-xs font-black text-white flex items-center gap-2 shadow-sm">
          <span>{t('gameUpper')} {currentSet}</span>
          <span className="text-zinc-600 font-normal">|</span>
          <span className="text-xs font-black flex items-center gap-1">
            <strong className="text-[#6bc33a]">{setsLeft}</strong>
            <span className="text-zinc-500">—</span>
            <strong className="text-[#e11e24]">{setsRight}</strong>
          </span>
        </span>
      </div>

      {/* Right: Sound toggle and optional Language Switcher */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Switcher (Visible if enabled by Admin) */}
        {isTranslationEnabled && (
          <button
            type="button"
            onClick={() => setLanguage(lang === 'bg' ? 'en' : 'bg')}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-[#6bc33a]/40 bg-zinc-950 px-2 sm:px-2.5 text-xs font-black text-white hover:border-[#6bc33a] hover:bg-[#6bc33a]/10 transition-all shadow-md active:scale-95 cursor-pointer"
            title={lang === 'bg' ? 'Switch interface to English' : 'Превключи интерфейса на Български'}
          >
            <Globe size={14} className="text-[#6bc33a] shrink-0" />
            <span className="text-[11px] font-black tracking-wide">
              {lang === 'bg' ? '🇬🇧 EN' : '🇧🇬 BG'}
            </span>
          </button>
        )}

        {/* Mute button */}
        <button
          type="button"
          onClick={onToggleMute}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
          title={isMuted ? t('soundUnmute') : t('soundMute')}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>
    </header>
  );
}
