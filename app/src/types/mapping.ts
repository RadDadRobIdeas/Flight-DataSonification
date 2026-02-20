// Mapping engine types

import type { TransformCurve } from './synth';

export type ScaleName =
  | 'chromatic'
  | 'major'
  | 'natural_minor'
  | 'pentatonic_major'
  | 'pentatonic_minor'
  | 'dorian'
  | 'mixolydian'
  | 'whole_tone'
  | 'harmonic_minor'
  | 'none';

export type SynthParameter =
  | 'pitch'
  | 'filterFreq'
  | 'filterQ'
  | 'amplitude'
  | 'pan'
  | 'oscAGain'
  | 'oscBGain'
  | 'oscCGain';

export interface QuantizeConfig {
  scale: ScaleName;
  rootNote: number; // MIDI note number (60 = C4)
  octaveLow: number;
  octaveHigh: number;
}

export interface MappingConfig {
  id: string;
  enabled: boolean;

  source: {
    dataSourceType: string;
    field: string;
    entityFilter?: string;
  };

  target: {
    parameter: SynthParameter;
  };

  transform: {
    inputRange: [number, number];
    outputRange: [number, number];
    curve: TransformCurve;
    smoothing: number;   // 0-1
    clamp: boolean;
    invert: boolean;
    quantize?: QuantizeConfig;
  };
}
