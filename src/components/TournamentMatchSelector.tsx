import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Check,
  ArrowRight,
  Globe,
  AlertCircle,
  Info,
  MapPin,
  Building,
  Trophy,
  Calendar,
  Users,
  Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTournamentService } from '@/lib/tournamentService';
import { useI18n } from '@/lib/i18n';
import type { TournamentMatch } from '@/types';

interface TournamentMatchSelectorProps {
  currentCourt: string;
  onSelectMatch: (match: TournamentMatch) => void;
  onSwitchToManual: () => void;
}

function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function TournamentMatchSelector({
  currentCourt: _currentCourt,
  onSelectMatch,
  onSwitchToManual,
}: TournamentMatchSelectorProps) {
  const { lang, t } = useI18n();
  const tournamentService = getTournamentService();
  const [activeTab, setActiveTab] = useState<'byTime' | 'search' | 'url'>('byTime');
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = tournamentService.getUniqueDays();
    return days.some((d) => d.key === localToday()) ? localToday() : 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tournamentUrl, setTournamentUrl] = useState(tournamentService.getTournamentUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [syncOk, setSyncOk] = useState(false);
  const [pasteHtml, setPasteHtml] = useState('');
  const [showPasteHtml, setShowPasteHtml] = useState(false);
  const [showTournamentDetails, setShowTournamentDetails] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    return tournamentService.subscribe(() => {
      setTournamentUrl(tournamentService.getTournamentUrl());
      setTick((t) => t + 1);
    });
  }, [tournamentService]);

  // Match currently waiting for the operator to choose the court
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [pickedCourt, setPickedCourt] = useState<string>('');

  const info = tournamentService.getTournamentInfo();
  const tournamentName = tournamentService.getTournamentName();
  const uniqueDays = tournamentService.getUniqueDays();
  const availableCourts = tournamentService.getUniqueCourtsAndLocations();
  const grandTotalCount = tournamentService.getAvailableMatches('all').length;

  // Matches are listed by time of play (already ordered chronologically by the scraper)
  const dayMatches = tournamentService.getAvailableMatches('all', selectedDay);
  const searchResults = tournamentService.searchMatches(
    searchQuery,
    selectedCategory === 'all' ? undefined : selectedCategory,
    selectedDay
  );

  const timeGroups: { key: string; time: string; items: TournamentMatch[] }[] = [];
  for (const m of dayMatches) {
    const key = `${m.matchDate || ''}|${m.scheduledTime || ''}`;
    const last = timeGroups[timeGroups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else timeGroups.push({ key, time: m.scheduledTime || '', items: [m] });
  }

  const handleSyncUrl = async () => {
    if (!tournamentUrl.trim()) {
      setSyncOk(false);
      setSyncStatusMsg('Въведете линк към турнира.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('');
    const res = await tournamentService.syncWithTournamentUrl(tournamentUrl.trim());
    setIsSyncing(false);
    setSyncOk(res.success);
    setSyncStatusMsg(
      res.success
        ? `Извлечени ${res.count} срещи за всички дни на „${res.name || 'турнира'}“.`
        : `Грешка: ${res.error || 'Неуспешно извличане'}`
    );
  };

  const handleImportHtml = () => {
    if (!pasteHtml.trim()) return;
    const res = tournamentService.parseAndImportHtml(pasteHtml);
    setSyncOk(res.success);
    if (res.success) {
      setSyncStatusMsg(`Успешно разчетени ${res.count} срещи от поставения код.`);
      setPasteHtml('');
      setShowPasteHtml(false);
    } else {
      setSyncStatusMsg('Не бяха разпознати срещи в предоставения код.');
    }
  };

  const startPicking = (m: TournamentMatch) => {
    setPickingId(m.id);
    setPickedCourt(m.courtNumber || '');
  };

  const confirmCourt = (m: TournamentMatch) => {
    if (!pickedCourt) return;
    const court = availableCourts.find((c) => c.courtNumber === pickedCourt);
    const location = court?.location || m.location || '';
    tournamentService.setAssignedCourt(pickedCourt);
    if (location) tournamentService.setAssignedLocation(location);
    setPickingId(null);
    onSelectMatch({ ...m, courtNumber: pickedCourt, location });
  };

  const renderDisciplineBadge = (m: TournamentMatch) => {
    if (m.discipline === 'mixed') {
      return (
        <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
          👫 {m.disciplineLabel || 'Смесени двойки'}
        </span>
      );
    }
    if (m.discipline === 'doubles' || m.gameType === 'doubles') {
      return (
        <span className="text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
          👥 {m.disciplineLabel || 'Двойки'}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
        🏸 {m.disciplineLabel || 'Единично'}
      </span>
    );
  };

  const clubChip = (club?: string, tone: 'green' | 'red' = 'green') =>
    club ? (
      <span
        className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded border',
          tone === 'green'
            ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30'
            : 'text-red-300 bg-red-950/60 border-red-500/30'
        )}
      >
        🏛️ {club}
      </span>
    ) : null;

  const renderCourtPicker = (m: TournamentMatch) => (
    <div className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-2.5 space-y-2">
      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
        На кой корт се играе тази среща?
        {m.courtNumber && (
          <span className="ml-1.5 normal-case font-semibold text-slate-400">
            (по програма: {m.location ? `${m.location} · ` : ''}Корт {m.courtNumber})
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {availableCourts.map((c) => {
          const selected = pickedCourt === c.courtNumber;
          return (
            <button
              key={`${c.location}-${c.courtNumber}`}
              type="button"
              onClick={() => setPickedCourt(c.courtNumber)}
              className={cn(
                'py-1.5 px-3 rounded-xl border text-xs font-black transition-all',
                selected
                  ? 'border-emerald-400 bg-emerald-600 text-white shadow-md'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              )}
            >
              Корт {c.courtNumber}
              {c.location && availableCourts.some((o) => o.location !== c.location) && (
                <span className="ml-1 font-medium text-[10px] opacity-80">· {c.location}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!pickedCourt}
          onClick={() => confirmCourt(m)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs"
        >
          {pickedCourt ? `Започни отброяване · Корт ${pickedCourt}` : 'Изберете корт'}
          <ArrowRight size={13} className="ml-1" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPickingId(null)} className="text-xs text-slate-400">
          Отказ
        </Button>
      </div>
    </div>
  );

  const renderMatchCard = (m: TournamentMatch) => {
    const isDoubles = m.gameType === 'doubles' || !!m.team1Player2;
    const picking = pickingId === m.id;

    return (
      <div
        key={m.id}
        className={cn(
          'rounded-xl border p-3 transition-all shadow-sm',
          m.isPlaceholder ? 'border-amber-500/40 bg-amber-950/15' : 'border-slate-800 bg-slate-900/80 hover:border-emerald-500/60'
        )}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black bg-slate-800 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Clock size={11} />
                {m.scheduledTime || 'час не е обявен'}
              </span>
              {renderDisciplineBadge(m)}
              {m.matchDayLabel && (
                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  📅 {m.matchDayLabel}
                </span>
              )}
              {m.courtNumber && (
                <span className="text-[10px] font-bold bg-slate-800 text-sky-300 px-2 py-0.5 rounded">
                  по програма: Корт {m.courtNumber}
                </span>
              )}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {m.eventCategory}
              {m.round ? ` · ${m.round}` : ''}
            </div>

            {m.isPlaceholder && (
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                <AlertCircle size={15} className="shrink-0 text-amber-400" />
                <span>⏳ Очаква класиране от групите – състезателите още не са определени</span>
              </div>
            )}

            {isDoubles ? (
              <div className="space-y-1">
                {[
                  { label: 'Отбор 1', p1: m.team1Player1, p2: m.team1Player2, club: m.team1Club, tone: 'green' as const },
                  { label: 'Отбор 2', p1: m.team2Player1, p2: m.team2Player2, club: m.team2Club, tone: 'red' as const },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-100 flex-wrap">
                    <span
                      className={cn(
                        'text-[9px] uppercase font-black px-1.5 py-0.5 rounded border',
                        t.tone === 'green'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-950 text-red-400 border-red-500/30'
                      )}
                    >
                      {t.label}
                    </span>
                    <span>{t.p1}</span>
                    {t.p2 && <span className={t.tone === 'green' ? 'text-emerald-300' : 'text-red-300'}>& {t.p2}</span>}
                    {clubChip(t.club, t.tone)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-100 flex-wrap">
                <span>{m.team1Player1}</span>
                {clubChip(m.team1Club, 'green')}
                <span className="text-slate-500 font-normal text-xs mx-1">vs</span>
                <span>{m.team2Player1}</span>
                {clubChip(m.team2Club, 'red')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
            {m.isPlaceholder ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncUrl}
                disabled={isSyncing}
                className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/50 font-bold"
              >
                <RefreshCw size={12} className={cn('mr-1', isSyncing && 'animate-spin')} />
                Обнови
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => (picking ? setPickingId(null) : startPicking(m))}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm"
              >
                {picking ? 'Затвори' : 'Избери мач'}
                {!picking && <ArrowRight size={13} className="ml-1" />}
              </Button>
            )}
          </div>
        </div>

        {picking && !m.isPlaceholder && renderCourtPicker(m)}
      </div>
    );
  };

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center',
      active
        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/50'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
    );

  const dayButton = (key: string, label: string, count: number) => {
    const selected = selectedDay === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSelectedDay(key)}
        className={cn(
          'py-1.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5',
          selected
            ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
        )}
      >
        <span>{key === 'all' ? label : `📅 ${label}`}</span>
        <span
          className={cn(
            'text-[10px] px-1.5 rounded-full font-bold',
            selected ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
          )}
        >
          {count}
        </span>
      </button>
    );
  };

  const detailRow = (label: string, value?: string | number | null) =>
    value || value === 0 ? (
      <div>
        <span className="text-slate-400 font-bold block">{label}</span>
        <span className="text-white font-bold break-words">{value}</span>
      </div>
    ) : null;

  return (
    <div className="space-y-4 text-zinc-100 select-none">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 pb-1 gap-1">
        <button type="button" onClick={() => setActiveTab('byTime')} className={tabClass(activeTab === 'byTime')}>
          🕒 {t('tabByTime')}
        </button>
        <button type="button" onClick={() => setActiveTab('search')} className={tabClass(activeTab === 'search')}>
          🔍 {t('search')}
        </button>
        <button type="button" onClick={() => setActiveTab('url')} className={tabClass(activeTab === 'url')}>
          🌐 {t('adminTabTournament')}
        </button>
      </div>

      {/* Bulgarian tricolor: white, green (#6bc33a), red (#e11e24) */}
      <div className="w-full h-[3px] rounded-full bg-tricolor-horizontal" />

      {/* Tournament banner - full title, never truncated */}
      <div className="rounded-xl border border-emerald-500/40 bg-zinc-950/90 p-3 space-y-2 text-xs shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-zinc-800/80 pb-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('tournamentSoftware')}
            </div>
            <div className="font-extrabold text-white text-sm mt-0.5 break-words">
              {tournamentName ? `🏆 ${tournamentName}` : (lang === 'bg' ? 'Няма зареден турнир – въведете линк в таб „Турнирен линк“' : 'No tournament loaded - enter link in Tournament tab')}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {info && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTournamentDetails(!showTournamentDetails)}
                className="h-8 text-xs border-zinc-700 bg-zinc-800/80 text-zinc-200 font-bold"
              >
                <Info size={13} className="mr-1 text-sky-400" />
                {showTournamentDetails ? (lang === 'bg' ? 'Скрий' : 'Hide') : (lang === 'bg' ? 'Информация' : 'Info')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncUrl}
              disabled={isSyncing || !tournamentUrl}
              className="h-8 text-xs border-emerald-500/50 text-emerald-300 hover:bg-emerald-950 font-bold"
              title={lang === 'bg' ? 'Презареди програмата от Tournament Software' : 'Reload schedule from Tournament Software'}
            >
              <RefreshCw size={12} className={cn('mr-1.5', isSyncing && 'animate-spin')} />
              {isSyncing ? t('refreshingBtn') : t('refreshBtn')}
            </Button>
          </div>
        </div>

        {info && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-300">
            {info.hallNames.length > 0 && (
              <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Building size={11} />
                {info.hallNames.join(', ')}
              </span>
            )}
            {info.location && (
              <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                <MapPin size={11} className="text-amber-400" />
                {info.location}
              </span>
            )}
            {info.dates && (
              <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Calendar size={11} className="text-sky-400" />
                {info.dates}
              </span>
            )}
            <span className="bg-slate-800 border border-slate-700 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
              <Trophy size={11} />
              {grandTotalCount} предстоящи срещи
            </span>
            <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Users size={11} className="text-purple-400" />
              {info.totalPlayers} състезатели · {info.totalClubs} клуба
            </span>
          </div>
        )}

        {info && showTournamentDetails && (
          <div className="mt-2 p-3 rounded-xl border border-sky-500/30 bg-sky-950/15 space-y-3 text-[11px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {detailRow('🏆 Турнир', info.name)}
              {detailRow('🏛️ Организатор', info.organization)}
              {detailRow('📍 Локация', info.location)}
              {detailRow('📅 Период', info.dates)}
              {detailRow(`🏟️ Зали (${info.totalHalls})`, info.hallNames.join(', '))}
              {detailRow('🥅 Кортове в програмата', info.totalCourts)}
              {detailRow('🏸 Дисциплини', info.disciplines.join(' · '))}
              {detailRow('⏳ Кръгове / групи', info.rounds.join(' · '))}
              {detailRow('👥 Състезатели', info.totalPlayers)}
              {detailRow('📋 Общо срещи', `${info.totalMatches} (изиграни: ${info.finishedMatches}, очакват състезатели: ${info.placeholderMatches})`)}
            </div>
            {info.days.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold block">📅 Дни</span>
                <span className="text-white font-bold">{info.days.map((d) => `${d.label} – ${d.count} срещи`).join(' · ')}</span>
              </div>
            )}
            {info.clubNames.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold block">🏛️ Клубове ({info.clubNames.length})</span>
                <span className="text-slate-200">{info.clubNames.join(' · ')}</span>
              </div>
            )}
            <div
              className={cn(
                'rounded-lg border p-2 space-y-1',
                info.warnings.length === 0
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
              )}
            >
              <div className="font-black uppercase tracking-wider text-[10px]">
                {info.warnings.length === 0 ? '✔ Проверката на данните не откри проблеми' : '⚠ Проверка на данните'}
              </div>
              {info.warnings.map((w, i) => (
                <div key={i}>• {w}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Day filter */}
      {uniqueDays.length > 0 && activeTab !== 'url' && (
        <div className="flex flex-wrap gap-1.5">
          {dayButton('all', 'Всички дни', grandTotalCount)}
          {uniqueDays.map((d) => dayButton(d.key, d.label, d.count))}
        </div>
      )}

      {/* TAB 1: by time */}
      {activeTab === 'byTime' && (
        <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
          {timeGroups.length > 0 ? (
            timeGroups.map((g) => (
              <div key={g.key} className="space-y-2">
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-slate-950/95 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
                  <Clock size={13} />
                  {g.time || 'Час не е обявен'}
                  <span className="text-[10px] text-slate-500 font-semibold normal-case">{g.items.length} срещи</span>
                  <span className="flex-1 h-px bg-slate-800" />
                </div>
                {g.items.map(renderMatchCard)}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              {grandTotalCount === 0
                ? 'Няма заредена програма. Въведете линк към турнира в таб „Турнирен линк“.'
                : 'Няма предстоящи срещи за избрания ден.'}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: search */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търси по състезател, клуб или номер на среща..."
                className="pl-9 h-9 text-xs"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200"
            >
              <option value="all">Всички дисциплини</option>
              <option value="singles">🏸 Единично</option>
              <option value="doubles">👥 Двойки (мъже / жени)</option>
              <option value="mixed">👫 Смесени двойки</option>
            </select>
          </div>
          <div className="space-y-2.5 max-h-[22rem] overflow-y-auto pr-1">
            {searchResults.length > 0 ? (
              searchResults.map(renderMatchCard)
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                Няма срещи по зададените критерии.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: tournament link */}
      {activeTab === 'url' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2.5">
            <Globe size={16} />
            Общ линк към турнира
          </div>
          <p className="text-xs text-slate-300">
            Поставете общия линк на турнира от Tournament Software. Приложението извлича наименование, дати, всички дни,
            часове, дисциплини, кръгове, зали, състезатели и клубове. Липсващи данни остават празни.
          </p>
          <Input
            value={tournamentUrl}
            onChange={(e) => setTournamentUrl(e.target.value)}
            placeholder="https://www.tournamentsoftware.com/tournament/..."
            className="text-xs font-mono h-10 border-slate-700 bg-slate-950 text-white"
          />
          <Button
            size="lg"
            onClick={handleSyncUrl}
            disabled={isSyncing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950/60"
          >
            <RefreshCw size={15} className={cn('mr-2', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Извличане на всички дни...' : 'Извлечи турнира'}
          </Button>

          {syncStatusMsg && (
            <div
              className={cn(
                'flex items-start gap-1.5 text-xs font-bold p-2.5 rounded-xl border bg-slate-950',
                syncOk ? 'text-emerald-300 border-emerald-500/30' : 'text-red-300 border-red-500/30'
              )}
            >
              {syncOk ? <Check size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
              <span>{syncStatusMsg}</span>
            </div>
          )}
          {syncOk && (
            <Button size="sm" onClick={() => setActiveTab('byTime')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs">
              Към програмата по часове →
            </Button>
          )}

          <div className="border-t border-slate-800/80 pt-2">
            <button
              type="button"
              onClick={() => setShowPasteHtml(!showPasteHtml)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-200 underline"
            >
              {showPasteHtml ? '▼ Скрий полето' : '▶ Или постави HTML код на страницата с мачовете (резервен вариант)'}
            </button>
            {showPasteHtml && (
              <div className="mt-2 space-y-2">
                <textarea
                  rows={4}
                  value={pasteHtml}
                  onChange={(e) => setPasteHtml(e.target.value)}
                  placeholder="Поставете HTML кода тук..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImportHtml}
                  disabled={!pasteHtml.trim()}
                  className="w-full border-slate-700 text-xs font-bold"
                >
                  Разчети срещите
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">Липсва интернет или турнирен график?</span>
        <button
          type="button"
          onClick={onSwitchToManual}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 underline transition-colors"
        >
          Ръчно въвеждане →
        </button>
      </div>
    </div>
  );
}
