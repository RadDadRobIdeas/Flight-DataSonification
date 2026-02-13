// Svelte stores for reactive global state

import { writable, derived } from 'svelte/store';
import type { DataSourceInfo } from './types/data';
import type { MappingConfig } from './types/mapping';

// App state
export const isRunning = writable(false);
export const isRecording = writable(false);

// Data sources
export const dataSources = writable<DataSourceInfo[]>([]);

// Active voice info
export const activeVoices = writable<Array<{
  entityId: string;
  callsign?: string;
  pitch: number;
  gain: number;
  pan: number;
}>>([]);

export const voiceCount = derived(activeVoices, ($v) => $v.length);

// Mapping configs
export const mappings = writable<MappingConfig[]>([]);

// Master controls
export const masterGain = writable(0.8);
export const reverbSend = writable(0.2);
export const delaySend = writable(0.15);

// Flight tracking config
export const trackingMode = writable<'callsign' | 'airport' | 'type'>('callsign');
export const callsignInput = writable('');
export const airportInput = writable('');
export const airportRadius = writable(50);
export const typeInput = writable('');
