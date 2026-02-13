// Routes data fields to synth parameters through configurable transforms.

import type { MappingConfig, SynthParameter } from '../types/mapping';
import type { DataPacket, ContinuousValue } from '../types/data';
import type { Voice } from '../engine/Voice';
import { quantizeToScale } from './scales';

export interface MappedValues {
  pitch?: number;
  filterFreq?: number;
  filterQ?: number;
  amplitude?: number;
  pan?: number;
  oscAGain?: number;
  oscBGain?: number;
  oscCGain?: number;
}

export class MappingEngine {
  private mappings: MappingConfig[] = [];

  // Smoothed values per entity per parameter
  private smoothedValues: Map<string, Map<SynthParameter, number>> = new Map();

  setMappings(mappings: MappingConfig[]): void {
    this.mappings = mappings;
  }

  addMapping(mapping: MappingConfig): void {
    this.mappings.push(mapping);
  }

  removeMapping(id: string): void {
    this.mappings = this.mappings.filter((m) => m.id !== id);
  }

  getMappings(): MappingConfig[] {
    return [...this.mappings];
  }

  /** Process a data packet and return mapped synth parameter values */
  process(packet: DataPacket): MappedValues {
    const result: MappedValues = {};

    for (const mapping of this.mappings) {
      if (!mapping.enabled) continue;

      // Check source type match
      if (mapping.source.dataSourceType !== packet.sourceType) continue;

      // Check entity filter
      if (mapping.source.entityFilter && mapping.source.entityFilter !== packet.sourceId) {
        continue;
      }

      // Extract the value from the packet
      const field = mapping.source.field;
      const continuousVal = packet.continuous[field];
      if (!continuousVal) continue;

      // Apply transform
      let value = this.applyTransform(continuousVal, mapping);

      // Apply smoothing
      value = this.applySmoothing(packet.sourceId, mapping.target.parameter, value, mapping.transform.smoothing);

      // Apply quantization if targeting pitch
      if (mapping.target.parameter === 'pitch' && mapping.transform.quantize) {
        const q = mapping.transform.quantize;
        value = quantizeToScale(value, q.scale, q.rootNote, q.octaveLow, q.octaveHigh);
      }

      result[mapping.target.parameter] = value;
    }

    return result;
  }

  /** Apply mapped values to a voice */
  applyToVoice(voice: Voice, values: MappedValues, smoothTime = 0.5): void {
    if (values.pitch !== undefined) voice.setPitch(values.pitch, smoothTime);
    if (values.filterFreq !== undefined) voice.setFilterFreq(values.filterFreq, smoothTime);
    if (values.filterQ !== undefined) voice.setFilterQ(values.filterQ);
    if (values.amplitude !== undefined) voice.setGain(values.amplitude, smoothTime);
    if (values.pan !== undefined) voice.setPan(values.pan);
    if (values.oscAGain !== undefined) voice.setOscGain(0, values.oscAGain);
    if (values.oscBGain !== undefined) voice.setOscGain(1, values.oscBGain);
    if (values.oscCGain !== undefined) voice.setOscGain(2, values.oscCGain);
  }

  /** Clear smoothing state for an entity */
  clearEntity(entityId: string): void {
    this.smoothedValues.delete(entityId);
  }

  private applyTransform(cv: ContinuousValue, mapping: MappingConfig): number {
    const { inputRange, outputRange, curve, clamp, invert } = mapping.transform;

    // Normalize input to 0-1
    let normalized = (cv.value - inputRange[0]) / (inputRange[1] - inputRange[0]);

    // Clamp to 0-1
    if (clamp) {
      normalized = Math.max(0, Math.min(1, normalized));
    }

    // Invert
    if (invert) {
      normalized = 1 - normalized;
    }

    // Apply curve
    switch (curve) {
      case 'log':
        // Avoid log(0)
        normalized = Math.log(1 + normalized * 9) / Math.log(10);
        break;
      case 'exp':
        normalized = Math.pow(normalized, 2);
        break;
      case 'linear':
      default:
        break;
    }

    // Map to output range
    return outputRange[0] + normalized * (outputRange[1] - outputRange[0]);
  }

  private applySmoothing(
    entityId: string,
    param: SynthParameter,
    rawValue: number,
    smoothing: number
  ): number {
    if (smoothing <= 0) return rawValue;

    let entitySmoothed = this.smoothedValues.get(entityId);
    if (!entitySmoothed) {
      entitySmoothed = new Map();
      this.smoothedValues.set(entityId, entitySmoothed);
    }

    const prev = entitySmoothed.get(param);
    if (prev === undefined) {
      entitySmoothed.set(param, rawValue);
      return rawValue;
    }

    // Exponential moving average
    const smoothed = prev * smoothing + rawValue * (1 - smoothing);
    entitySmoothed.set(param, smoothed);
    return smoothed;
  }
}
