import { useState, useEffect } from 'react';
import { Play, Globe } from 'lucide-react';
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
  initialMode?: 'tournament' | 'manual';
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

export function SetupModal({ open, initialMode, onClose, onStart }: SetupModalProps) {
  const { lang, isTranslationEnabled, setLanguage, t } = useI18n();
  const tournamentService = getTournamentService();
  const [setupMode, setSetupMode] = useState<'tournament' | 'manual'>(() => {
    if (initialMode) return initialMode;
    return tournamentService.getIsManualMode() ? 'manual' : 'tournament';
  });

  // Sync mode when modal opens
  useEffect(() => {
    if (open && initialMode) {
      setSetupMode(initialMode);
    }
  }, [open, initialMode]);

  const [playerLeft, setPlayerLeft] = useState('Player 1');
  const [playerRight, setPlayerRight] = useState('Player 2');
  const [leftPartner, setLeftPartner] = useState('');
  const [rightPartner, setRightPartner] = useState('');
  const [leftClub, setLeftClub] = useState('');
  const [leftPartnerClub, setLeftPartnerClub] = useState('');
  const [rightClub, setRightClub] = useState('');
  const [rightPartnerClub, setRightPartnerClub] = useState('');
  const [sameClubLeft, setSameClubLeft] = useState(true);
  const [sameClubRight, setSameClubRight] = useState(true);
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

    const finalLeftClub =
      gameType === 'doubles' && !sameClubLeft && leftPartnerClub.trim()
        ? `${leftClub.trim()} / ${leftPartnerClub.trim()}`
        : leftClub.trim();

    const finalRightClub =
      gameType === 'doubles' && !sameClubRight && rightPartnerClub.trim()
        ? `${rightClub.trim()} / ${rightPartnerClub.trim()}`
        : rightClub.trim();

    onStart({
      matchId: undefined,
      matchNumber: `Корт ${court || '1'}`,
      playerLeft: playerLeft || (lang === 'bg' ? 'Състезател 1' : 'Player 1'),
      playerRight: playerRight || (lang === 'bg' ? 'Състезател 2' : 'Player 2'),
      playerLeftPartner: gameType === 'doubles' ? leftPartner : '',
      playerRightPartner: gameType === 'doubles' ? rightPartner : '',
      playerLeftClub: finalLeftClub,
      playerRightClub: finalRightClub,
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
      'flex-1 rounded-xl border py-2 text-center text-xs font-black transition-all cursor-pointer',
      active
        ? 'border-[#6bc33a] bg-[#6bc33a] text-black shadow-md shadow-[#6bc33a]/25'
        : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700'
    );

  const customToggleClass = (active: boolean) =>
    cn(
      'flex-1 py-1 text-xs rounded-lg border font-black transition-all cursor-pointer text-center',
      active
        ? 'border-[#6bc33a] bg-[#6bc33a] text-black shadow-sm'
        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="w-[94vw] sm:w-[90vw] md:w-[500px] max-w-[520px] border-zinc-800 bg-black/95 backdrop-blur-2xl !p-3 sm:!p-3.5 max-h-[96vh] overflow-y-auto overflow-x-hidden flex flex-col justify-start shadow-2xl"
    >
      <div className="w-full flex flex-col items-center space-y-2 select-none">
        {/* Top Header Row: Back button (Left), Manual mode badge (Center), Language toggle (Right) */}
        <div className="w-full flex items-center justify-between z-20">
          <button
            type="button"
            onClick={onClose}
            className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-zinc-700 text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title={lang === 'bg' ? 'Обратно към начален екран' : 'Back to Welcome Screen'}
          >
            <span>←</span>
            <span>{lang === 'bg' ? 'Начало' : 'Back'}</span>
          </button>

          <div className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg border border-[#6bc33a]/30 bg-[#6bc33a]/10 text-[#6bc33a] text-[10px] font-black shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6bc33a] animate-pulse" />
            <span>{setupMode === 'tournament' ? 'Турнирен режим' : (lang === 'bg' ? 'Ръчен режим' : 'Manual Mode')}</span>
          </div>

          {isTranslationEnabled ? (
            <button
              type="button"
              onClick={() => setLanguage(lang === 'bg' ? 'en' : 'bg')}
              className="h-7 w-7 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
              title={lang === 'bg' ? 'Switch interface to English' : 'Превключи интерфейса на Български'}
            >
              <Globe size={14} className="text-zinc-400 hover:text-[#6bc33a]" />
            </button>
          ) : (
            <div className="h-7 w-7" />
          )}
        </div>

        {/* Brand Card: IDENTICAL to WelcomeSplash */}
        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-2 sm:p-2.5 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
          {/* Bulgarian Tricolor Top Accent Stripe: White -> Green -> Red */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-tricolor-horizontal" />

          {/* Official NV Logo */}
          <div className="w-full flex items-center justify-center pt-0.5">
            <img
              src="/logo.png"
              alt="Национална Верига Бадминтон"
              className="w-full max-h-[64px] sm:max-h-[74px] object-contain drop-shadow-2xl"
            />
          </div>

          {/* Official Subtitle inside card */}
          <div className="w-full pt-1 mt-0.5 border-t border-zinc-800/80">
            <h2 className="text-[10px] sm:text-[11px] font-black text-[#6bc33a] uppercase tracking-widest text-center">
              {t('appSubtitle')}
            </h2>
          </div>
        </div>

        {/* In Tournament Mode, render TournamentMatchSelector */}
        {setupMode === 'tournament' ? (
          <div className="w-full">
            <TournamentMatchSelector
              currentCourt={court}
              onSelectMatch={handleSelectTournamentMatch}
              onSwitchToManual={() => setSetupMode('manual')}
            />
          </div>
        ) : (
          /* PURE MANUAL ENTRY FORM - NO TOURNAMENT SOFTWARE TABS */
          <div className="w-full space-y-2 pt-0.5 text-left">
            {/* 1. Match Settings: Court, Discipline, Format */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-2.5 space-y-2 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-tricolor-horizontal" />

              {/* Court Number & Discipline in clean row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {lang === 'bg' ? 'Корт №' : 'Court #'}
                  </label>
                  <Input
                    value={court}
                    onChange={(e) => setCourt(e.target.value)}
                    placeholder="1"
                    className="h-8 text-xs bg-black/60 border-zinc-800 text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {lang === 'bg' ? 'Дисциплина' : 'Discipline'}
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className={toggleClass(gameType === 'singles')}
                      onClick={() => setGameType('singles')}
                    >
                      {lang === 'bg' ? 'Единично' : 'Singles'}
                    </button>
                    <button
                      type="button"
                      className={toggleClass(gameType === 'doubles')}
                      onClick={() => setGameType('doubles')}
                    >
                      {lang === 'bg' ? 'Двойки' : 'Doubles'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {lang === 'bg' ? 'Формат на геймовете' : 'Scoring Format'}
                </label>
                <div className="flex gap-1.5">
                  {(['3x21', '3x15', 'custom'] as MatchFormat[]).map((f) => (
                    <button
                      type="button"
                      key={f}
                      className={toggleClass(format === f)}
                      onClick={() => setFormat(f)}
                    >
                      {f === '3x21' ? '3 × 21' : f === '3x15' ? '3 × 15' : (lang === 'bg' ? 'Персонализиран' : 'Custom')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Format Options */}
              {format === 'custom' && (
                <div className="rounded-lg border border-[#6bc33a]/30 bg-black/50 p-2 space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6bc33a]">
                    {lang === 'bg' ? 'Параметри на формата' : 'Format parameters'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                        {lang === 'bg' ? 'Точки' : 'Points'}
                      </label>
                      <div className="flex gap-1">
                        {[11, 15, 21, 31].map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => {
                              setCustomPoints(pts);
                              setCustomCap(pts + (pts === 31 ? 4 : 9));
                            }}
                            className={customToggleClass(customPoints === pts)}
                          >
                            {pts}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                        {lang === 'bg' ? 'Геймове' : 'Games'}
                      </label>
                      <div className="flex gap-1">
                        {[1, 3].map((sets) => (
                          <button
                            key={sets}
                            type="button"
                            onClick={() => setCustomBestOf(sets)}
                            className={customToggleClass(customBestOf === sets)}
                          >
                            {sets}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                        {lang === 'bg' ? 'Таван (Cap)' : 'Cap'}
                      </label>
                      <Input
                        type="number"
                        value={customCap}
                        onChange={(e) => setCustomCap(Number(e.target.value))}
                        className="py-1 h-7 text-xs bg-black/60 border-zinc-800 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Team A (Player 1) & Team B (Player 2) - Sides determined upon coin toss! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Team A Card */}
              <div className="rounded-xl border border-[#6bc33a]/40 bg-zinc-950/90 p-2.5 space-y-1.5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#6bc33a]" />
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#6bc33a]">
                    {gameType === 'singles'
                      ? (lang === 'bg' ? 'Състезател 1' : 'Player 1')
                      : (lang === 'bg' ? 'Отбор А' : 'Team A')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#6bc33a]" />
                </div>

                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    {lang === 'bg' ? 'Име на състезател 1' : 'Player 1 Name'}
                  </label>
                  <Input
                    value={playerLeft}
                    onChange={(e) => setPlayerLeft(e.target.value)}
                    placeholder={lang === 'bg' ? 'Име на състезател 1' : 'Player 1 Name'}
                    className="h-8 text-xs bg-black/60 border-zinc-800 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    {lang === 'bg' ? 'Клуб на състезател 1' : 'Player 1 Club'}
                  </label>
                  <Input
                    value={leftClub}
                    onChange={(e) => setLeftClub(e.target.value)}
                    placeholder={lang === 'bg' ? 'Клуб / Град' : 'Club / City'}
                    className="h-8 text-xs bg-black/60 border-zinc-800 text-zinc-200"
                  />
                </div>

                {/* Doubles: Partner & Club logic */}
                {gameType === 'doubles' && (
                  <div className="pt-1 border-t border-zinc-800/80 space-y-1.5">
                    <div>
                      <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                        {lang === 'bg' ? 'Партньор 1 (Отбор А)' : 'Partner 1 (Team A)'}
                      </label>
                      <Input
                        value={leftPartner}
                        onChange={(e) => setLeftPartner(e.target.value)}
                        placeholder={lang === 'bg' ? 'Име на партньор' : 'Partner Name'}
                        className="h-8 text-xs bg-black/60 border-zinc-800 text-white font-bold"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 cursor-pointer pt-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={sameClubLeft}
                        onChange={(e) => setSameClubLeft(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-[#6bc33a] cursor-pointer"
                      />
                      <span>{lang === 'bg' ? 'И двамата са от един клуб' : 'Both from same club'}</span>
                    </label>

                    {!sameClubLeft && (
                      <div>
                        <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          {lang === 'bg' ? 'Клуб на партньор 1' : 'Partner 1 Club'}
                        </label>
                        <Input
                          value={leftPartnerClub}
                          onChange={(e) => setLeftPartnerClub(e.target.value)}
                          placeholder={lang === 'bg' ? 'Клуб на партньора' : 'Partner Club'}
                          className="h-8 text-xs bg-black/60 border-zinc-800 text-zinc-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Team B Card */}
              <div className="rounded-xl border border-[#e11e24]/40 bg-zinc-950/90 p-2.5 space-y-1.5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e11e24]" />
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#e11e24]">
                    {gameType === 'singles'
                      ? (lang === 'bg' ? 'Състезател 2' : 'Player 2')
                      : (lang === 'bg' ? 'Отбор Б' : 'Team B')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#e11e24]" />
                </div>

                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    {lang === 'bg' ? 'Име на състезател 2' : 'Player 2 Name'}
                  </label>
                  <Input
                    value={playerRight}
                    onChange={(e) => setPlayerRight(e.target.value)}
                    placeholder={lang === 'bg' ? 'Име на състезател 2' : 'Player 2 Name'}
                    className="h-8 text-xs bg-black/60 border-zinc-800 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    {lang === 'bg' ? 'Клуб на състезател 2' : 'Player 2 Club'}
                  </label>
                  <Input
                    value={rightClub}
                    onChange={(e) => setRightClub(e.target.value)}
                    placeholder={lang === 'bg' ? 'Клуб / Град' : 'Club / City'}
                    className="h-8 text-xs bg-black/60 border-zinc-800 text-zinc-200"
                  />
                </div>

                {/* Doubles: Partner & Club logic */}
                {gameType === 'doubles' && (
                  <div className="pt-1 border-t border-zinc-800/80 space-y-1.5">
                    <div>
                      <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                        {lang === 'bg' ? 'Партньор 2 (Отбор Б)' : 'Partner 2 (Team B)'}
                      </label>
                      <Input
                        value={rightPartner}
                        onChange={(e) => setRightPartner(e.target.value)}
                        placeholder={lang === 'bg' ? 'Име на партньор' : 'Partner Name'}
                        className="h-8 text-xs bg-black/60 border-zinc-800 text-white font-bold"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 cursor-pointer pt-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={sameClubRight}
                        onChange={(e) => setSameClubRight(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-[#6bc33a] cursor-pointer"
                      />
                      <span>{lang === 'bg' ? 'И двамата са от един клуб' : 'Both from same club'}</span>
                    </label>

                    {!sameClubRight && (
                      <div>
                        <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          {lang === 'bg' ? 'Клуб на партньор 2' : 'Partner 2 Club'}
                        </label>
                        <Input
                          value={rightPartnerClub}
                          onChange={(e) => setRightPartnerClub(e.target.value)}
                          placeholder={lang === 'bg' ? 'Клуб на партньора' : 'Partner Club'}
                          className="h-8 text-xs bg-black/60 border-zinc-800 text-zinc-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Action Button: Proceed to BWF Toss */}
            <div className="pt-1">
              <Button
                size="lg"
                className="w-full h-10 sm:h-11 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black text-xs sm:text-sm shadow-lg shadow-[#6bc33a]/25 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleStartManual}
              >
                <Play size={15} className="fill-black stroke-black" />
                <span>{lang === 'bg' ? 'Продължи към жребий (BWF Toss) →' : 'Proceed to Toss (BWF Toss) →'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
