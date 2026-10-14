class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOscillators: (OscillatorNode | GainNode)[] = [];
  private isMusicPlaying = false;
  private masterEnabled = true;
  private sfxVol = 0.8;
  private musicVol = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.masterEnabled ? this.sfxVol : 0, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.masterEnabled ? this.musicVol : 0, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateConfig(master: boolean, sfxVol: number, musicEnabled: boolean) {
    this.masterEnabled = master;
    this.sfxVol = sfxVol;
    if (this.ctx && this.sfxGain && this.musicGain) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.setValueAtTime(master ? sfxVol : 0, now);
      this.musicGain.gain.setValueAtTime(master && musicEnabled ? this.musicVol : 0, now);
    }
    if (master && musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    } else if ((!master || !musicEnabled) && this.isMusicPlaying) {
      this.stopMusic();
    }
  }

  public playButton() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
      gain.gain.setValueAtTime(0.25 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio safety
    }
  }

  public playBabyCry() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Comical baby "waaaah-waaaah" pitch slide
      [0, 0.35, 0.7].forEach((delay, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + delay;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400 - idx * 20, start);
        osc.frequency.linearRampToValueAtTime(550, start + 0.12);
        osc.frequency.linearRampToValueAtTime(320, start + 0.3);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.3 * this.sfxVol, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(start);
        osc.stop(start + 0.33);
      });
    } catch {
      // Audio safety
    }
  }

  public playCoin() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [987.77, 1318.51, 1567.98]; // B5, E6, G6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.04;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3 * this.sfxVol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(startTime);
        osc.stop(startTime + 0.13);
      });
    } catch {
      // Audio safety
    }
  }

  public playKey() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.25);
      gain.gain.setValueAtTime(0.35 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio safety
    }
  }

  public playFlee() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Sci-fi warp woosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);

      gain.gain.setValueAtTime(0.3 * this.sfxVol, now);
      gain.gain.linearRampToValueAtTime(0.4 * this.sfxVol, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio safety
    }
  }

  public playFakeExit() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Comic trombone 'wah-wah' pitch slide
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.15);
      osc.frequency.linearRampToValueAtTime(160, now + 0.35);
      osc.frequency.linearRampToValueAtTime(110, now + 0.55);

      gain.gain.setValueAtTime(0.35 * this.sfxVol, now);
      gain.gain.setValueAtTime(0.3 * this.sfxVol, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio safety
    }
  }

  public playFakeFinish() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // High bright fanfare
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain1.gain.setValueAtTime(0.4 * this.sfxVol, now);
      gain1.gain.setValueAtTime(0.35 * this.sfxVol, now + 0.35);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Funny record scratch / boing after
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(450, now + 0.45);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.75);
      gain2.gain.setValueAtTime(0.4 * this.sfxVol, now + 0.45);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(now + 0.45);
      osc2.stop(now + 0.8);
    } catch {
      // Audio safety
    }
  }

  public playVictory() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [
        [523.25, 659.25, 783.99],   // C Major
        [587.33, 739.99, 880.00],   // D Major
        [659.25, 830.61, 987.77],   // E Major
        [1046.5, 1318.5, 1567.98],  // High C Major triumphant
      ];
      chords.forEach((chord, step) => {
        const stepTime = now + step * 0.12;
        const dur = step === 3 ? 0.6 : 0.15;
        chord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, stepTime);
          gain.gain.setValueAtTime(0.25 * this.sfxVol, stepTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stepTime + dur);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(stepTime);
          osc.stop(stepTime + dur);
        });
      });
    } catch {
      // Audio safety
    }
  }

  public playWallWarning() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.setValueAtTime(450, now + 0.05);
      gain.gain.setValueAtTime(0.12 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio safety
    }
  }

  public playSwitch() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.18 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio safety
    }
  }

  public startMusic() {
    if (!this.masterEnabled) return;
    this.initContext();
    if (!this.ctx || !this.musicGain || this.isMusicPlaying) return;

    try {
      this.isMusicPlaying = true;
      // Gentle atmospheric cyber drone + mellow repeating arpeggio
      const baseFreq = 65.41; // C2 deep bass
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, this.ctx.currentTime);

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      bassGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start();

      this.musicOscillators.push(bassOsc, bassGain);

      // Soft cyclical harmonic pad
      const chords = [
        [130.81, 164.81, 196.00], // C major
        [110.00, 130.81, 164.81], // A minor
        [146.83, 174.61, 220.00], // D minor
        [123.47, 155.56, 196.00], // B diminished / G7
      ];

      let chordIdx = 0;
      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      padGain.connect(this.musicGain);

      const intervalId = window.setInterval(() => {
        if (!this.isMusicPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const currentChord = chords[chordIdx % chords.length];
        chordIdx++;

        currentChord.forEach(freq => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(0.06, now + 0.8);
          g.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

          osc.connect(g);
          g.connect(padGain);
          osc.start(now);
          osc.stop(now + 3.2);
        });
      }, 3500);

      // Store cleanup handle
      (this.musicOscillators as unknown as { intervalId?: number }).intervalId = intervalId;
    } catch {
      // Audio safety
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    const holder = this.musicOscillators as unknown as { intervalId?: number };
    if (holder.intervalId) {
      clearInterval(holder.intervalId);
      holder.intervalId = undefined;
    }
    this.musicOscillators.forEach(node => {
      try {
        if ('stop' in node) {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // cleanup
      }
    });
    this.musicOscillators = [];
  }
}

export const soundManager = new SoundManager();
