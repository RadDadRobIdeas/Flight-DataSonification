// The Orchestrator ties together data sources, mapping engine, and synth engine.
// It's the central coordinator for the entire pipeline.

import type { DataPacket, DataSourceAdapter } from '../types/data';
import type { MappingConfig } from '../types/mapping';
import { SynthEngine } from './SynthEngine';
import { StemRecorder } from './StemRecorder';
import { MappingEngine } from '../mapping/MappingEngine';
import { DataRecorder } from '../data/DataRecorder';
import { pushDataFeed } from '../stores';

export class Orchestrator {
  readonly synth: SynthEngine;
  readonly mapping: MappingEngine;
  readonly stemRecorder: StemRecorder;
  readonly dataRecorder: DataRecorder;

  // Entity metadata cache (callsign, etc.) for UI display
  private entityMeta: Map<string, Record<string, unknown>> = new Map();

  private dataSources: Map<string, DataSourceAdapter> = new Map();
  private started = false;

  // Callbacks for external status monitoring
  private statusCallbacks: Array<(msg: string) => void> = [];

  constructor() {
    this.synth = new SynthEngine();
    this.mapping = new MappingEngine();
    this.stemRecorder = new StemRecorder();
    this.dataRecorder = new DataRecorder();
    // Always record data so downloads work without explicit record toggle
    this.dataRecorder.startRecording();
  }

  /** Must be called from a user gesture to unlock Web Audio */
  async start(): Promise<void> {
    if (this.started) return;
    await this.synth.start();
    this.started = true;
  }

  onStatus(callback: (msg: string) => void): void {
    this.statusCallbacks.push(callback);
  }

  private emitStatus(msg: string): void {
    for (const cb of this.statusCallbacks) cb(msg);
  }

  /** Register a data source adapter */
  addDataSource(adapter: DataSourceAdapter): void {
    const id = adapter.info.id;
    this.dataSources.set(id, adapter);

    // Wire up data flow
    adapter.onData((packet: DataPacket) => {
      this.handleData(packet);
    });

    adapter.onEntityRemoved((entityId: string) => {
      this.handleEntityRemoved(entityId);
    });
  }

  /** Connect all registered data sources */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.dataSources.values()).map((ds) =>
      ds.connect().catch((err) => {
        const msg = `Failed to connect ${ds.info.name}: ${err.message}`;
        console.error(msg);
        this.emitStatus(msg);
      })
    );
    await Promise.all(promises);
  }

  /** Disconnect all data sources */
  disconnectAll(): void {
    for (const ds of this.dataSources.values()) {
      ds.disconnect();
    }
  }

  /** Set the mapping configuration */
  setMappings(mappings: MappingConfig[]): void {
    this.mapping.setMappings(mappings);
  }

  /** Get data source info for UI display */
  getDataSourceInfo() {
    return Array.from(this.dataSources.values()).map((ds) => ds.info);
  }

  /** Get cached metadata for an entity */
  getEntityMeta(entityId: string): Record<string, unknown> | undefined {
    return this.entityMeta.get(entityId);
  }

  /** Start recording stems (data is always recorded) */
  startRecording(): void {
    // Add existing voice stems
    for (const stem of this.synth.getAllStemBuses()) {
      this.stemRecorder.addStem(stem.entityId, stem.output);
    }
    this.stemRecorder.startAll();
  }

  /** Stop recording stems */
  stopRecording(): void {
    this.stemRecorder.stopAll();
  }

  /** Clean up everything */
  dispose(): void {
    this.disconnectAll();
    this.stemRecorder.clear();
    // Don't clear data recorder — keep it for downloads after stop
    this.synth.dispose();
  }

  private handleData(packet: DataPacket): void {
    // Record raw data
    this.dataRecorder.recordPacket(packet);

    // Push to live data feed for UI
    pushDataFeed(packet);

    // Cache metadata
    if (packet.metadata) {
      this.entityMeta.set(packet.sourceId, packet.metadata);
    }

    // Map data to synth parameters
    const mapped = this.mapping.process(packet);

    // Get or create voice for this entity
    let voice = this.synth.getVoice(packet.sourceId);
    if (!voice) {
      voice = this.synth.allocateVoice(packet.sourceId);
      voice.gateOn();

      // Register stem for recording
      const stemBus = this.synth.getStemBus(packet.sourceId);
      if (stemBus && this.stemRecorder.isRecording) {
        this.stemRecorder.addStem(packet.sourceId, stemBus);
      }
    }

    // Apply mapped values to voice
    this.mapping.applyToVoice(voice, mapped);

    // Handle discrete events
    for (const event of packet.events) {
      this.handleEvent(event, packet.sourceId);
    }
  }

  private handleEntityRemoved(entityId: string): void {
    this.synth.releaseVoice(entityId);
    this.mapping.clearEntity(entityId);
    this.stemRecorder.removeStem(entityId);
    this.entityMeta.delete(entityId);
  }

  private handleEvent(event: { type: string; severity: number }, entityId: string): void {
    if (event.type === 'emergency') {
      this.emitStatus(`EMERGENCY: ${entityId} squawking ${event.type}`);
    } else if (event.type === 'new_contact') {
      const meta = this.entityMeta.get(entityId);
      const callsign = (meta?.callsign as string) || entityId;
      console.log(`[NEW] ${callsign}`);
    }
  }
}
