// Synth engine types

export type OscillatorShape = 'sine' | 'triangle' | 'sawtooth' | 'square';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type TransformCurve = 'linear' | 'log' | 'exp';

export interface EnvelopeParams {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // 0-1
  release: number;  // seconds
}

export interface OscillatorParams {
  type: OscillatorShape;
  detune: number;     // cents
  gain: number;       // 0-1 mix level
  enabled: boolean;
}

export interface FilterParams {
  type: FilterType;
  frequency: number;  // Hz
  Q: number;          // resonance
  envelopeAmount: number; // 0-1 how much filter env affects cutoff
}

export interface VoiceParams {
  oscillators: [OscillatorParams, OscillatorParams, OscillatorParams];
  filter: FilterParams;
  ampEnvelope: EnvelopeParams;
  filterEnvelope: EnvelopeParams;
  gain: number;       // 0-1
  pan: number;        // -1 to 1
}

export interface VoiceState {
  id: string;
  entityId: string;
  active: boolean;
  currentPitch: number;   // Hz
  currentFilterFreq: number;
  currentGain: number;
  currentPan: number;
}

export const DEFAULT_VOICE_PARAMS: VoiceParams = {
  oscillators: [
    { type: 'sawtooth', detune: 0, gain: 0.5, enabled: true },
    { type: 'triangle', detune: -5, gain: 0.3, enabled: true },
    { type: 'sine', detune: 0, gain: 0.2, enabled: false },
  ],
  filter: {
    type: 'lowpass',
    frequency: 2000,
    Q: 1,
    envelopeAmount: 0.3,
  },
  ampEnvelope: {
    attack: 2.0,
    decay: 0.5,
    sustain: 0.7,
    release: 4.0,
  },
  filterEnvelope: {
    attack: 1.0,
    decay: 1.0,
    sustain: 0.5,
    release: 3.0,
  },
  gain: 0.6,
  pan: 0,
};
