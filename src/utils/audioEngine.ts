/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from '../types';

/**
 * Hyper-Realistic Procedural Web Audio API Synthesizer and Crossfader.
 * Synthesizes 100% of its waveforms in real-time, resulting in zero network loading latency,
 * complete immunity to CORS issues, and precise control over environmental frequencies.
 */
class HyperRealisticAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Looping soundscape gain nodes for seamless crossfading
  private soundscapeGains: { [key in WeatherType]?: GainNode } = {};
  private activeLoops: { [key: string]: any } = {};
  
  private curWeather: WeatherType | null = null;
  private isMuted: boolean = false;
  private hasInitialized: boolean = false;

  private init() {
    if (this.hasInitialized) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime); // default comfortable amplitude
      this.masterGain.connect(this.ctx.destination);

      // Initialize all weather loop structures
      this.setupSoundscapes();
      this.hasInitialized = true;
    } catch (err) {
      console.warn('Web Audio API is blocked or unsupported in this sandboxed environment', err);
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer(duration: number = 3.0): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Setup looping audio systems for all weather conditions
   */
  private setupSoundscapes() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'overcast', 'rain', 'storm', 'snow'];

    weatherTypes.forEach((type) => {
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.connect(this.masterGain!);
      this.soundscapeGains[type] = gain;
    });

    // 1. CLEAR SOUNDSCAPE: Low wind + sporadic procedural birds
    this.setupClearSoundscape();

    // 2. CLOUDY SOUNDSCAPE: Deep muffled pressure drone
    this.setupCloudySoundscape();

    // 3. OVERCAST / FOGGY SOUNDSCAPE: Low hum and eerie acoustic silence
    this.setupOvercastSoundscape();

    // 4. RAIN / STORM SOUNDSCAPE: Crackling raindrops + low rumble
    this.setupRainSoundscape();
  }

  private setupClearSoundscape() {
    const ctx = this.ctx!;
    const gain = this.soundscapeGains['clear']!;
    const now = ctx.currentTime;

    // Gentle wind breeze synthesis
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(5.0);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.Q.setValueAtTime(1.5, now);

    // LFO to emulate slow rising and falling wind
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, now); // ultra-slow
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(120, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    noise.connect(filter);
    filter.connect(gain);

    lfo.start(now);
    noise.start(now);

    // Dynamic sporadic bird chirps interval tree
    let birdTimer: any = null;
    const triggerBirdChirp = () => {
      if (this.curWeather !== 'clear' || this.isMuted) {
        birdTimer = setTimeout(triggerBirdChirp, 5000 + Math.random() * 6000);
        return;
      }
      
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const bGain = ctx.createGain();
      
      osc.type = 'sine';
      // Pitch sweep mimicking real sparrow chirping
      osc.frequency.setValueAtTime(1200 + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 500, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1500, t + 0.16);
      
      bGain.gain.setValueAtTime(0, t);
      bGain.gain.linearRampToValueAtTime(0.012, t + 0.02);
      bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      
      osc.connect(bGain);
      bGain.connect(gain);
      osc.start(t);
      osc.stop(t + 0.2);

      birdTimer = setTimeout(triggerBirdChirp, 4000 + Math.random() * 7000);
    };
    birdTimer = setTimeout(triggerBirdChirp, 3000);
    this.activeLoops['clear_birds'] = birdTimer;
  }

  private setupCloudySoundscape() {
    const ctx = this.ctx!;
    const gain = this.soundscapeGains['cloudy']!;
    const now = ctx.currentTime;

    // Dynamic Atmospheric drone utilizing micro-beating oscillators
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, now); // Low C

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(65.4, now); // Micro-detune for acoustic beating

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);
    filter.Q.setValueAtTime(3.0, now);

    // Slowly modulate lowpass cut frequency
    const cutMod = ctx.createOscillator();
    cutMod.frequency.setValueAtTime(0.05, now);
    const cutModGain = ctx.createGain();
    cutModGain.gain.setValueAtTime(25, now);

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.35, now);

    cutMod.connect(cutModGain);
    cutModGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(gain);

    osc1.start(now);
    osc2.start(now);
    cutMod.start(now);
  }

  private setupOvercastSoundscape() {
    const ctx = this.ctx!;
    const gain = this.soundscapeGains['overcast']!;
    const now = ctx.currentTime;

    // Eerie low-frequency hum & muffled dampeness
    const lowOsc = ctx.createOscillator();
    lowOsc.type = 'triangle';
    lowOsc.frequency.setValueAtTime(42, now); // 42Hz visceral vibration

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(55, now);

    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.4, now);

    lowOsc.connect(lp);
    lp.connect(humGain);
    humGain.connect(gain);

    lowOsc.start(now);
  }

  private setupRainSoundscape() {
    const ctx = this.ctx!;
    const gain = this.soundscapeGains['rain']!;
    const now = ctx.currentTime;

    // 1. High-frequency crackle/patters against glass
    const patterNoise = ctx.createBufferSource();
    patterNoise.buffer = this.createNoiseBuffer(2.5);
    patterNoise.loop = true;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(4500, now);

    const patterVolume = ctx.createGain();
    patterVolume.gain.setValueAtTime(0.04, now);

    // Periodic quick volume spike LFO to mimic squalls
    const squallLfo = ctx.createOscillator();
    squallLfo.frequency.setValueAtTime(0.12, now);
    const squallGain = ctx.createGain();
    squallGain.gain.setValueAtTime(0.02, now);

    squallLfo.connect(squallGain);
    squallGain.connect(patterVolume.gain);

    patterNoise.connect(hpFilter);
    hpFilter.connect(patterVolume);
    patterVolume.connect(gain);

    patterNoise.start(now);
    squallLfo.start(now);

    // 2. Low background rainy rumble
    const rumbleNode = ctx.createBufferSource();
    rumbleNode.buffer = this.createNoiseBuffer(4.0);
    rumbleNode.loop = true;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(75, now);

    const rumbleVolume = ctx.createGain();
    rumbleVolume.gain.setValueAtTime(0.3, now);

    rumbleNode.connect(lpFilter);
    lpFilter.connect(rumbleVolume);
    rumbleVolume.connect(gain);

    rumbleNode.start(now);

    // Tie 'storm' gain to this rainy soundscape too
    const stormGain = this.soundscapeGains['storm']!;
    patterVolume.connect(stormGain);
    rumbleVolume.connect(stormGain);

    // Also snow gets a silent muffled version of gentle wind rustles
    const snowGain = this.soundscapeGains['snow']!;
    const snowNoise = ctx.createBufferSource();
    snowNoise.buffer = this.createNoiseBuffer(4.0);
    snowNoise.loop = true;
    const snowFilter = ctx.createBiquadFilter();
    snowFilter.type = 'bandpass';
    snowFilter.frequency.setValueAtTime(220, now);
    snowFilter.Q.setValueAtTime(1.0, now);
    const snowVol = ctx.createGain();
    snowVol.gain.setValueAtTime(0.08, now);

    snowNoise.connect(snowFilter);
    snowFilter.connect(snowVol);
    snowVol.connect(snowGain);
    snowNoise.start(now);
  }

  /**
   * Transition soundscapes gracefully using logarithmic crossfade
   */
  public setWeatherState(weather: WeatherType) {
    this.resume();
    if (!this.ctx) return;
    if (this.curWeather === weather) return;

    const now = this.ctx.currentTime;
    const crossfadeDuration = 2.0; // seconds

    Object.keys(this.soundscapeGains).forEach((key) => {
      const type = key as WeatherType;
      const gainNode = this.soundscapeGains[type];
      if (gainNode) {
        if (type === weather) {
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          gainNode.gain.linearRampToValueAtTime(0.55, now + crossfadeDuration);
        } else {
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          gainNode.gain.linearRampToValueAtTime(0.0, now + crossfadeDuration);
        }
      }
    });

    this.curWeather = weather;
  }

  /* ========================================================================
     OMNIPRESENT INTERACTIVE SOUND DESIGN IMPLEMENTATIONS
     ======================================================================== */

  // --- CASE 1: THUNDERSTORM / RAIN ---

  /** Click lightning snap */
  public triggerLightningSnap() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Rapid high-pitch crackle node
    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(0.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100, now);
    filter.Q.setValueAtTime(8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /** Long press and release deep floor-shaking bass roll */
  public triggerThunderRoll() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(3.0);
    
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(140, now);
    lp.frequency.exponentialRampToValueAtTime(25, now + 2.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(1.0, now + 0.15); // sharp heavy impact
    gain.gain.setValueAtTime(0.7, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.85, now + 1.1); // rumble bounce
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0); // slow rolling decay

    source.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  // --- CASE 2: CLEAR / SUNNY ---

  /** Sharp, transient lens-flare burst camera view sound */
  public triggerLensFlareBurst() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(4500, now + 0.22); // upward swift sweep

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Solar wind swell / solar wave shockwave */
  public triggerSolarWindSwell() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(2.5);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(120, now);
    bp.frequency.exponentialRampToValueAtTime(1800, now + 1.2); // soaring upward sweep
    bp.frequency.exponentialRampToValueAtTime(300, now + 2.5); // downward decay
    bp.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.48, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    source.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  // --- CASE 3: FOGGY / HAZY ---

  /** Soft sweeping air displacement sound */
  public triggerFogDisplace() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(0.8);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, now);
    lp.frequency.exponentialRampToValueAtTime(250, now + 0.6); // soft heavy decompress

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    source.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /** Deep sonic blast decompress tunnel wave */
  public triggerSonicBlast() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Sub oscillator for visceral impact rumble
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.85);

    // Decompress puff noise source
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.8);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, now);
    lp.frequency.exponentialRampToValueAtTime(80, now + 1.5);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0, now);
    subGain.gain.linearRampToValueAtTime(0.8, now + 0.04);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0, now);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + 1.5);
    noise.start(now);
  }

  // --- CASE 4: CLOUDY / OVERCAST ---

  /** Cloud micro-vortex gust of atmospheric air */
  public triggerCloudVortex() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(1.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.linearRampToValueAtTime(850, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.0);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /** Cloud parting God Rays celestial open-air drone chords */
  public triggerCloudPartingGodRays() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const freqs = [220, 275, 330, 440]; // A glorious Major A-Minor celestial combination
    const duration = 2.8;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      // Evolving pitch modulation for shimmer effect
      const shimmer = this.ctx!.createOscillator();
      shimmer.frequency.setValueAtTime(3.5 + idx * 0.4, now);
      const shimmerGain = this.ctx!.createGain();
      shimmerGain.gain.setValueAtTime(2.0, now);
      
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 1.4); // Sweeping open
      filter.frequency.exponentialRampToValueAtTime(300, now + duration);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.5 + idx * 0.1); // Staggered entry
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(osc.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      shimmer.start(now);
      osc.start(now);
      shimmer.stop(now + duration + 0.2);
      osc.stop(now + duration + 0.2);
    });
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!this.masterGain) return;
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.masterGain.gain.setValueAtTime(muted ? 0.0 : 0.25, now);
  }
}

export const audioEngine = new HyperRealisticAudioEngine();
export default audioEngine;
