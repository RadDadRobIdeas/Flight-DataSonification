// Musical scale definitions for pitch quantization.
// Each scale is defined as semitone intervals from root.

import type { ScaleName } from '../types/mapping';

const SCALE_INTERVALS: Record<ScaleName, number[]> = {
  chromatic:        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major:            [0, 2, 4, 5, 7, 9, 11],
  natural_minor:    [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  dorian:           [0, 2, 3, 5, 7, 9, 10],
  mixolydian:       [0, 2, 4, 5, 7, 9, 10],
  whole_tone:       [0, 2, 4, 6, 8, 10],
  harmonic_minor:   [0, 2, 3, 5, 7, 8, 11],
  none:             [], // no quantization — continuous Hz
};

/** Convert MIDI note number to frequency in Hz */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Convert frequency to nearest MIDI note */
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

/** Build an array of valid MIDI notes for a scale within an octave range */
export function buildScaleNotes(
  scale: ScaleName,
  rootNote: number,
  octaveLow: number,
  octaveHigh: number
): number[] {
  if (scale === 'none') return [];

  const intervals = SCALE_INTERVALS[scale];
  const notes: number[] = [];
  const rootPitch = rootNote % 12;

  for (let octave = octaveLow; octave <= octaveHigh; octave++) {
    for (const interval of intervals) {
      const midi = rootPitch + interval + (octave + 1) * 12;
      if (midi >= 0 && midi <= 127) {
        notes.push(midi);
      }
    }
  }

  return notes.sort((a, b) => a - b);
}

/** Quantize a frequency to the nearest note in a scale */
export function quantizeToScale(
  freqHz: number,
  scale: ScaleName,
  rootNote: number,
  octaveLow: number,
  octaveHigh: number
): number {
  if (scale === 'none') return freqHz;

  const notes = buildScaleNotes(scale, rootNote, octaveLow, octaveHigh);
  if (notes.length === 0) return freqHz;

  const midi = freqToMidi(freqHz);
  let closest = notes[0];
  let minDist = Math.abs(midi - closest);

  for (const note of notes) {
    const dist = Math.abs(midi - note);
    if (dist < minDist) {
      minDist = dist;
      closest = note;
    }
  }

  return midiToFreq(closest);
}
