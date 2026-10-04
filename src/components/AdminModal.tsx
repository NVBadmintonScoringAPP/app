import { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  KeyRound,
  Maximize,
  Check,
  FileDown,
  Sun,
  RefreshCw,
  Globe,
  MapPin,
  Trash2,
  Trophy,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTournamentService } from '@/lib/tournamentService';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AdminModalProps {
  open: boolean;
  pin: string;
  onClose: () => void;
  onUpdatePin: (newPin: string) => void;
  onResetPin: () => void;
  onLockKiosk: () => void;
  onForceNewMatch: () => void;
  onTournamentFinished?: () => void;
  onDownloadPdf?: () => void;
  wakeLockActive?: boolean;
  onToggleWakeLock?: () => void;
  onCourtChanged?: (court: string, location: string) => void;
}

export function AdminModal({
  open,
  pin,
  onClose,
  onUpdatePin,
  onResetPin,
  onLockKiosk,
  onForceNewMatch,
  onTournamentFinished,
  onDownloadPdf,
  wakeLockActive,
  onToggleWakeLock,
  onCourtChanged,
}: AdminModalProps) {
  const tournamentService = getTournamentService();
  const { lang, isTranslationEnabled, setLanguage, setTranslationEnabled, t } = useI18n();
  const [enteredPin, setEnteredPin] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'history' | 'security'>('setup');

  // Change PIN state
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Tournament Setup state inside Admin Modal
  const [tournamentUrl, setTournamentUrl] = useState(tournamentService.getTournamentUrl());
  const [tournamentName, setTournamentName] = useState(tournamentService.getTournamentName());
  const [tournamentInfo, setTournamentInfo] = useState(tournamentService.getTournamentInfo());
  const [isManualMode, setIsManualMode] = useState(tournamentService.getIsManualMode());
  const [assignedCourt, setAssignedCourt] = useState(tournamentService.getAssignedCourt());
  const [assignedLocation, setAssignedLocation] = useState(tournamentService.getAssignedLocation());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [showConfirmFinishTournament, setShowConfirmFinishTournament] = useState(false);
  const [authorizationSuccess, setAuthorizationSuccess] = useState(false);

  useEffect(() => {
    return tournamentService.subscribe(() => {
      setTournamentName(tournamentService.getTournamentName());
      setTournamentInfo(tournamentService.getTournamentInfo());
      setAssignedCourt(tournamentService.getAssignedCourt());
      setAssignedLocation(tournamentService.getAssignedLocation());
      setIsManualMode(tournamentService.getIsManualMode());
      setTournamentUrl(tournamentService.getTournamentUrl());
    });
  }, [tournamentService]);

  const availableCourts = tournamentService.getUniqueCourtsAndLocations();
  const completedMatches = tournamentService.getCompletedMatches();

  const handleVerify = () => {
    if (enteredPin === pin) {
      setVerified(true);
      setError('');
    } else {
      setError('Грешен PIN код. Опитайте отново.');
      setEnteredPin('');
    }
  };

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 8) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setError('');
    if (next === pin) {
      setVerified(true);
    }
  };

  const handleChangePinSubmit = () => {
    if (newPin.length < 4) {
      setError('PIN кодът трябва да бъде поне 4 цифри.');
      return;
    }
    if (newPin !== newPinConfirm) {
      setError('Двата PIN кода не съвпадат.');
      return;
    }
    onUpdatePin(newPin);
    setPinChangeSuccess(true);
    setError('');
    setTimeout(() => {
      setPinChangeSuccess(false);
      setNewPin('');
      setNewPinConfirm('');
    }, 1500);
  };

  const handleClose = () => {
    setEnteredPin('');
    setVerified(false);
    setError('');
    setNewPin('');
    setNewPinConfirm('');
    setShowConfirmFinishTournament(false);
    onClose();
  };

  const handleSyncTournamentUrl = async () => {
    if (!tournamentUrl.trim()) return;
    setIsSyncing(true);
    setSyncStatusMsg('');
    const res = await tournamentService.syncWithTournamentUrl(tournamentUrl);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatusMsg(`Успешно извлечен турнир: „${res.name}“ (${res.count} срещи за всички дни)!`);
      setTournamentName(tournamentService.getTournamentName());
      setTournamentInfo(tournamentService.getTournamentInfo());
    } else {
      setSyncStatusMsg(`Грешка при синхронизация: ${res.error}`);
    }
  };

  const handleSaveCourtSelection = (courtNum: string, loc: string) => {
    setAssignedCourt(courtNum);
    setAssignedLocation(loc);
    tournamentService.setAssignedCourt(courtNum);
    tournamentService.setAssignedLocation(loc);
    if (onCourtChanged) {
      onCourtChanged(courtNum, loc);
    }
  };

  const handleAuthorizeTournamentForTablet = () => {
    if (!tournamentName && !tournamentInfo) {
      setSyncStatusMsg('Моля първо въведете линк и синхронизирайте турнира преди да разрешите таблета.');
      return;
    }
    handleSaveCourtSelection(assignedCourt, assignedLocation);
    tournamentService.authorizeTournamentForTablet(assignedCourt, assignedLocation);
    setAuthorizationSuccess(true);
    setSyncStatusMsg(`✓ Таблетът е успешно разрешен за турнир „${tournamentName || tournamentInfo?.name}“, Корт ${assignedCourt}!`);
    setTimeout(() => {
      setAuthorizationSuccess(false);
      handleClose();
    }, 700);
  };

  const handleFinishTournamentConfirm = () => {
    tournamentService.finishTournament();
    setShowConfirmFinishTournament(false);
    setSyncStatusMsg('Турнирът е приключен. Таблетът е занулен.');
    setTournamentName('');
    setTournamentInfo(null);
    setTournamentUrl('');
    setTimeout(() => {
      handleClose();
      if (onTournamentFinished) {
        onTournamentFinished();
      } else {
        onForceNewMatch();
      }
    }, 400);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="" className="max-w-xl max-h-[92vh] overflow-y-auto">
      {!verified ? (
        <div className="flex flex-col items-center text-center p-3 select-none">
          <img src="/logo.png" alt="NV" className="h-12 object-contain mb-1" />

          {/* Bulgarian Tricolor: Left-to-Right: White, Green (#6bc33a), Red (#e11e24) */}
          <div className="flex items-center justify-center gap-1.5 my-2" title="Български трикольор: Бяло, Зелено, Червено">
            <span className="h-1.5 w-6 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
            <span className="h-1.5 w-6 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
            <span className="h-1.5 w-6 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-2 border border-amber-500/30">
            <Lock size={30} />
          </div>

          <h2 className="text-xl font-black text-slate-100">Вход за Главен съдия</h2>
          <p className="mt-1 text-xs text-slate-400">
            Въведете Администраторски PIN код за достъп до турнирните настройки
          </p>

          <Input
            className="mt-4 text-center tracking-widest text-xl font-bold h-12 bg-slate-950 border-slate-700 text-white w-48"
            type="password"
            inputMode="numeric"
            value={enteredPin}
            onChange={(e) => {
              setEnteredPin(e.target.value);
              setError('');
            }}
            placeholder="••••"
            maxLength={8}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />

          {error && <p className="mt-2 text-xs font-bold text-red-400">{error}</p>}

          {/* Quick On-Screen Touch Digits */}
          <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-[240px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'C') setEnteredPin('');
                  else if (item === '⌫') setEnteredPin((prev) => prev.slice(0, -1));
                  else handleDigit(item);
                }}
                className="h-11 rounded-xl border border-slate-800 bg-slate-900/90 font-bold text-base text-slate-200 hover:border-amber-400/50 hover:bg-slate-800 active:scale-95 transition-all"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-2 w-full max-w-[280px]">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleClose}>
              Отказ
            </Button>
            <Button variant="accent" size="sm" className="flex-1 text-slate-950 font-bold" onClick={handleVerify}>
              Влез (PIN)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-slate-100 p-1 select-none">
          {/* Admin Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Административен Панел · Главен съдия
                </h3>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  Национална Верига Бадминтон · Пълен контрол
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-slate-400" onClick={handleClose}>
              Затвори ✕
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all',
                activeTab === 'setup'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              ⚙️ Корт & Турнир
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all',
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              📋 Дневник ({completedMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all',
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              🔑 PIN & Финал
            </button>
          </div>

          {/* TAB 1: Setup Court & Tournament */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              {/* Hall and Court assignment for this tablet */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                    <MapPin size={15} className="text-emerald-400" />
                    Зала и Корт за този таблет:
                  </span>
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                    {assignedLocation} · Корт {assignedCourt}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {availableCourts.map((c) => {
                    const isSelected = assignedCourt === c.courtNumber && assignedLocation === c.location;
                    return (
                      <button
                        key={`${c.location}-${c.courtNumber}`}
                        type="button"
                        onClick={() => handleSaveCourtSelection(c.courtNumber, c.location)}
                        className={cn(
                          'p-2 rounded-xl border text-left text-xs transition-all',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/60 text-white ring-2 ring-emerald-500/40'
                            : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700'
                        )}
                      >
                        <div className="font-black text-sm text-slate-100">Корт {c.courtNumber}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.location}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tournament Mode & Link */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                    <Globe size={15} className="text-emerald-400" />
                    Турнирен URL адрес:
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                    <input
                      type="checkbox"
                      checked={isManualMode}
                      onChange={(e) => {
                        setIsManualMode(e.target.checked);
                        tournamentService.setIsManualMode(e.target.checked);
                      }}
                      className="rounded accent-emerald-500"
                    />
                    Ръчен режим (без линк)
                  </label>
                </div>

                {!isManualMode && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={tournamentUrl}
                        onChange={(e) => setTournamentUrl(e.target.value)}
                        placeholder="https://www.tournamentsoftware.com/tournament/..."
                        className="text-xs font-mono h-9 bg-slate-950 border-slate-700 text-white"
                      />
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isSyncing}
                        onClick={handleSyncTournamentUrl}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 h-9"
                      >
                        <RefreshCw size={13} className={cn('mr-1.5', isSyncing && 'animate-spin')} />
                        {isSyncing ? 'Синхрон...' : 'Рефреш'}
                      </Button>
                    </div>

                    {syncStatusMsg && (
                      <p className="text-xs font-semibold text-emerald-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                        {syncStatusMsg}
                      </p>
                    )}

                    <div className="rounded-xl border border-emerald-500/40 bg-slate-950/90 p-3 text-xs text-slate-200 space-y-2.5 shadow-md">
                      {/* Tricolor stripe */}
                      <div className="w-full h-[2px] rounded-full bg-tricolor-horizontal" />

                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Trophy size={13} className="text-amber-400" />
                          ТУРНИР (Tournament Software):
                        </div>
                        <div className="font-black text-white text-xs sm:text-sm break-words text-wrap">
                          {tournamentName ? `🏆 ${tournamentName}` : 'Няма зареден турнир – въведете линк и натиснете „Рефреш“'}
                        </div>
                        {tournamentInfo?.organization && (
                          <div className="text-[10px] text-slate-400 font-bold">
                            🏛️ Организатор: {tournamentInfo.organization}
                          </div>
                        )}
                      </div>

                      {tournamentInfo && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-semibold block">🏟️ Зали & Кортове:</span>
                            <span className="text-white font-bold">
                              {tournamentInfo.hallNames.length > 0 ? tournamentInfo.hallNames.join(', ') : (assignedLocation || 'Основна зала')}
                              {tournamentInfo.totalCourts > 0 ? ` · ${tournamentInfo.totalCourts} корта` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">📍 Локация:</span>
                            <span className="text-white font-bold">{tournamentInfo.location || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">📅 Период & Дни:</span>
                            <span className="text-white font-bold">
                              {tournamentInfo.dates || '—'}
                              {tournamentInfo.days.length > 0 ? ` (${tournamentInfo.days.length} дни)` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">👥 Участници & Клубове:</span>
                            <span className="text-white font-bold">
                              {tournamentInfo.totalPlayers} играчи · {tournamentInfo.totalClubs} клуба
                            </span>
                          </div>
                          {tournamentInfo.disciplines.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 font-semibold block">🏸 Дисциплини:</span>
                              <span className="text-emerald-300 font-bold">{tournamentInfo.disciplines.join(' · ')}</span>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 font-semibold block">📋 Срещи в таблета:</span>
                            <span className="text-amber-300 font-bold">
                              {tournamentService.getAvailableMatches('all').length} предстоящи (общо в турнира: {tournamentInfo.totalMatches})
                            </span>
                          </div>
                        </div>
                      )}

                      {tournamentInfo && (
                        <div
                          className={cn(
                            'p-2 rounded-lg border text-[10px] font-bold flex items-center gap-1.5',
                            tournamentInfo.warnings.length === 0
                              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                              : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                          )}
                        >
                          {tournamentInfo.warnings.length === 0 ? (
                            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle size={13} className="text-amber-400 shrink-0" />
                          )}
                          <span>
                            {tournamentInfo.warnings.length === 0
                              ? 'Всички данни от общия линк са проверени и потвърдени от приложението'
                              : `Проверка на данните: ${tournamentInfo.warnings[0]}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Primary Action: Authorize & Activate Tablet for Tournament */}
                    {Boolean(tournamentName || tournamentInfo) && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          size="lg"
                          onClick={handleAuthorizeTournamentForTablet}
                          className={cn(
                            'w-full h-11 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2',
                            authorizationSuccess
                              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                              : 'bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black shadow-[#6bc33a]/25'
                          )}
                        >
                          <ShieldCheck size={17} className={authorizationSuccess ? 'text-white' : 'text-black'} />
                          {authorizationSuccess ? t('authorizeTabletSuccess') : t('authorizeTabletForTournamentBtn')}
                        </Button>
                      </div>
                    )}

                    {/* Quick Finish Tournament Button directly in Setup Tab */}
                    {Boolean(tournamentName || tournamentInfo) && (
                      <div className="pt-1">
                        {!showConfirmFinishTournament ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConfirmFinishTournament(true)}
                            className="w-full border-red-500/40 bg-red-950/20 hover:bg-red-900/40 text-red-300 font-bold text-xs h-9 flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={13} className="text-red-400" />
                            Приключи въвеждането на срещите за турнира
                          </Button>
                        ) : (
                          <div className="space-y-2 p-2.5 rounded-xl bg-red-950/70 border border-red-500/60">
                            <p className="text-xs font-black text-red-200 text-center">
                              Сигурни ли сте, че искате да приключите този турнир? Таблетът ще се занули и ще се върне към началния екран „Национална верига по бадминтон“.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs font-bold"
                                onClick={() => setShowConfirmFinishTournament(false)}
                              >
                                Отказ
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs"
                                onClick={handleFinishTournamentConfirm}
                              >
                                Да, приключи турнира
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tablet Utilities */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center gap-2 h-11 border-slate-800 bg-slate-900 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                  <Maximize size={15} className="text-sky-400" />
                  Цял екран (Kiosk)
                </Button>

                {onToggleWakeLock && (
                  <Button
                    variant="outline"
                    onClick={onToggleWakeLock}
                    className={cn(
                      'flex items-center justify-center gap-2 h-11 border text-xs font-bold',
                      wakeLockActive
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    )}
                  >
                    <Sun size={15} className={wakeLockActive ? 'text-amber-400 animate-spin-slow' : 'text-slate-500'} />
                    {wakeLockActive ? 'Буден екран: ДА' : 'Буден екран: НЕ'}
                  </Button>
                )}
              </div>

              {onDownloadPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadPdf}
                  className="w-full flex items-center justify-center gap-2 h-10 border-slate-800 bg-slate-900/90 text-xs font-bold text-emerald-300 hover:bg-slate-800"
                >
                  <FileDown size={15} />
                  Свали PDF протокол на текущия мач
                </Button>
              )}
            </div>
          )}

          {/* TAB 2: History of completed matches */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Списък на всички изиграни и потвърдени срещи от този турнир. Тези срещи са автоматично скрити от екрана за избор на доброволците.
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {completedMatches.length > 0 ? (
                  completedMatches.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-100">
                          <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                            Корт {m.courtNumber}
                          </span>
                          <span>{m.team1Player1} vs {m.team2Player1}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {m.eventCategory}
                          {(m.team1Club || m.team2Club) ? ` · ${m.team1Club || '—'} vs ${m.team2Club || '—'}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-black text-amber-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {m.completedScore || 'Изигран'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Няма записани завършени мачове за момента.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Security & PIN change */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Language Translation Settings for Administrator */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                    <Globe size={16} />
                    <span>{t('languageSettingsSection')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                      isTranslationEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    )}>
                      {isTranslationEnabled ? 'РАЗРЕШЕН' : 'ИЗКЛЮЧЕН'}
                    </span>
                    <input
                      type="checkbox"
                      id="admin-translation-toggle"
                      checked={isTranslationEnabled}
                      onChange={(e) => setTranslationEnabled(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('languageSettingsDesc')}
                </p>

                <div className="pt-2 border-t border-slate-800/80">
                  <label htmlFor="admin-translation-toggle" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white select-none">
                    <input
                      type="checkbox"
                      checked={isTranslationEnabled}
                      onChange={(e) => setTranslationEnabled(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>{t('enableTranslationToggleLabel')}</span>
                  </label>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-[11px]">
                  {isTranslationEnabled ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <Check size={14} className="shrink-0" />
                      <span>{t('translationEnabledNotice')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <Lock size={14} className="shrink-0" />
                      <span>{t('translationDisabledNotice')}</span>
                    </div>
                  )}
                </div>

                {isTranslationEnabled && (
                  <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-300 font-bold">Текущ език на таблото:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLanguage('bg')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1',
                          lang === 'bg'
                            ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        )}
                      >
                        <span>🇧🇬</span>
                        <span>Български</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1',
                          lang === 'en'
                            ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        )}
                      >
                        <span>🇬🇧</span>
                        <span>English</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Change PIN Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <KeyRound size={16} />
                  <span>{t('changePinSection')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Нов PIN</label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Нови 4 цифри"
                      maxLength={6}
                      className="text-xs h-9 bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Потвърди нов PIN</label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value)}
                      placeholder="Повтори PIN"
                      maxLength={6}
                      className="text-xs h-9 bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {error && <p className="text-xs font-bold text-red-400">{error}</p>}
                {pinChangeSuccess && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Check size={14} />
                    <span>PIN кодът е сменен успешно!</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onResetPin();
                      setError('PIN кодът е върнат на 1234');
                    }}
                    className="text-xs font-bold border-slate-700"
                  >
                    Фабричен PIN (1234)
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={handleChangePinSubmit}
                    className="text-slate-950 font-bold text-xs flex-1"
                  >
                    Запази нов PIN
                  </Button>
                </div>
              </div>

              {/* End Tournament Section */}
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-red-400">
                  <Trash2 size={16} />
                  <span>Приключване на текущия турнир</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Изчиства всички изиграни срещи, програма и данни за този турнир, и подготвя таблета за следващия нов турнир на веригата.
                </p>

                {!showConfirmFinishTournament ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmFinishTournament(true)}
                    className="w-full border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50 font-black text-xs h-10"
                  >
                    Приключи текущия турнир
                  </Button>
                ) : (
                  <div className="space-y-2 p-2 rounded-xl bg-red-950/60 border border-red-500/50">
                    <p className="text-xs font-black text-red-200 text-center">
                      Сигурни ли сте, че искате да занулите таблета за следващ турнир?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => setShowConfirmFinishTournament(false)}
                      >
                        Отказ
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs"
                        onClick={handleFinishTournamentConfirm}
                      >
                        Да, занули таблета
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-slate-800 text-xs font-bold"
              onClick={handleClose}
            >
              Затвори
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
              onClick={() => {
                handleClose();
                onLockKiosk();
              }}
            >
              🔒 Заключи в режим Табло (Kiosk)
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
