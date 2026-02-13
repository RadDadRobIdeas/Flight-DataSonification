// Single synth voice — oscillators → filter → amp envelope → pan → output
// Each voice gets its own output node for stem recording.

import * as Tone from 'tone';
import type { VoiceParams, EnvelopeParams } from '../types/synth';
import { DEFAULT_VOICE_PARAMS } from '../types/synth';

export class Voice {
  readonly id: string;
  readonly entityId: string;

  private oscA: Tone.Oscillator;
  private oscB: Tone.Oscillator;
  private oscC: Tone.Oscillator;
  private oscAGain: Tone.Gain;
  private oscBGain: Tone.Gain;
  private oscCGain: Tone.Gain;
  private filter: Tone.Filter;
  private ampEnv: Tone.Gain;  // we'll automate gain for ADSR
  private panner: Tone.Panner;
  readonly output: Tone.Gain;  // public for stem recording taps

  private params: VoiceParams;
  private _active = false;
  private gateOpen = false;
  private releaseTimeout: ReturnType<typeof setTimeout> | null = null;

  // Current smoothed values
  private _currentPitch = 220;
  private _currentFilterFreq = 2000;

  constructor(id: string, entityId: string, params?: Partial<VoiceParams>) {
    this.id = id;
    this.entityId = entityId;
    this.params = { ...DEFAULT_VOICE_PARAMS, ...params };

    // Build signal chain
    this.output = new Tone.Gain(0); // starts silent, envelope opens it
    this.panner = new Tone.Panner(this.params.pan).connect(this.output);
    this.ampEnv = new Tone.Gain(0).connect(this.panner);
    this.filter = new Tone.Filter({
      type: this.params.filter.type,
      frequency: this.params.filter.frequency,
      Q: this.params.filter.Q,
    }).connect(this.ampEnv);

    // Oscillators with individual gain controls
    this.oscAGain = new Tone.Gain(this.params.oscillators[0].gain).connect(this.filter);
    this.oscBGain = new Tone.Gain(this.params.oscillators[1].gain).connect(this.filter);
    this.oscCGain = new Tone.Gain(this.params.oscillators[2].gain).connect(this.filter);

    this.oscA = new Tone.Oscillator({
      type: this.params.oscillators[0].type,
      detune: this.params.oscillators[0].detune,
      frequency: this._currentPitch,
    }).connect(this.oscAGain);

    this.oscB = new Tone.Oscillator({
      type: this.params.oscillators[1].type,
      detune: this.params.oscillators[1].detune,
      frequency: this._currentPitch,
    }).connect(this.oscBGain);

    this.oscC = new Tone.Oscillator({
      type: this.params.oscillators[2].type,
      detune: this.params.oscillators[2].detune,
      frequency: this._currentPitch,
    }).connect(this.oscCGain);
  }

  get active(): boolean {
    return this._active;
  }

  get currentPitch(): number {
    return this._currentPitch;
  }

  get currentFilterFreq(): number {
    return this._currentFilterFreq;
  }

  /** Connect voice output to a destination (master bus, recorder, etc.) */
  connect(destination: Tone.InputNode): Voice {
    this.output.connect(destination);
    return this;
  }

  /** Open the gate — start oscillators and run attack phase */
  gateOn(): void {
    if (this.gateOpen) return;
    this.gateOpen = true;
    this._active = true;

    if (this.releaseTimeout) {
      clearTimeout(this.releaseTimeout);
      this.releaseTimeout = null;
    }

    // Start oscillators
    if (this.params.oscillators[0].enabled) this.oscA.start();
    if (this.params.oscillators[1].enabled) this.oscB.start();
    if (this.params.oscillators[2].enabled) this.oscC.start();

    // Amp envelope: attack → sustain
    const now = Tone.now();
    const env = this.params.ampEnvelope;
    this.ampEnv.gain.cancelScheduledValues(now);
    this.ampEnv.gain.setValueAtTime(this.ampEnv.gain.value, now);
    this.ampEnv.gain.linearRampToValueAtTime(this.params.gain, now + env.attack);
    this.ampEnv.gain.linearRampToValueAtTime(
      this.params.gain * env.sustain,
      now + env.attack + env.decay
    );

    // Filter envelope
    const fEnv = this.params.filterEnvelope;
    const baseFreq = this.params.filter.frequency;
    const peakFreq = baseFreq + (20000 - baseFreq) * this.params.filter.envelopeAmount;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(baseFreq, now);
    this.filter.frequency.linearRampToValueAtTime(peakFreq, now + fEnv.attack);
    this.filter.frequency.linearRampToValueAtTime(
      baseFreq + (peakFreq - baseFreq) * fEnv.sustain,
      now + fEnv.attack + fEnv.decay
    );
  }

  /** Close the gate — run release phase then stop */
  gateOff(): void {
    if (!this.gateOpen) return;
    this.gateOpen = false;

    const now = Tone.now();
    const env = this.params.ampEnvelope;

    // Release phase
    this.ampEnv.gain.cancelScheduledValues(now);
    this.ampEnv.gain.setValueAtTime(this.ampEnv.gain.value, now);
    this.ampEnv.gain.linearRampToValueAtTime(0, now + env.release);

    // Filter release
    const fEnv = this.params.filterEnvelope;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value as number, now);
    this.filter.frequency.linearRampToValueAtTime(
      this.params.filter.frequency,
      now + fEnv.release
    );

    // Stop oscillators after release completes
    this.releaseTimeout = setTimeout(() => {
      this.oscA.stop();
      this.oscB.stop();
      this.oscC.stop();
      this._active = false;
    }, env.release * 1000 + 100);
  }

  /** Set pitch with optional smoothing time (seconds) */
  setPitch(hz: number, smoothTime = 0.5): void {
    this._currentPitch = hz;
    const now = Tone.now();
    this.oscA.frequency.linearRampToValueAtTime(hz, now + smoothTime);
    this.oscB.frequency.linearRampToValueAtTime(hz, now + smoothTime);
    this.oscC.frequency.linearRampToValueAtTime(hz, now + smoothTime);
  }

  /** Set filter cutoff frequency */
  setFilterFreq(hz: number, smoothTime = 0.5): void {
    this._currentFilterFreq = hz;
    if (!this.gateOpen) return; // don't override envelope during attack
    this.filter.frequency.linearRampToValueAtTime(hz, Tone.now() + smoothTime);
  }

  /** Set filter resonance */
  setFilterQ(q: number): void {
    this.filter.Q.value = q;
  }

  /** Set amplitude (0-1) */
  setGain(gain: number, smoothTime = 0.5): void {
    if (!this.gateOpen) return;
    this.params.gain = gain;
    this.ampEnv.gain.linearRampToValueAtTime(
      gain * this.params.ampEnvelope.sustain,
      Tone.now() + smoothTime
    );
  }

  /** Set stereo pan (-1 to 1) */
  setPan(pan: number): void {
    this.panner.pan.value = Math.max(-1, Math.min(1, pan));
  }

  /** Set individual oscillator gains */
  setOscGain(index: 0 | 1 | 2, gain: number): void {
    const targets = [this.oscAGain, this.oscBGain, this.oscCGain];
    targets[index].gain.value = gain;
  }

  /** Update voice params (for preset changes) */
  updateParams(params: Partial<VoiceParams>): void {
    Object.assign(this.params, params);
    if (params.oscillators) {
      this.oscA.type = params.oscillators[0].type;
      this.oscB.type = params.oscillators[1].type;
      this.oscC.type = params.oscillators[2].type;
    }
    if (params.filter) {
      this.filter.type = params.filter.type;
      this.filter.Q.value = params.filter.Q;
    }
  }

  /** Clean up all audio nodes */
  dispose(): void {
    if (this.releaseTimeout) clearTimeout(this.releaseTimeout);
    this.oscA.dispose();
    this.oscB.dispose();
    this.oscC.dispose();
    this.oscAGain.dispose();
    this.oscBGain.dispose();
    this.oscCGain.dispose();
    this.filter.dispose();
    this.ampEnv.dispose();
    this.panner.dispose();
    this.output.dispose();
  }
}
