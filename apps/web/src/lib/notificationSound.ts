let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

function playChimeNote(
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  duration: number,
  volume = 0.14,
) {
  const oscillator = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3600, startTime);
  filter.Q.setValueAtTime(0.8, startTime);

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(frequency * 2.01, startTime);

  const attack = 0.018;
  const release = duration;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + release);

  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0.0001, startTime);
  harmonicGain.gain.exponentialRampToValueAtTime(volume * 0.22, startTime + attack);
  harmonicGain.gain.exponentialRampToValueAtTime(0.0001, startTime + release * 0.85);

  oscillator.connect(filter);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  harmonic.start(startTime);
  oscillator.stop(startTime + release + 0.08);
  harmonic.stop(startTime + release + 0.08);
}

function playSuccessChime(ctx: AudioContext) {
  const t = ctx.currentTime + 0.02;
  // Bright major arpeggio — desk-bell / payment-success style.
  const notes = [
    { freq: 783.99, delay: 0, duration: 0.55, volume: 0.13 }, // G5
    { freq: 987.77, delay: 0.1, duration: 0.5, volume: 0.12 }, // B5
    { freq: 1174.66, delay: 0.2, duration: 0.72, volume: 0.11 }, // D6
    { freq: 1567.98, delay: 0.34, duration: 0.85, volume: 0.09 }, // G6
  ];

  notes.forEach(({ freq, delay, duration, volume }) => {
    playChimeNote(ctx, t + delay, freq, duration, volume);
  });
}

function playErrorTone(ctx: AudioContext) {
  const t = ctx.currentTime + 0.02;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(520, t);
  filter.Q.setValueAtTime(1.2, t);

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(440, t);
  oscillator.frequency.exponentialRampToValueAtTime(349.23, t + 0.28);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(t);
  oscillator.stop(t + 0.5);

  playChimeNote(ctx, t + 0.14, 293.66, 0.38, 0.06);
}

export function playNotificationSound(type: 'success' | 'error') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'success') {
      playSuccessChime(ctx);
      return;
    }

    playErrorTone(ctx);
  } catch {
    // Audio may be blocked until user interaction.
  }
}
