import { ArrowLeftRight } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SideSwitchPromptProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onSkip: () => void;
}

export function SideSwitchPrompt({ open, message, onConfirm, onSkip }: SideSwitchPromptProps) {
  return (
    <Dialog open={open} onClose={onSkip} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <ArrowLeftRight size={48} className="text-amber-400" />
        <h2 className="mt-4 text-xl font-bold text-amber-400">Side Switch</h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="lg" onClick={onSkip}>
            Skip
          </Button>
          <Button variant="accent" size="lg" onClick={onConfirm}>
            Switch Sides
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
