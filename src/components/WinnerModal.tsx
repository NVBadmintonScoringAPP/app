import { useState } from 'react';
import { Trophy, FileDown, CheckCircle2, Lock } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';

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
    return (
      <Dialog open={open} onClose={() => {}} className="max-w-md bg-black/95 border-zinc-800">
        <div className="flex flex-col items-center text-center p-2 select-none">
          <img
            src="/logo.png"
            alt="Национална Верига Бадминтон"
            className="h-10 sm:h-12 object-contain drop-shadow mb-1"
          />

          {/* Bulgarian Tricolor: Left-to-Right: White, Green (#6bc33a), Red (#e11e24) */}
          <div className="flex items-center justify-center gap-1.5 my-1" title="Български трикольор: Бяло, Зелено, Червено">
            <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <Trophy size={32} className="animate-bounce" />
          </div>

          <h2 className="text-xl font-black text-white">{t('gameFinishedTitle', { set: setScores.length + 1 })}</h2>
          <p className="mt-1 text-base font-extrabold text-emerald-400">{winnerName}</p>

          <div className="mt-3 flex items-center justify-center gap-2">
            {setScores.map((s, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-300"
              >
                {t('game')} {idx + 1}: {s.left}-{s.right}
              </span>
            ))}
            <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-black text-emerald-300">
              {scoreLeft} - {scoreRight}
            </span>
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg"
            onClick={onNextSet}
          >
            {t('nextGameBtn')} →
          </Button>
        </div>
      </Dialog>
    );
  }

  // CASE 2: MATCH OVER - STEP 1: Polite Prompt for Volunteer
  if (step === 'prompt') {
    return (
      <Dialog open={open} onClose={() => {}} className="max-w-md bg-black/95 border-zinc-800">
        <div className="flex flex-col items-center text-center p-3 space-y-4 select-none">
          <img
            src="/logo.png"
            alt="Национална Верига Бадминтон"
            className="h-12 sm:h-14 object-contain drop-shadow mb-1"
          />

          {/* Bulgarian Tricolor: Left-to-Right: White, Green (#6bc33a), Red (#e11e24) */}
          <div className="flex items-center justify-center gap-1.5 my-1" title="Български трикольор: Бяло, Зелено, Червено">
            <span className="h-1.5 w-7 rounded-full bg-white shadow-sm ring-1 ring-white/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#6bc33a] shadow-sm ring-1 ring-emerald-400/30" />
            <span className="h-1.5 w-7 rounded-full bg-[#e11e24] shadow-sm ring-1 ring-red-500/30" />
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/40 shadow-xl shadow-emerald-950/50">
            <Trophy size={36} className="text-amber-400" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white tracking-wide">
              {t('matchFinishedTitle')}
            </h2>
            <p className="text-base font-bold text-emerald-400">
              {winnerName} {lang === 'bg' ? 'печели срещата!' : 'wins the match!'}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-center">
            <p className="text-sm font-black text-amber-300 uppercase tracking-wide">
              📢 {lang === 'bg' ? 'Моля, покажете резултата на Главния съдия на турнира!' : 'Please present the result to the Head Referee!'}
            </p>
            <p className="text-xs text-zinc-300 mt-1">
              {lang === 'bg' ? 'Занесете таблета до съдийската маса за официално вписване в програмата.' : 'Bring the tablet to the referee desk for official scoresheet confirmation.'}
            </p>
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-950/60"
            onClick={() => setStep('locked_summary')}
          >
            {lang === 'bg' ? 'ОК · Към съдийската маса →' : 'OK · To Referee Desk →'}
          </Button>
        </div>
      </Dialog>
    );
  }

  // CASE 3: MATCH OVER - STEP 2: Locked Official Summary Screen for Head Referee
  return (
    <Dialog open={open} onClose={() => {}} className="max-w-lg bg-black/95 border-zinc-800">
      <div className="flex flex-col text-zinc-100 p-2 space-y-3.5 select-none">
        {/* Brand Banner */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NV" className="h-8 object-contain" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                {t('appTitle')}
              </div>
              <div className="text-xs font-black text-emerald-400">
                {lang === 'bg' ? 'Официален резултат на срещата' : 'Official Match Result'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase bg-zinc-800 text-amber-300 border border-zinc-700 px-2 py-0.5 rounded-lg">
            {t('courtNum', { court: courtNumber })}
          </span>
        </div>

        {eventCategory && (
          <div className="text-center text-xs font-bold text-zinc-400 uppercase tracking-wider -mt-1">
            {eventCategory}
          </div>
        )}

        {/* Big Official Scoreboard Card */}
        <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-950/90 p-4 shadow-xl">
          <div className="grid grid-cols-5 items-center gap-2 text-center">
            {/* Team 1 */}
            <div className="col-span-2 space-y-1">
              <div className="font-black text-sm sm:text-base text-zinc-100 leading-snug">
                {team1FullName}
              </div>
              {playerLeftClub && (
                <div className="text-[11px] font-black uppercase text-amber-400">
                  🏛️ {playerLeftClub}
                </div>
              )}
            </div>

            {/* Sets Score Big */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white bg-black px-3 py-1 rounded-xl border border-zinc-800">
                <span className={setsLeft > setsRight ? 'text-emerald-400' : 'text-zinc-400'}>
                  {setsLeft}
                </span>
                <span className="text-zinc-600 mx-1">:</span>
                <span className={setsRight > setsLeft ? 'text-red-400' : 'text-zinc-400'}>
                  {setsRight}
                </span>
              </div>
              <span className="text-[9px] font-black uppercase text-zinc-500 mt-1">
                {t('games')}
              </span>
            </div>

            {/* Team 2 */}
            <div className="col-span-2 space-y-1">
              <div className="font-black text-sm sm:text-base text-zinc-100 leading-snug">
                {team2FullName}
              </div>
              {playerRightClub && (
                <div className="text-[11px] font-black uppercase text-amber-400">
                  🏛️ {playerRightClub}
                </div>
              )}
            </div>
          </div>

          {/* Set scores detail badges */}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400">{t('points')}:</span>
            {allSets.map((s, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-black border border-zinc-800 px-2.5 py-1 text-xs font-black text-zinc-200"
              >
                {t('game')} {idx + 1}: <strong className="text-emerald-400">{s.left}</strong>-<strong className="text-red-400">{s.right}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Locked Referee Confirmation Section */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/20 p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Lock size={15} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-300">
                {lang === 'bg' ? 'Потвърждение от Главния съдия' : 'Head Referee Verification'}
              </div>
              <div className="text-[11px] text-zinc-400">
                {t('refereePinPrompt')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
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
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPinAndFinish()}
              />
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 h-10 shadow-md shrink-0"
                onClick={handleVerifyPinAndFinish}
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
                  className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-200 hover:bg-zinc-800 active:scale-95 transition-all"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional PDF download */}
        {onDownloadPdf && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-bold text-xs h-9"
            onClick={handleDownload}
          >
            {downloaded ? (
              <>
                <CheckCircle2 size={14} className="mr-1.5 text-emerald-400" />
                {lang === 'bg' ? 'PDF протоколът е свален!' : 'PDF Scoresheet downloaded!'}
              </>
            ) : (
              <>
                <FileDown size={14} className="mr-1.5 text-sky-400" />
                {t('downloadPdfScoresheet')}
              </>
            )}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
