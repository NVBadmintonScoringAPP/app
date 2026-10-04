import { useState } from 'react';
import { Play, Globe, MapPin, Calendar, Users, Building, Trophy, ShieldCheck, AlertCircle, Settings, Wifi, WifiOff } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { getTournamentService } from '@/lib/tournamentService';
import { cn } from '@/lib/utils';
import type { TournamentInfo } from '@/types';

interface WelcomeSplashProps {
  open: boolean;
  tournamentName: string;
  tournamentInfo?: TournamentInfo | null;
  assignedCourt: string;
  assignedLocation?: string;
  isManualMode: boolean;
  isOnline?: boolean;
  onStartMatchSelection: () => void;
  onStartManualMatch?: () => void;
  onOpenAdmin: () => void;
}

export function WelcomeSplash({
  open,
  tournamentName,
  tournamentInfo,
  assignedCourt,
  assignedLocation,
  isManualMode,
  isOnline = true,
  onStartMatchSelection,
  onStartManualMatch,
  onOpenAdmin,
}: WelcomeSplashProps) {
  const { lang, isTranslationEnabled, setLanguage, t } = useI18n();
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const tournamentService = getTournamentService();

  if (!open) return null;

  // Tournament is active only if authorized by admin and has matches
  const isAuthorized = tournamentService.isAuthorized();
  const displayTitle = tournamentName?.trim() || tournamentInfo?.name?.trim() || '';
  const hasActiveTournament = isAuthorized && !isManualMode && Boolean(displayTitle && tournamentInfo && tournamentInfo.totalMatches > 0);

  const venueTitle = assignedLocation || tournamentInfo?.venueName || (tournamentInfo?.hallNames && tournamentInfo.hallNames[0]) || '';
  const locationCity = tournamentInfo?.city || tournamentInfo?.location || '';

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      className="w-[94vw] sm:w-[90vw] md:w-[490px] max-w-[500px] border-zinc-800 bg-black/95 backdrop-blur-2xl !p-3 sm:!p-3.5 overflow-y-auto overflow-x-hidden max-h-[92vh] landscape:max-h-[88vh] flex flex-col justify-start shadow-2xl"
    >
      <div className="w-full flex flex-col items-center text-center space-y-1.5 sm:space-y-2 landscape:space-y-1 select-none relative overflow-x-hidden">
        {/* Top Header Row: System Status (Left) and Language Switcher (Right) - Exactly aligned */}
        <div className="w-full flex items-center justify-between z-20">
          {/* Active System Readiness & Connectivity Status (Top-Left) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusDetails((prev) => !prev)}
              className={cn(
                'h-7 flex items-center gap-1.5 px-2.5 rounded-lg border text-[10px] font-black transition-all shadow-sm active:scale-95 cursor-pointer',
                isOnline
                  ? 'border-[#6bc33a]/30 bg-[#6bc33a]/10 text-[#6bc33a] hover:bg-[#6bc33a]/20'
                  : 'border-[#e11e24]/40 bg-[#e11e24]/10 text-[#e11e24] hover:bg-[#e11e24]/20'
              )}
              title={
                isOnline
                  ? (lang === 'bg' ? 'В готовност · Онлайн свързаност (Кликнете за детайли)' : 'Ready · Online (Click for details)')
                  : (lang === 'bg' ? 'Офлайн режим: резултатите се пазят локално на таблета (Кликнете за детайли)' : 'Offline mode: data saved locally (Click for details)')
              }
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isOnline ? 'bg-[#6bc33a] animate-pulse' : 'bg-[#e11e24]'
                )}
              />
              {isOnline ? <Wifi size={11} className="text-[#6bc33a]" /> : <WifiOff size={11} className="text-[#e11e24]" />}
              <span>{isOnline ? t('standbyReady') : (lang === 'bg' ? 'Офлайн' : 'Offline')}</span>
            </button>

            {/* Discreet Info Popover on click */}
            {showStatusDetails && (
              <div className="absolute top-8 left-0 z-30 w-64 sm:w-72 rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 text-left shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    {isOnline ? <Wifi size={12} className="text-[#6bc33a]" /> : <WifiOff size={12} className="text-[#e11e24]" />}
                    {isOnline
                      ? (lang === 'bg' ? 'Системата е онлайн' : 'System is online')
                      : (lang === 'bg' ? 'Офлайн режим' : 'Offline mode')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStatusDetails(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs px-1 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  {isOnline
                    ? (lang === 'bg'
                        ? 'Таблетът е свързан към мрежата. Резултатите и мачовете се синхронизират в реално време.'
                        : 'Tablet is online. Match scores and updates sync in real time.')
                    : (lang === 'bg'
                        ? 'Няма връзка с интернет. Приложението работи автономно – всички резултати се записват локално на таблета и ще се изпратят автоматично при възстановяване на мрежата.'
                        : 'No internet connection. App works autonomously – all data is saved locally on the tablet and will sync automatically when network is restored.')}
                </p>
              </div>
            )}
          </div>

          {/* Right: Language Switcher Icon (Aligned horizontally and vertically with status button) */}
          {isTranslationEnabled ? (
            <button
              type="button"
              onClick={() => setLanguage(lang === 'bg' ? 'en' : 'bg')}
              className="h-7 w-7 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all shadow-sm active:scale-90"
              title={lang === 'bg' ? 'Switch interface to English' : 'Превключи интерфейса на Български'}
              aria-label="Switch language"
            >
              <Globe size={14} className="text-zinc-400 hover:text-[#6bc33a]" />
            </button>
          ) : (
            <div className="h-7 w-7" />
          )}
        </div>

        {/* Brand Card: Exactly matches the description card style below */}
        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-2 sm:p-2.5 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
          {/* Bulgarian Tricolor Top Accent Stripe: White -> Green -> Red */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-tricolor-horizontal" />

          {/* Official NV Logo */}
          <div
            className="w-full flex items-center justify-center pt-0.5 group cursor-pointer"
            onClick={onOpenAdmin}
            title={t('headerTripleTap')}
          >
            <img
              src="/logo.png"
              alt="Национална Верига Бадминтон"
              className="w-full max-h-[55px] sm:max-h-[70px] md:max-h-[90px] landscape:max-h-[45px] object-contain drop-shadow-2xl group-hover:scale-[1.01] transition-transform"
            />
          </div>

          {/* Official Subtitle inside card */}
          <div className="w-full pt-1 mt-0.5 border-t border-zinc-800/80">
            <h2 className="text-[10px] sm:text-[11px] font-black text-[#6bc33a] uppercase tracking-widest text-center">
              {t('appSubtitle')}
            </h2>
          </div>
        </div>

        {/* CASE 1: TOURNAMENT IS ACTIVE */}
        {hasActiveTournament && tournamentInfo ? (
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 space-y-3 text-left shadow-2xl relative overflow-hidden">
            {/* Bulgarian Tricolor Top Accent Stripe: White -> Green -> Red */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-tricolor-horizontal" />

            {/* Header Row: Tournament Label & Kiosk Status */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-400" />
                {t('tournamentSoftware')}
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {t('kioskActive')}
              </span>
            </div>

            {/* Full Tournament Title (NO TRUNCATION, NO ELLIPSIS, STRICTLY FULL TEXT) */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Trophy size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="font-black text-sm sm:text-base text-zinc-100 leading-snug break-words text-wrap">
                  {displayTitle}
                </div>
              </div>
              {tournamentInfo?.organization && (
                <div className="text-[11px] font-bold text-zinc-400 pl-6">
                  🏛️ {tournamentInfo.organization}
                </div>
              )}
            </div>

            {/* Hall, City & Assigned Court Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 font-black text-xs text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-xl shadow-sm">
                <MapPin size={13} className="text-emerald-400" />
                <span>{venueTitle || 'Основна зала'}</span>
                <span className="text-zinc-500 font-normal">·</span>
                <span className="text-white">{t('courtNum', { court: assignedCourt })}</span>
              </span>

              {locationCity && (
                <span className="text-[11px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-xl">
                  📍 {locationCity}
                </span>
              )}
            </div>

            {/* Tournament Overview Stats (Days, Matches, Players, Clubs) */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-2 border border-zinc-800/80">
                  <Calendar size={14} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">{t('dates')}</span>
                    <span className="font-bold text-zinc-200 text-xs truncate block" title={tournamentInfo.dates}>
                      {tournamentInfo.dates || `${tournamentInfo.days.length} дни`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-2 border border-zinc-800/80">
                  <Trophy size={14} className="text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">{t('matchesCountLabel')}</span>
                    <span className="font-bold text-zinc-200 text-xs">
                      {tournamentInfo.totalMatches} {t('matchesCountLabel').toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-2 border border-zinc-800/80">
                  <Users size={14} className="text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">{t('playersCountLabel')}</span>
                    <span className="font-bold text-zinc-200 text-xs">
                      {tournamentInfo.totalPlayers} {t('playersCountLabel').toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-2 border border-zinc-800/80">
                  <Building size={14} className="text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">{t('clubsCountLabel')}</span>
                    <span className="font-bold text-zinc-200 text-xs">
                      {tournamentInfo.totalClubs} {t('clubsCountLabel').toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Verification Guarantee Badge */}
              <div
                className={cn(
                  'flex items-center justify-between text-[10px] font-bold p-2 rounded-xl border',
                  tournamentInfo.warnings.length === 0
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-950/30 text-amber-300'
                )}
              >
                <div className="flex items-center gap-1.5">
                  {tournamentInfo.warnings.length === 0 ? (
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                  )}
                  <span>
                    {tournamentInfo.warnings.length === 0
                      ? t('dataVerifiedBadge')
                      : `${t('dataCheckPrefix')} ${tournamentInfo.warnings[0]}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CASE 2: CLEAN WELCOME SCREEN WHEN TOURNAMENT IS FINISHED OR CLEARED */
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-2.5 sm:p-3 space-y-1.5 text-left shadow-xl relative overflow-hidden">
            {/* Bulgarian Tricolor Top Accent Stripe: White -> Green -> Red */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-tricolor-horizontal" />

            {/* Header: Exact welcome title */}
            <div className="text-xs sm:text-sm font-black text-white text-center pb-1.5 border-b border-zinc-800/80 leading-snug">
              {t('standbyTitle')}
            </div>

            {/* Structured Info Rows - Aligned and clean */}
            <div className="space-y-1.5 pt-0.5 text-xs">
              <div className="flex items-center justify-between bg-black/50 border border-zinc-800/70 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-zinc-400">
                  {t('standbyStatusLabel')}
                </span>
                <span className="text-[11px] font-black text-[#6bc33a] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6bc33a]" />
                  {t('standbyStatusVal')}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/50 border border-zinc-800/70 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-zinc-400">
                  {t('standbyReadyLabel')}
                </span>
                <span className="text-[11px] font-bold text-zinc-200">
                  {t('standbyReadyVal')}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/50 border border-zinc-800/70 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-zinc-400">
                  {t('standbyNoticeLabel')}
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  {t('standbyNoticeVal')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons: 2 Clear Options */}
        <div className="w-full space-y-2 pt-0.5">
          {hasActiveTournament ? (
            <div className="space-y-1.5">
              {/* Option 1 in Tournament Mode: Start official tournament matches for assigned court */}
              <Button
                size="lg"
                variant="default"
                className="w-full h-10 sm:h-11 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black text-xs sm:text-sm shadow-lg shadow-[#6bc33a]/20 transition-all rounded-xl active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                onClick={onStartMatchSelection}
              >
                <Play size={15} className="fill-black stroke-black shrink-0" />
                <span>{t('tournamentModeCourtMatches', { court: assignedCourt })}</span>
              </Button>

              {/* Option 2 in Tournament Mode: Regular User (Manual Mode) */}
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 sm:h-8.5 border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 hover:border-zinc-700 text-[11px] sm:text-xs font-bold text-zinc-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                onClick={onStartManualMatch || onStartMatchSelection}
              >
                <Users size={13} className="text-zinc-400 shrink-0" />
                <span>{t('switchToManualModeBtn')}</span>
              </Button>

              {/* Option 3 in Tournament Mode: Administrator Settings Link */}
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full text-center text-[10px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1.5 pt-0.5 transition-colors cursor-pointer"
              >
                <Settings size={11} className="text-[#6bc33a]" />
                <span>{t('adminSettingsShort')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* OPTION 1: REGULAR USER (Manual match entry, toss, court, scoring) */}
              <button
                type="button"
                onClick={onStartManualMatch || onStartMatchSelection}
                className="w-full h-11 sm:h-12 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black rounded-xl transition-all shadow-lg shadow-[#6bc33a]/20 active:scale-[0.99] flex items-center justify-between px-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/15 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-black" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-black text-xs sm:text-sm leading-tight text-black">
                      {t('optionRegularUser')}
                    </div>
                    <div className="text-[10px] text-black/75 font-bold leading-tight truncate">
                      {t('optionRegularUserDesc')}
                    </div>
                  </div>
                </div>
                <Play size={14} className="fill-black stroke-black shrink-0 ml-2" />
              </button>

              {/* OPTION 2: ADMINISTRATOR (Tournament setup, court assignment, authorization) */}
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full h-11 sm:h-12 border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-100 rounded-xl transition-all active:scale-[0.99] flex items-center justify-between px-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/50 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-[#6bc33a]/40 transition-colors">
                    <ShieldCheck size={16} className="text-[#6bc33a]" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-black text-xs sm:text-sm leading-tight text-zinc-100 group-hover:text-white transition-colors">
                      {t('optionAdmin')}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold leading-tight truncate">
                      {t('optionAdminDesc')}
                    </div>
                  </div>
                </div>
                <Settings size={14} className="text-zinc-500 group-hover:text-[#6bc33a] transition-colors shrink-0 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
