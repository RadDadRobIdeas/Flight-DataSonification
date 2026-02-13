// The Orchestrator ties together data sources, mapping engine, and synth engine.
// It's the central coordinator for the entire pipeline.

import type { DataPacket, DataSourceAdapter } from '../types/data';
import type { MappingConfig } from '../types/mapping';
import { SynthEngine } from './SynthEngine';
import { StemRecorder } from './StemRecorder';
import { MappingEngine } from '../mapping/MappingEngine';
import { DataRecorder } from '../data/DataRecorder';

export class Orchestrator {
  readonly synth: SynthEngine;
  readonly mapping: MappingEngine;
  readonly stemRecorder: StemRecorder;
  readonly dataRecorder: DataRecorder;

  private dataSources: Map<string, DataSourceAdapter> = new Map();
  private started = false;

  constructor() {
    this.synth = new SynthEngine();
    this.mapping = new MappingEngine();
    this.stemRecorder = new StemRecorder();
    this.dataRecorder = new DataRecorder();
  }

  /** Must be called from a user gesture to unlock Web Audio */
  async start(): Promise<void> {
    if (this.started) return;
    await this.synth.start();
    this.started = true;
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
        console.error(`Failed to connect ${ds.info.name}:`, err);
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

  /** Start recording data and stems */
  startRecording(): void {
    this.dataRecorder.startRecording();
    // Add existing voice stems
    for (const stem of this.synth.getAllStemBuses()) {
      this.stemRecorder.addStem(stem.entityId, stem.output);
    }
    this.stemRecorder.startAll();
  }

  /** Stop recording */
  stopRecording(): void {
    this.dataRecorder.stopRecording();
    this.stemRecorder.stopAll();
  }

  /** Clean up everything */
  dispose(): void {
    this.disconnectAll();
    this.stemRecorder.clear();
    this.dataRecorder.clear();
    this.synth.dispose();
  }

  private handleData(packet: DataPacket): void {
    // Record raw data
    this.dataRecorder.recordPacket(packet);

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
  }

  private handleEvent(event: { type: string; severity: number }, _entityId: string): void {
    // For now, log events. Phase 2 will add trigger voices.
    if (event.type === 'emergency') {
      console.warn(`[EVENT] Emergency detected for ${_entityId}`);
    }
  }
}
