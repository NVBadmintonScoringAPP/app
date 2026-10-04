class BreakTimerAudioService {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  resumeOnUserAction(): void {
    this.getContext();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    startTime: number = 0,
    gain: number = 0.3
  ): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    const startAt = ctx.currentTime + startTime;
    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(gain, startAt + 0.01);
    gainNode.gain.linearRampToValueAtTime(gain, startAt + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startAt + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration);
  }

  play50SecondAlert(): void {
    this.playTone(880, 0.12, 'sine', 0, 0.4);
    this.playTone(880, 0.12, 'sine', 0.18, 0.4);
  }

  play60SecondSiren(): void {
    const cycleTime = 0.5;
    for (let i = 0; i < 3; i++) {
      this.playTone(600, 0.25, 'sawtooth', i * cycleTime, 0.3);
      this.playTone(900, 0.25, 'sawtooth', i * cycleTime + 0.25, 0.3);
    }
  }

  play120SecondSiren(): void {
    this.play60SecondSiren();
  }

  playPointSound(): void {
    this.playTone(660, 0.1, 'sine', 0, 0.25);
  }

  playSetWinSound(): void {
    this.playTone(523, 0.15, 'sine', 0, 0.3);
    this.playTone(659, 0.15, 'sine', 0.15, 0.3);
    this.playTone(784, 0.3, 'sine', 0.3, 0.3);
  }

  playMatchEndChime(): void {
    // Discrete, pleasant 2-tone chime for match end
    this.playTone(587.33, 0.18, 'sine', 0, 0.22); // D5
    this.playTone(880, 0.35, 'sine', 0.18, 0.25); // A5
  }
}

let audioInstance: BreakTimerAudioService | null = null;

export function getAudioService(): BreakTimerAudioService {
  if (!audioInstance) {
    audioInstance = new BreakTimerAudioService();
  }
  return audioInstance;
}
