import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TournamentMatchSelector } from '@/components/TournamentMatchSelector';
import { getTournamentService } from '@/lib/tournamentService';
import { useI18n } from '@/lib/i18n';
import type { MatchFormat, GameType, ServingSide, CustomFormatConfig, TournamentMatch } from '@/types';

interface SetupModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (config: SetupConfig) => void;
}

export interface SetupConfig {
  matchId?: string;
  matchNumber: string;
  playerLeft: string;
  playerRight: string;
  playerLeftPartner: string;
  playerRightPartner: string;
  playerLeftClub?: string;
  playerRightClub?: string;
  courtNumber: string;
  format: MatchFormat;
  gameType: GameType;
  initialServer: ServingSide;
  customConfig?: CustomFormatConfig;
}

export function SetupModal({ open, onClose, onStart }: SetupModalProps) {
  const { lang, t } = useI18n();
  const tournamentService = getTournamentService();
  const [setupMode, setSetupMode] = useState<'tournament' | 'manual'>(() => {
    return tournamentService.getIsManualMode() ? 'manual' : 'tournament';
  });

  const [matchNumber, setMatchNumber] = useState('Match 1');
  const [playerLeft, setPlayerLeft] = useState('Player 1');
  const [playerRight, setPlayerRight] = useState('Player 2');
  const [leftPartner, setLeftPartner] = useState('');
  const [rightPartner, setRightPartner] = useState('');
  const [court, setCourt] = useState('1');
  const [format, setFormat] = useState<MatchFormat>('3x21');
  const [gameType, setGameType] = useState<GameType>('singles');

  // Custom configuration state
  const [customPoints, setCustomPoints] = useState<number>(21);
  const [customBestOf, setCustomBestOf] = useState<number>(3);
  const [customCap, setCustomCap] = useState<number>(30);

  const handleStartManual = () => {
    let customCfg: CustomFormatConfig | undefined;
    if (format === 'custom') {
      const half = Math.ceil(customPoints / 2);
      customCfg = {
        pointsToWin: customPoints,
        bestOf: customBestOf,
        capAt: customCap || customPoints + 9,
        sideSwitchAt: half,
        intervalAt: half,
        deuceMargin: 2,
      };
    }

    onStart({
      matchId: undefined,
      matchNumber: matchNumber || 'Match 1',
      playerLeft: playerLeft || 'Player 1',
      playerRight: playerRight || 'Player 2',
      playerLeftPartner: leftPartner,
      playerRightPartner: rightPartner,
      playerLeftClub: '',
      playerRightClub: '',
      courtNumber: court || '1',
      format,
      gameType,
      initialServer: 'left',
      customConfig: customCfg,
    });
  };

  const handleSelectTournamentMatch = (tm: TournamentMatch) => {
    onStart({
      matchId: tm.id,
      matchNumber: tm.eventCategory ? `${tm.matchNumber} · ${tm.eventCategory}` : tm.matchNumber,
      playerLeft: tm.team1Player1,
      playerRight: tm.team2Player1,
      playerLeftPartner: tm.team1Player2 || '',
      playerRightPartner: tm.team2Player2 || '',
      playerLeftClub: tm.team1Club || '',
      playerRightClub: tm.team2Club || '',
      courtNumber: tm.courtNumber,
      format: tm.format,
      gameType: tm.gameType,
      initialServer: 'left',
    });
  };

  const toggleClass = (active: boolean) =>
    cn(
      'flex-1 rounded-xl border py-2 text-center text-xs font-bold transition-all',
      active
        ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-md'
        : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title=""
      className="max-w-2xl max-h-[92vh] overflow-y-auto"
    >
      <div className="space-y-4">
        {/* Brand Header Banner with Official Logo */}
        <div className="flex flex-col items-center justify-center pt-0 pb-2 border-b border-slate-800/80 relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute left-0 top-1 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg"
              title={lang === 'bg' ? 'Обратно към начален екран' : 'Back to Welcome Screen'}
            >
              ← {lang === 'bg' ? 'Начален екран' : 'Welcome'}
            </button>
          )}
          <img
            src="/logo.png"
            alt="Национална Верига Бадминтон"
            className="h-12 sm:h-14 object-contain drop-shadow-md mb-1"
          />
          {/* Bulgarian Tricolor: Left-to-Right: White, Green (#6bc33a), Red (#e11e24) */}
          <div className="flex items-center justify-center gap-1.5 my-1" title="Български трикольор: Бяло, Зелено, Червено">
            <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
            {t('appSubtitle')}
          </span>
        </div>

        {/* Top Mode Tabs: Tournament Software vs Manual Fallback */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setSetupMode('tournament')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all',
              setupMode === 'tournament'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <span>🏆 Tournament Software</span>
            <span className="text-[10px] bg-black/60 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
              {lang === 'bg' ? 'Автоматичен' : 'Auto'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSetupMode('manual')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all',
              setupMode === 'manual'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <span>✍️ Ръчен режим</span>
            <span className="text-[10px] bg-slate-950/60 text-slate-300 px-1.5 py-0.5 rounded font-bold">
              Fallback
            </span>
          </button>
        </div>

        {setupMode === 'tournament' ? (
          <TournamentMatchSelector
            currentCourt={court}
            onSelectMatch={handleSelectTournamentMatch}
            onSwitchToManual={() => setSetupMode('manual')}
          />
        ) : (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Номер на мач
                </label>
                <Input
                  value={matchNumber}
                  onChange={(e) => setMatchNumber(e.target.value)}
                  placeholder="Match 1"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Корт №
                </label>
                <Input value={court} onChange={(e) => setCourt(e.target.value)} placeholder="1" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Дисциплина (Game Type)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={toggleClass(gameType === 'singles')}
                  onClick={() => setGameType('singles')}
                >
                  Единично (Singles)
                </button>
                <button
                  type="button"
                  className={toggleClass(gameType === 'doubles')}
                  onClick={() => setGameType('doubles')}
                >
                  Двойки (Doubles)
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Формат на точкуване (BWF Scoring Format)
              </label>
              <div className="flex gap-2">
                {(['3x21', '3x15', 'custom'] as MatchFormat[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    className={toggleClass(format === f)}
                    onClick={() => setFormat(f)}
                  >
                    {f === '3x21' ? 'BWF 3 × 21' : f === '3x15' ? 'BWF 3 × 15' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Configuration Section */}
            {format === 'custom' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Параметри на персонализирания формат
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Точки</label>
                    <div className="flex gap-1">
                      {[11, 15, 21, 31].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => {
                            setCustomPoints(pts);
                            setCustomCap(pts + (pts === 31 ? 4 : 9));
                          }}
                          className={cn(
                            'flex-1 py-1 text-xs rounded border font-bold',
                            customPoints === pts
                              ? 'border-amber-400 bg-amber-400 text-slate-950'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          )}
                        >
                          {pts}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Геймове</label>
                    <div className="flex gap-1">
                      {[1, 3].map((sets) => (
                        <button
                          key={sets}
                          type="button"
                          onClick={() => setCustomBestOf(sets)}
                          className={cn(
                            'flex-1 py-1 text-xs rounded border font-bold',
                            customBestOf === sets
                              ? 'border-amber-400 bg-amber-400 text-slate-950'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          )}
                        >
                          {sets}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Таван (Cap)</label>
                    <Input
                      type="number"
                      value={customCap}
                      onChange={(e) => setCustomCap(Number(e.target.value))}
                      className="py-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-sky-950/60 bg-sky-950/20 p-3">
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-sky-400">
                  {gameType === 'singles' ? 'Играч 1 (Player 1)' : 'Отбор 1 (Team 1)'}
                </label>
                <Input
                  value={playerLeft}
                  onChange={(e) => setPlayerLeft(e.target.value)}
                  placeholder="Име на състезател 1"
                />
                {gameType === 'doubles' && (
                  <Input
                    className="mt-2"
                    value={leftPartner}
                    onChange={(e) => setLeftPartner(e.target.value)}
                    placeholder="Партньор 1"
                  />
                )}
              </div>
              <div className="rounded-xl border border-emerald-950/60 bg-emerald-950/20 p-3">
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-emerald-400">
                  {gameType === 'singles' ? 'Играч 2 (Player 2)' : 'Отбор 2 (Team 2)'}
                </label>
                <Input
                  value={playerRight}
                  onChange={(e) => setPlayerRight(e.target.value)}
                  placeholder="Име на състезател 2"
                />
                {gameType === 'doubles' && (
                  <Input
                    className="mt-2"
                    value={rightPartner}
                    onChange={(e) => setRightPartner(e.target.value)}
                    placeholder="Партньор 2"
                  />
                )}
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              className="w-full text-slate-950 font-black mt-2 text-base shadow-lg"
              onClick={handleStartManual}
            >
              Продължи към жребий (BWF Toss) →
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
