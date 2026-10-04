import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { CardColor, ServingSide } from '@/types';

interface CardsModalProps {
  open: boolean;
  onClose: () => void;
  onIssue: (card: { cardColor: CardColor; side: ServingSide; playerName: string; reason: string }) => void;
  playerLeft: string;
  playerRight: string;
}

export function CardsModal({ open, onClose, onIssue, playerLeft, playerRight }: CardsModalProps) {
  const { lang, t } = useI18n();
  const [cardColor, setCardColor] = useState<CardColor>('yellow');
  const [side, setSide] = useState<ServingSide>('left');
  const [playerName, setPlayerName] = useState('');
  const [reason, setReason] = useState('');

  const cards: { color: CardColor; label: string; bg: string }[] = [
    {
      color: 'yellow',
      label: t('yellowCard'),
      bg: 'bg-amber-400 text-black',
    },
    {
      color: 'red',
      label: t('redCard'),
      bg: 'bg-red-600 text-white',
    },
    {
      color: 'black',
      label: t('blackCard'),
      bg: 'bg-black text-white border-2 border-red-500/80',
    },
  ];

  const handleIssue = () => {
    onIssue({
      cardColor,
      side,
      playerName: playerName || (side === 'left' ? playerLeft : playerRight),
      reason: reason || (lang === 'bg' ? 'Без посочена причина' : 'No reason given'),
    });
    setReason('');
    setPlayerName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('cardsModalTitle')} className="max-w-md bg-black/95 border-zinc-800">
      <div className="space-y-4 select-none">
        <p className="text-xs text-zinc-400 -mt-2">
          {t('cardsModalSubtitle')}
        </p>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
            {lang === 'bg' ? 'Вид картон:' : 'Card Type:'}
          </label>
          <div className="space-y-2">
            {cards.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => setCardColor(c.color)}
                className={cn(
                  'w-full rounded-xl py-3 px-3 text-sm font-black transition-all shadow-md',
                  c.bg,
                  cardColor === c.color ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-[1.01]' : 'opacity-60'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
            {lang === 'bg' ? 'Отбор / Страна:' : 'Team / Side:'}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                'flex-1 rounded-xl border-2 py-2.5 text-xs font-bold transition-all',
                side === 'left'
                  ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500/40'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
              )}
              onClick={() => setSide('left')}
            >
              {t('teamA')} ({t('leftSide')})
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 rounded-xl border-2 py-2.5 text-xs font-bold transition-all',
                side === 'right'
                  ? 'border-red-500 bg-red-950/60 text-white ring-1 ring-red-500/40'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
              )}
              onClick={() => setSide('right')}
            >
              {t('teamB')} ({t('rightSide')})
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400">
            {t('selectPlayer')}
          </label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={side === 'left' ? playerLeft : playerRight}
            className="bg-black border-zinc-700 text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400">
            {t('cardReason')}
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={lang === 'bg' ? 'Причина за санкцията (напр. неспортсменско поведение)' : 'Reason for card (e.g. misconduct)'}
            className="bg-black border-zinc-700 text-white"
          />
        </div>

        <Button
          variant="destructive"
          size="lg"
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-sm h-12 shadow-lg"
          onClick={handleIssue}
        >
          {t('applyCardBtn')}
        </Button>
      </div>
    </Dialog>
  );
}
