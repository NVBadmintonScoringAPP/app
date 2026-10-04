import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, FileDown, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface WinnerModalProps {
  open: boolean;
  winnerName: string;
  playerLeft: string;
  playerRight: string;
  playerLeftPartner?: string;
  playerRightPartner?: string;
  playerLeftClub?: string;
  playerRightClub?: string;
  eventCategory?: string;
  courtNumber: string;
  scoreLeft: number;
  scoreRight: number;
  setsLeft: number;
  setsRight: number;
  isMatchOver: boolean;
  setScores: Array<{ left: number; right: number }>;
  adminPin: string;
  onNextSet: () => void;
  onConfirmMatchFinished: () => void;
  onDownloadPdf?: () => void;
}

export function WinnerModal({
  open,
  winnerName,
  playerLeft,
  playerRight,
  playerLeftPartner,
  playerRightPartner,
  playerLeftClub,
  playerRightClub,
  eventCategory,
  courtNumber,
  scoreLeft,
  scoreRight,
  setsLeft,
  setsRight,
  isMatchOver,
  setScores,
  adminPin,
  onNextSet,
  onConfirmMatchFinished,
  onDownloadPdf,
}: WinnerModalProps) {
  const { lang, t } = useI18n();
  const [step, setStep] = useState<'prompt' | 'locked_summary'>('prompt');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const team1FullName = playerLeft + (playerLeftPartner ? ` / ${playerLeftPartner}` : '');
  const team2FullName = playerRight + (playerRightPartner ? ` / ${playerRightPartner}` : '');

  // Build full sets summary
  const allSets = [...setScores, { left: scoreLeft, right: scoreRight }];

  const handleVerifyPinAndFinish = () => {
    if (enteredPin === adminPin) {
      setPinError('');
      setEnteredPin('');
      setStep('prompt');
      onConfirmMatchFinished();
    } else {
      setPinError(t('wrongPinError'));
      setEnteredPin('');
    }
  };

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 8) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setPinError('');
    if (next === adminPin) {
      setTimeout(() => {
        setPinError('');
        setEnteredPin('');
        setStep('prompt');
        onConfirmMatchFinished();
      }, 200);
    }
  };

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }
  };

  if (!open) return null;

  // CASE 1: End of a single GAME (not end of full match)
  if (!isMatchOver) {
    const isLeftWinner = scoreLeft > scoreRight;
    const currentSetNum = setScores.length + 1;

    return createPortal(
      <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none animate-fade-in">
        {/* Top Bulgarian Tricolor Stripe */}
        <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />

        {/* Scrollable centered content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center px-4 py-4 sm:py-6">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-3.5">
            
            {/* Header: Logo, Tricolor & Court Badge */}
            <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Национална Верига Бадминтон"
                  className="max-h-[38px] sm:max-h-[46px] object-contain drop-shadow"
                />
                <div className="text-left hidden xs:block">
                  <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    {t('appTitle')}
                  </div>
                  <div className="text-xs font-black text-[#6bc33a]">
                    {lang === 'bg' ? 'Официално съдийско табло' : 'Official Umpire Scoreboard'}
                  </div>
                </div>
              </div>

              {/* Court Badge */}
              <div className="flex items-center gap-1.5 rounded-xl border border-[#6bc33a]/40 bg-[#6bc33a]/10 px-2.5 py-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6bc33a]">{t('courtUpper')}</span>
                <span className="text-sm sm:text-base font-black text-white">{courtNumber}</span>
              </div>
            </div>

            {/* Bulgarian Tricolor Indicator */}
            <div className="flex items-center justify-center gap-1.5 -my-1">
              <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
              <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
              <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
            </div>

            {/* Set Status Banner */}
            <div className="flex items-center gap-2 rounded-full bg-[#6bc33a]/15 border border-[#6bc33a]/30 px-3.5 py-1 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#6bc33a] animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-[#6bc33a]">
                {t('gameFinishedTitle', { set: currentSetNum })}
              </span>
            </div>

            {/* Winner Announcement Card with Scoreboard Breakdown */}
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6bc33a] to-transparent" />

              <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                {lang === 'bg' ? 'Победител в гейма' : 'Game Winner'}
              </div>
              
              <div className="text-xl sm:text-2xl font-black text-white drop-shadow flex items-center justify-center gap-2">
                <span>🏸</span>
                <span className="text-[#6bc33a]">{winnerName}</span>
              </div>

              {/* Match Scoreboard Comparison for this set */}
              <div className="w-full mt-4 pt-3.5 border-t border-zinc-850 grid grid-cols-5 items-center gap-2">
                {/* Left Team */}
                <div className={cn(
                  "col-span-2 rounded-xl p-2.5 flex flex-col items-center transition-all",
                  isLeftWinner ? "bg-[#6bc33a]/10 border border-[#6bc33a]/40" : "bg-zinc-900/60 border border-zinc-800/80"
                )}>
                  <div className="text-xs font-black text-white truncate max-w-full">
                    {team1FullName}
                  </div>
                  {playerLeftClub && (
                    <div className="text-[10px] font-bold text-amber-400 truncate max-w-full mt-0.5">
                      🏛️ {playerLeftClub}
                    </div>
                  )}
                  <div className={cn(
                    "tabular font-black text-2xl sm:text-3xl mt-1.5",
                    isLeftWinner ? "text-[#6bc33a] drop-shadow-[0_2px_10px_rgba(107,195,58,0.3)]" : "text-zinc-400"
                  )}>
                    {scoreLeft}
                  </div>
                  {isLeftWinner && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#6bc33a] text-black mt-1">
                      {lang === 'bg' ? 'Победител' : 'Winner'}
                    </span>
                  )}
                </div>

                {/* Center Divider: Set Score */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {lang === 'bg' ? 'ГЕЙМОВЕ' : 'GAMES'}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white bg-black px-2.5 py-1 rounded-xl border border-zinc-800 my-1 shadow-inner">
                    <span className="text-[#6bc33a]">{setsLeft}</span>
                    <span className="text-zinc-600 mx-1">:</span>
                    <span className="text-[#e11e24]">{setsRight}</span>
                  </div>
                </div>

                {/* Right Team */}
                <div className={cn(
                  "col-span-2 rounded-xl p-2.5 flex flex-col items-center transition-all",
                  !isLeftWinner ? "bg-[#6bc33a]/10 border border-[#6bc33a]/40" : "bg-zinc-900/60 border border-zinc-800/80"
                )}>
                  <div className="text-xs font-black text-white truncate max-w-full">
                    {team2FullName}
                  </div>
                  {playerRightClub && (
                    <div className="text-[10px] font-bold text-amber-400 truncate max-w-full mt-0.5">
                      🏛️ {playerRightClub}
                    </div>
                  )}
                  <div className={cn(
                    "tabular font-black text-2xl sm:text-3xl mt-1.5",
                    !isLeftWinner ? "text-[#6bc33a] drop-shadow-[0_2px_10px_rgba(107,195,58,0.3)]" : "text-zinc-400"
                  )}>
                    {scoreRight}
                  </div>
                  {!isLeftWinner && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#6bc33a] text-black mt-1">
                      {lang === 'bg' ? 'Победител' : 'Winner'}
                    </span>
                  )}
                </div>
              </div>

              {/* Set scores pills history */}
              {setScores.length > 0 && (
                <div className="mt-3.5 pt-2.5 border-t border-zinc-850 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{t('points')}:</span>
                  {setScores.map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-black border border-zinc-800 px-2 py-0.5 text-[11px] font-black text-zinc-300"
                    >
                      {t('game')} {idx + 1}: {s.left}-{s.right}
                    </span>
                  ))}
                  <span className="rounded-lg bg-[#6bc33a]/15 border border-[#6bc33a]/40 px-2 py-0.5 text-[11px] font-black text-[#6bc33a]">
                    {t('game')} {currentSetNum}: {scoreLeft}-{scoreRight}
                  </span>
                </div>
              )}
            </div>

            {/* Next Game Button & BWF Interval Hint */}
            <div className="w-full pt-1">
              <Button
                variant="default"
                size="lg"
                className="w-full h-12 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black text-sm rounded-xl shadow-xl shadow-[#6bc33a]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                onClick={onNextSet}
              >
                <span>{t('nextGameBtn')}</span>
                <span>→</span>
              </Button>
              <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 mt-2">
                ⏱️ {lang === 'bg' ? 'Следва 120 сек. официална BWF почивка и размяна на полетата' : 'Followed by 120s official BWF break and side change'}
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Bulgarian Tricolor Stripe */}
        <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />
      </div>,
      document.body
    );
  }

  // CASE 2: MATCH OVER - STEP 1: Friendly Prompt to bring device to referee desk
  if (step === 'prompt') {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none animate-fade-in">
        {/* Top Bulgarian Tricolor Stripe */}
        <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />

        {/* Scrollable centered content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-md flex flex-col items-center text-center space-y-4">
            <img
              src="/logo.png"
              alt="Национална Верига Бадминтон"
              className="max-h-[50px] sm:max-h-[65px] object-contain drop-shadow mb-1"
            />

            {/* Bulgarian Tricolor Indicator */}
            <div className="flex items-center justify-center gap-1.5 my-1">
              <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
              <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
              <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6bc33a]/15 text-[#6bc33a] border-2 border-[#6bc33a]/40 shadow-xl shadow-[#6bc33a]/20">
              <Trophy size={34} className="text-[#6bc33a]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {t('matchFinishedTitle')}
              </h2>
              <p className="text-base sm:text-lg font-bold text-[#6bc33a]">
                {winnerName} {lang === 'bg' ? 'печели срещата!' : 'wins the match!'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#6bc33a]/30 bg-zinc-950 p-4 text-center shadow-lg">
              <p className="text-sm font-black text-[#6bc33a] uppercase tracking-wide">
                📢 {lang === 'bg' ? 'Моля, покажете резултата на Главния съдия!' : 'Please present the result to the Head Referee!'}
              </p>
              <p className="text-xs text-zinc-300 mt-1">
                {lang === 'bg' ? 'Занесете устройството до съдийската маса за официално вписване в програмата.' : 'Bring the device to the referee desk for official scoresheet confirmation.'}
              </p>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full h-12 bg-[#6bc33a] hover:bg-[#56be32] active:bg-[#439527] text-black font-black text-sm rounded-xl shadow-xl shadow-[#6bc33a]/25 transition-all cursor-pointer"
              onClick={() => setStep('locked_summary')}
            >
              {lang === 'bg' ? 'ОК · Към съдийската маса →' : 'OK · To Referee Desk →'}
            </Button>
          </div>
        </div>

        {/* Bottom Bulgarian Tricolor Stripe */}
        <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />
      </div>,
      document.body
    );
  }

  // CASE 3: MATCH OVER - STEP 2: Official Match Result Screen for Head Referee
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none animate-fade-in">
      {/* Top tricolor stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />

      {/* Scrollable centered content - adapts cleanly to both landscape and portrait */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center px-3 sm:px-5 py-3 sm:py-5">
        <div className="w-full max-w-4xl text-zinc-100 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          
          {/* Left Column: Match Details & Big Scoreboard */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Brand Header Banner */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="NV" className="h-8 object-contain" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    {t('appTitle')}
                  </div>
                  <div className="text-xs font-black text-[#6bc33a]">
                    {lang === 'bg' ? 'Официален резултат на срещата' : 'Official Match Result'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase bg-zinc-800 text-amber-300 border border-zinc-700 px-2.5 py-1 rounded-lg">
                {t('courtNum', { court: courtNumber })}
              </span>
            </div>

            {eventCategory && (
              <div className="text-center text-xs font-bold text-zinc-400 uppercase tracking-wider -mt-1">
                {eventCategory}
              </div>
            )}

            {/* Big Official Scoreboard Card */}
            <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4 shadow-xl flex flex-col justify-between">
              <div className="grid grid-cols-5 items-center gap-2 text-center">
                {/* Team 1 */}
                <div className="col-span-2 space-y-1">
                  <div className="font-black text-sm sm:text-base text-zinc-100 leading-snug truncate">
                    {team1FullName}
                  </div>
                  {playerLeftClub && (
                    <div className="text-[11px] font-black uppercase text-amber-400 truncate">
                      🏛️ {playerLeftClub}
                    </div>
                  )}
                </div>

                {/* Sets Score Big */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white bg-black px-3 py-1 rounded-xl border border-zinc-800 shadow-inner">
                    <span className={setsLeft > setsRight ? 'text-[#6bc33a]' : 'text-zinc-400'}>
                      {setsLeft}
                    </span>
                    <span className="text-zinc-600 mx-1">:</span>
                    <span className={setsRight > setsLeft ? 'text-[#e11e24]' : 'text-zinc-400'}>
                      {setsRight}
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-zinc-500 mt-1">
                    {t('games')}
                  </span>
                </div>

                {/* Team 2 */}
                <div className="col-span-2 space-y-1">
                  <div className="font-black text-sm sm:text-base text-zinc-100 leading-snug truncate">
                    {team2FullName}
                  </div>
                  {playerRightClub && (
                    <div className="text-[11px] font-black uppercase text-amber-400 truncate">
                      🏛️ {playerRightClub}
                    </div>
                  )}
                </div>
              </div>

              {/* Set scores detail badges */}
              <div className="mt-3.5 pt-3 border-t border-zinc-800 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-400">{t('points')}:</span>
                {allSets.map((s, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-black border border-zinc-800 px-2.5 py-1 text-xs font-black text-zinc-200"
                  >
                    {t('game')} {idx + 1}: <strong className="text-[#6bc33a]">{s.left}</strong>-<strong className="text-[#e11e24]">{s.right}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Referee Confirmation & PDF Export */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Locked Referee Confirmation Section */}
            <div className="flex-1 rounded-2xl border border-[#6bc33a]/30 bg-zinc-950 p-3.5 space-y-2.5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6bc33a]/15 text-[#6bc33a]">
                  <Lock size={15} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#6bc33a]">
                    {lang === 'bg' ? 'Потвърждение от Главния съдия' : 'Head Referee Verification'}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    {t('refereePinPrompt')}
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleVerifyPinAndFinish(); }} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="PIN (1234)"
                    maxLength={8}
                    className="text-center font-bold tracking-widest text-base h-10 bg-black border-zinc-700 text-white"
                  />
                  <Button
                    type="submit"
                    variant="default"
                    className="bg-[#6bc33a] hover:bg-[#56be32] text-black font-black text-xs px-4 h-10 shadow-md shrink-0 cursor-pointer"
                  >
                    {t('confirm')}
                  </Button>
                </div>

                {pinError && (
                  <p className="text-xs font-black text-red-400 text-center">{pinError}</p>
                )}

                {/* Quick Touch Keypad for tablet referees */}
                <div className="grid grid-cols-6 gap-1 pt-1 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (item === 'C') setEnteredPin('');
                        else if (item === '⌫') setEnteredPin((p) => p.slice(0, -1));
                        else handleDigit(item);
                      }}
                      className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-200 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Optional PDF download */}
            {onDownloadPdf && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-bold text-xs h-9 cursor-pointer"
                onClick={handleDownload}
              >
                {downloaded ? (
                  <>
                    <CheckCircle2 size={14} className="mr-1.5 text-[#6bc33a]" />
                    {lang === 'bg' ? 'PDF протоколът е свален!' : 'PDF Scoresheet downloaded!'}
                  </>
                ) : (
                  <>
                    <FileDown size={14} className="mr-1.5 text-[#6bc33a]" />
                    {t('downloadPdfScoresheet')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom tricolor stripe */}
      <div className="h-[3px] w-full bg-tricolor-horizontal shrink-0" />
    </div>,
    document.body
  );
}
