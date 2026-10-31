/**
 * CyberSlash Web Audio Engine
 * Provides authentic synthwave arcade background tracks and responsive sound effects
 * using the Web Audio API with zero external audio assets or latency.
 */

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
}

export const TRACK_LIST: TrackInfo[] = [
  {
    id: 'neon-overdrive',
    title: 'Neon Overdrive',
    artist: 'AI Synthwave Core',
    genre: 'Cyber Synthwave',
    bpm: 128,
  },
  {
    id: 'cyber-slice-2099',
    title: 'Cyber Slice 2099',
    artist: 'Neural Grid Matrix',
    genre: 'Darksynth Electro',
    bpm: 138,
  },
  {
    id: 'starlight-blade',
    title: 'Starlight Blade',
    artist: 'Chroma Pulse',
    genre: 'Retrowave Chill',
    bpm: 112,
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Music state
  private isMusicPlaying = false;
  private currentTrackIndex = 0;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private sfxVolume = 0.8;
  private musicVolume = 0.5;

  // Listeners
  private listeners: (() => void)[] = [];

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- Sound Effects ---

  public playSwish(speed = 1.0) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      // Pitch sweeps down quickly like a blade slicing air
      const startFreq = Math.min(1200, 600 + speed * 250);
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime( startFreq * 1.2, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);
      filter.Q.setValueAtTime(2.5, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.14);

      // Noise component for whoosh
      this.playWhooshNoise(t, 0.1);
    } catch {
      // Audio fallback
    }
  }

  private playWhooshNoise(t: number, duration: number) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);
    filter.Q.setValueAtTime(1.8, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }

  public playSlice(fruitType: string) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

      const t = this.ctx.currentTime;

      // Base juicy squelch / slice pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      let baseFreq = 480;
      if (fruitType === 'watermelon') baseFreq = 340;
      else if (fruitType === 'strawberry') baseFreq = 720;
      else if (fruitType === 'pineapple') baseFreq = 420;
      else if (fruitType === 'dragonfruit') baseFreq = 620;
      else if (fruitType === 'golden_dragon') baseFreq = 880;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.8, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.16);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);

      // Splat burst noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2400, t);
      noiseFilter.Q.setValueAtTime(1.2, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.09);
    } catch {
      // Audio fallback
    }
  }

  public playCombo(comboCount: number) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      const count = Math.min(notes.length, comboCount);

      for (let i = 0; i < count; i++) {
        const noteTime = t + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[i], noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      }
    } catch {
      // Audio fallback
    }
  }

  public playBombFuse() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120 + Math.random() * 80, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Audio fallback
    }
  }

  public playBombExplosion() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const t = this.ctx.currentTime;

      // Heavy Sub Bass Blast
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.8);

      oscGain.gain.setValueAtTime(0.8, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.95);

      // Distorted Noise Shockwave
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 1.1);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 1.25);
    } catch {
      // Audio fallback
    }
  }

  public playGameOver() {
    try {
      this.initContext();
      const ctx = this.ctx;
      const sfxGain = this.sfxGain;
      if (!ctx || !sfxGain) return;

      const t = ctx.currentTime;
      const notes = [392, 349.23, 329.63, 261.63]; // G4, F4, E4, C4

      notes.forEach((freq, idx) => {
        const noteTime = t + idx * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });
    } catch {
      // Audio fallback
    }
  }

  public playButtonClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.04);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Audio fallback
    }
  }

  public playFrenzy() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.46);
    } catch {
      // Audio fallback
    }
  }

  // --- Background Music Sequencer ---

  public toggleMusic() {
    if (this.isMusicPlaying) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  public playMusic() {
    this.initContext();
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.scheduleMusicStep();
    this.notify();
  }

  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.notify();
  }

  public nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % TRACK_LIST.length;
    this.musicStep = 0;
    this.notify();
  }

  public prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + TRACK_LIST.length) % TRACK_LIST.length;
    this.musicStep = 0;
    this.notify();
  }

  public setTrack(index: number) {
    if (index >= 0 && index < TRACK_LIST.length) {
      this.currentTrackIndex = index;
      this.musicStep = 0;
      this.notify();
    }
  }

  public getCurrentTrack(): TrackInfo {
    return TRACK_LIST[this.currentTrackIndex];
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  private scheduleMusicStep() {
    if (!this.isMusicPlaying || !this.ctx) return;

    const track = TRACK_LIST[this.currentTrackIndex];
    const stepDurationSec = 60 / (track.bpm * 4); // 16th notes
    const now = this.ctx.currentTime;

    this.renderMusicStep(track.id, this.musicStep, now, stepDurationSec);

    this.musicStep = (this.musicStep + 1) % 64; // 4-bar loop

    this.musicTimer = window.setTimeout(() => {
      this.scheduleMusicStep();
    }, stepDurationSec * 1000);
  }

  private renderMusicStep(trackId: string, step: number, time: number, stepDuration: number) {
    if (!this.ctx || !this.musicGain || this.musicVolume <= 0.01) return;

    if (trackId === 'neon-overdrive') {
      this.renderNeonOverdrive(step, time, stepDuration);
    } else if (trackId === 'cyber-slice-2099') {
      this.renderCyberSlice(step, time, stepDuration);
    } else {
      this.renderStarlightBlade(step, time, stepDuration);
    }
  }

  // Track 1: Neon Overdrive (Synthwave - Am / F / C / G)
  private renderNeonOverdrive(step: number, t: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const bar = Math.floor(step / 16);
    const posInBar = step % 16;

    // Chord root: Am (bar 0), F (bar 1), C (bar 2), G (bar 3)
    const roots = [220, 174.61, 261.63, 196]; // A3, F3, C4, G3
    const bassFreq = roots[bar] / 2;

    // 1. Kick on 0, 4, 8, 12
    if (posInBar % 4 === 0) {
      this.playSynthKick(t);
    }

    // 2. Snare on 4, 12
    if (posInBar === 4 || posInBar === 12) {
      this.playSynthSnare(t);
    }

    // 3. Hi-hat on every off-beat (2, 6, 10, 14) and 16ths
    if (posInBar % 2 === 1) {
      this.playSynthHiHat(t, posInBar % 4 === 2 ? 0.09 : 0.04);
    }

    // 4. Rolling 16th note Synth Bass
    if (step % 2 === 0) {
      this.playSynthBass(bassFreq, t, dur * 1.5, 'sawtooth');
    } else {
      this.playSynthBass(bassFreq * 1.5, t, dur * 0.9, 'sawtooth');
    }

    // 5. Arpeggio lead
    const arpNotes = [
      [roots[bar], roots[bar] * 1.25, roots[bar] * 1.5, roots[bar] * 2],
      [roots[bar], roots[bar] * 1.2, roots[bar] * 1.5, roots[bar] * 1.8],
    ];
    const currentScale = arpNotes[bar % 2];
    const noteFreq = currentScale[posInBar % 4];

    if (posInBar % 2 === 0) {
      this.playSynthLead(noteFreq * 2, t, dur * 1.2);
    }
  }

  // Track 2: Cyber Slice 2099 (Darksynth Electro)
  private renderCyberSlice(step: number, t: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const bar = Math.floor(step / 16);
    const posInBar = step % 16;
    const darkRoots = [146.83, 146.83, 174.61, 130.81]; // D3, D3, F3, C3
    const root = darkRoots[bar];

    // Heavy Industrial Kick
    if (posInBar === 0 || posInBar === 6 || posInBar === 10 || posInBar === 14) {
      this.playSynthKick(t, 160);
    }

    // Snare clap on 4, 12
    if (posInBar === 4 || posInBar === 12) {
      this.playSynthSnare(t, true);
    }

    // Hi-hat groove
    if (posInBar % 2 === 0) {
      this.playSynthHiHat(t, 0.08);
    }

    // Heavy Reese Bass
    if (posInBar % 4 === 0) {
      this.playSynthBass(root / 2, t, dur * 3.5, 'square');
    }

    // Cyber Riff Lead
    const riffOffsets = [1, 1.2, 1.33, 1.5, 1.6, 1.88, 2];
    if (posInBar % 3 === 0 || posInBar === 7 || posInBar === 11) {
      const idx = (posInBar + bar * 2) % riffOffsets.length;
      this.playSynthLead(root * riffOffsets[idx], t, dur * 1.8, 'sawtooth');
    }
  }

  // Track 3: Starlight Blade (Melodic Retrowave Chill)
  private renderStarlightBlade(step: number, t: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const bar = Math.floor(step / 16);
    const posInBar = step % 16;
    const roots = [261.63, 220, 174.61, 196]; // C4, A3, F3, G3
    const root = roots[bar];

    // Relaxed Kick on 0, 8
    if (posInBar === 0 || posInBar === 8) {
      this.playSynthKick(t, 120);
    }

    // Soft Snare on 4, 12
    if (posInBar === 4 || posInBar === 12) {
      this.playSynthSnare(t, false);
    }

    // Soft open/closed hat
    if (posInBar % 4 === 2) {
      this.playSynthHiHat(t, 0.05);
    }

    // Warm FM style sub bass
    if (posInBar === 0 || posInBar === 6 || posInBar === 10) {
      this.playSynthBass(root / 2, t, dur * 3, 'triangle');
    }

    // Ethereal Bell Arpeggio
    const bellOffsets = [2, 2.5, 3, 3.75, 4];
    if (posInBar % 4 === 0 || posInBar === 6 || posInBar === 14) {
      const f = root * bellOffsets[(posInBar / 2) % bellOffsets.length];
      this.playSynthBell(f, t, dur * 4);
    }
  }

  // --- Drum & Synth Helper Generators ---

  private playSynthKick(t: number, startPitch = 140) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(startPitch, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  private playSynthSnare(t: number, clap = false) {
    if (!this.ctx || !this.musicGain) return;

    // Noise component
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = clap ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(clap ? 1800 : 900, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + 0.16);

    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);

    oscGain.gain.setValueAtTime(0.2, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  private playSynthHiHat(t: number, vol = 0.05) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + 0.04);
  }

  private playSynthBass(freq: number, t: number, dur: number, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + dur);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private playSynthLead(freq: number, t: number, dur: number, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.8, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private playSynthBell(freq: number, t: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

export const soundEngine = new SoundEngine();
