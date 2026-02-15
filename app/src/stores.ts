// Svelte stores for reactive global state

import { writable, derived } from 'svelte/store';
import type { DataSourceInfo, DataPacket } from './types/data';
import type { MappingConfig } from './types/mapping';

// App state
export const isRunning = writable(false);
export const isRecording = writable(false);

// Data sources
export const dataSources = writable<DataSourceInfo[]>([]);

// Live data feed — last N packets for the data preview panel
export const dataFeed = writable<DataPacket[]>([]);
export const dataFeedMax = 50; // keep last 50 packets visible

export function pushDataFeed(packet: DataPacket) {
  dataFeed.update((feed) => {
    const next = [...feed, packet];
    if (next.length > dataFeedMax) next.shift();
    return next;
  });
}

// Active voice info
export const activeVoices = writable<Array<{
  entityId: string;
  callsign?: string;
  pitch: number;
  gain: number;
  pan: number;
  altitude?: number;
  velocity?: number;
  heading?: number;
  verticalRate?: number;
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

// Tracking status text (separate from running state)
export const trackingLabel = writable('');

// Persisted recording data (survives stop)
export const hasRecordedData = writable(false);
