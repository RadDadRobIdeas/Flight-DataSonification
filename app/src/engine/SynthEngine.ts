// Polyphonic synth engine with voice allocation and per-voice output buses.
// Each voice routes through its own Gain node (tappable for stem recording)
// before hitting the master bus.

import * as Tone from 'tone';
import { Voice } from './Voice';
import type { VoiceParams } from '../types/synth';
import { DEFAULT_VOICE_PARAMS } from '../types/synth';

export interface StemBus {
  entityId: string;
  output: Tone.Gain;
}

export class SynthEngine {
  private voices: Map<string, Voice> = new Map();
  private maxPolyphony: number;
  private voiceParams: VoiceParams;
  private nextVoiceId = 0;

  // Audio graph
  readonly masterGain: Tone.Gain;
  readonly masterLimiter: Tone.Limiter;
  readonly reverb: Tone.Reverb;
  readonly reverbSend: Tone.Gain;
  readonly delay: Tone.FeedbackDelay;
  readonly delaySend: Tone.Gain;

  // Per-voice stem taps for recording
  private stemBuses: Map<string, Tone.Gain> = new Map();

  constructor(maxPolyphony = 32) {
    this.maxPolyphony = maxPolyphony;
    this.voiceParams = { ...DEFAULT_VOICE_PARAMS };

    // Master chain: limiter → destination
    this.masterLimiter = new Tone.Limiter(-1).toDestination();
    this.masterGain = new Tone.Gain(0.8).connect(this.masterLimiter);

    // Effects sends (parallel to master)
    this.reverb = new Tone.Reverb({ decay: 4, wet: 1 }).connect(this.masterGain);
    this.reverbSend = new Tone.Gain(0.2).connect(this.reverb);

    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.4,
      feedback: 0.3,
      wet: 1,
    }).connect(this.masterGain);
    this.delaySend = new Tone.Gain(0.15).connect(this.delay);
  }

  get activeVoiceCount(): number {
    return this.voices.size;
  }

  get voiceIds(): string[] {
    return Array.from(this.voices.keys());
  }

  /** Ensure Tone.js audio context is started (must be called from user gesture) */
  async start(): Promise<void> {
    await Tone.start();
  }

  /** Allocate a voice for a data entity */
  allocateVoice(entityId: string): Voice {
    // If this entity already has a voice, return it
    const existing = this.voices.get(entityId);
    if (existing) return existing;

    // Voice stealing if at max polyphony
    if (this.voices.size >= this.maxPolyphony) {
      this.stealOldestVoice();
    }

    const voiceId = `v_${this.nextVoiceId++}`;
    const voice = new Voice(voiceId, entityId, this.voiceParams);

    // Connect voice → master bus (dry) + effect sends
    voice.connect(this.masterGain);
    voice.connect(this.reverbSend);
    voice.connect(this.delaySend);

    // Create a stem tap for this voice (mirror of voice output for recording)
    const stemTap = new Tone.Gain(1);
    voice.output.connect(stemTap);
    this.stemBuses.set(entityId, stemTap);

    this.voices.set(entityId, voice);
    return voice;
  }

  /** Get an existing voice by entity ID */
  getVoice(entityId: string): Voice | undefined {
    return this.voices.get(entityId);
  }

  /** Release and remove a voice */
  releaseVoice(entityId: string): void {
    const voice = this.voices.get(entityId);
    if (!voice) return;

    voice.gateOff();

    // Remove after release time
    const releaseMs = this.voiceParams.ampEnvelope.release * 1000 + 200;
    setTimeout(() => {
      voice.dispose();
      this.voices.delete(entityId);
      const stem = this.stemBuses.get(entityId);
      if (stem) {
        stem.dispose();
        this.stemBuses.delete(entityId);
      }
    }, releaseMs);
  }

  /** Get stem bus for recording a specific entity's audio */
  getStemBus(entityId: string): Tone.Gain | undefined {
    return this.stemBuses.get(entityId);
  }

  /** Get all active stem buses */
  getAllStemBuses(): StemBus[] {
    return Array.from(this.stemBuses.entries()).map(([entityId, output]) => ({
      entityId,
      output,
    }));
  }

  /** Update synth params for all future voices */
  setVoiceParams(params: Partial<VoiceParams>): void {
    Object.assign(this.voiceParams, params);
  }

  /** Set master volume (0-1) */
  setMasterGain(gain: number): void {
    this.masterGain.gain.value = gain;
  }

  /** Set reverb send level (0-1) */
  setReverbSend(level: number): void {
    this.reverbSend.gain.value = level;
  }

  /** Set delay send level (0-1) */
  setDelaySend(level: number): void {
    this.delaySend.gain.value = level;
  }

  /** Release all voices and clean up */
  dispose(): void {
    for (const [entityId] of this.voices) {
      this.releaseVoice(entityId);
    }
    setTimeout(() => {
      this.reverb.dispose();
      this.reverbSend.dispose();
      this.delay.dispose();
      this.delaySend.dispose();
      this.masterGain.dispose();
      this.masterLimiter.dispose();
    }, (this.voiceParams.ampEnvelope.release + 1) * 1000);
  }

  private stealOldestVoice(): void {
    // Steal the first (oldest) voice
    const oldest = this.voices.entries().next().value;
    if (oldest) {
      const [entityId, voice] = oldest;
      voice.dispose();
      this.voices.delete(entityId);
      const stem = this.stemBuses.get(entityId);
      if (stem) {
        stem.dispose();
        this.stemBuses.delete(entityId);
      }
    }
  }
}
