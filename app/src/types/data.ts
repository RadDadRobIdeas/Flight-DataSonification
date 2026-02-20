// Core data types for the DataSonification pipeline

export interface ContinuousValue {
  value: number;
  min: number;
  max: number;
  unit: string;
}

export interface DataEvent {
  type: string;
  severity: number; // 0.0 - 1.0
  metadata: Record<string, unknown>;
}

export interface DataPacket {
  sourceType: string;
  sourceId: string;
  timestamp: number;
  continuous: Record<string, ContinuousValue>;
  events: DataEvent[];
  metadata?: Record<string, unknown>;
}

export type DataSourceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface DataSourceInfo {
  id: string;
  name: string;
  type: string;
  status: DataSourceStatus;
  entityCount: number;
  lastUpdate: number;
  errorMessage?: string;
}

export interface DataSourceAdapter {
  readonly info: DataSourceInfo;
  connect(): Promise<void>;
  disconnect(): void;
  onData(callback: (packet: DataPacket) => void): void;
  onEntityRemoved(callback: (sourceId: string) => void): void;
}
