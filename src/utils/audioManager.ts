/**
 * Highly immersive Web Audio API Synthesizer & Audio Manager.
 * Generates dynamic, non-blocking real-time audio signals (wind rustle, lightning crackles, 
 * low-frequency thunder rumbles) using procedural synthesizer trees (no static .mp3 loads).
 */
class MeteorologicalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private isWindActive: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // keep comfortable default volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates a procedurally filled White Noise Buffer.
   */
  private createNoiseBuffer(): AudioBuffer {
    this.initContext();
    if (!this.ctx) throw new Error('AudioContext unavailable');
    
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Direct Synthesised Lightning Thunder Clap (Sound A)
   */
  public triggerThunderClap() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      
      const now = this.ctx.currentTime;
      
      // 1. Initial High-Frequency Crackle Node
      const crackleNode = this.ctx.createBufferSource();
      crackleNode.buffer = this.createNoiseBuffer();
      
      const crackleFilter = this.ctx.createBiquadFilter();
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.setValueAtTime(800, now);
      crackleFilter.Q.setValueAtTime(4.0, now);

      const crackleGain = this.ctx.createGain();
      crackleGain.gain.setValueAtTime(0.0, now);
      crackleGain.gain.linearRampToValueAtTime(0.65, now + 0.02);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      crackleNode.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(this.masterGain);

      // 2. Sub-Bass Thump Node (Oscillator)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(85, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.55);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(100, now);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.0, now);
      subGain.gain.linearRampToValueAtTime(0.85, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.masterGain);

      // Start buffers
      crackleNode.start(now);
      crackleNode.stop(now + 0.82);
      subOsc.start(now);
      subOsc.stop(now + 0.82);
    } catch (e) {
      console.warn("Environmental clap interrupted or muted", e);
    }
  }

  /**
   * Prolonged Flicker Thunder Roll (Sound B)
   */
  public triggerThunderRoll() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;

      // Double-noise sweep to simulate thunder bouncing off plateaus
      const thunderBuffer = this.createNoiseBuffer();
      const rumbleSrc = this.ctx.createBufferSource();
      rumbleSrc.buffer = thunderBuffer;
      rumbleSrc.loop = true;

      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(220, now);
      // Sweep cut frequency low during roll
      rumbleFilter.frequency.exponentialRampToValueAtTime(28, now + 1.8);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.0, now);
      // Continuous rise-fall ripple envelopes to replicate rolling storm
      rumbleGain.gain.linearRampToValueAtTime(0.9, now + 0.15);
      rumbleGain.gain.setValueAtTime(0.6, now + 0.4);
      rumbleGain.gain.linearRampToValueAtTime(0.95, now + 0.75);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      // Distort slightly using basic wavefold sweep
      rumbleSrc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.masterGain);

      rumbleSrc.start(now);
      rumbleSrc.stop(now + 2.4);
    } catch (e) {
      console.warn("Prolonged storm roll interrupted or muted", e);
    }
  }

  /**
   * Starts constant pleasant ambient breeze synthesizer, adjusting cutoff to weather intensity.
   */
  public startAmbientWind(windSpeed: number = 15) {
    try {
      if (this.isWindActive) {
        this.updateWindSpeed(windSpeed);
        return;
      }
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(280 + windSpeed * 5, now);
      this.windFilter.Q.setValueAtTime(2.0, now);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.0, now);
      this.windGain.gain.linearRampToValueAtTime(0.12, now + 1.0); // soft fade in

      // Standard wind LFO block (Oscillator driving frequency modulation)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.18, now); // slow wave
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(80, now); // modulate by 80Hz

      lfo.connect(lfoGain);
      lfoGain.connect(this.windFilter.frequency);

      noise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      lfo.start(now);
      noise.start(now);
      this.isWindActive = true;
    } catch (e) {
      console.warn("Ambient breeze synthesis paused or muted", e);
    }
  }

  public updateWindSpeed(windSpeed: number) {
    if (!this.ctx || !this.windFilter) return;
    const now = this.ctx.currentTime;
    try {
      this.windFilter.frequency.exponentialRampToValueAtTime(280 + windSpeed * 5, now + 1.0);
    } catch (e) {
      // safe fallback
    }
  }

  public stopAmbientWind() {
    if (!this.windGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      this.isWindActive = false;
    } catch (e) {
      // safe bypass
    }
  }
}

export const audioManager = new MeteorologicalAudioEngine();
