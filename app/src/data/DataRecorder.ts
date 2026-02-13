// Records raw DataPacket streams for later playback at arbitrary speeds.
// This enables the "sped up recorded flights" use case and offline rendering.

import type { DataPacket } from '../types/data';

interface RecordedFrame {
  timestamp: number;
  packet: DataPacket;
}

export class DataRecorder {
  private frames: RecordedFrame[] = [];
  private _isRecording = false;
  private startTime = 0;

  get isRecording(): boolean {
    return this._isRecording;
  }

  get frameCount(): number {
    return this.frames.length;
  }

  get duration(): number {
    if (this.frames.length < 2) return 0;
    return this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp;
  }

  startRecording(): void {
    this._isRecording = true;
    this.startTime = Date.now();
    this.frames = [];
  }

  stopRecording(): void {
    this._isRecording = false;
  }

  recordPacket(packet: DataPacket): void {
    if (!this._isRecording) return;
    this.frames.push({
      timestamp: Date.now() - this.startTime,
      packet: structuredClone(packet),
    });
  }

  /** Export recording as JSON */
  exportJSON(): string {
    return JSON.stringify({
      version: 1,
      recordedAt: new Date().toISOString(),
      duration: this.duration,
      frameCount: this.frames.length,
      frames: this.frames,
    }, null, 2);
  }

  /** Import a recording from JSON */
  importJSON(json: string): void {
    const data = JSON.parse(json);
    if (data.version !== 1) throw new Error(`Unknown recording version: ${data.version}`);
    this.frames = data.frames;
  }

  /** Download recording as a file */
  downloadJSON(filename?: string): void {
    const json = this.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Get all frames (for playback engine) */
  getFrames(): ReadonlyArray<RecordedFrame> {
    return this.frames;
  }

  clear(): void {
    this.frames = [];
    this._isRecording = false;
  }
}

/** Plays back a recorded data stream at configurable speed */
export class DataPlayer {
  private frames: ReadonlyArray<RecordedFrame> = [];
  private currentIndex = 0;
  private speed = 1.0;
  private _isPlaying = false;
  private playbackStart = 0;
  private dataCallbacks: Array<(packet: DataPacket) => void> = [];
  private removeCallbacks: Array<(sourceId: string) => void> = [];
  private animFrameId: number | null = null;
  private knownEntities = new Set<string>();

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get progress(): number {
    if (this.frames.length === 0) return 0;
    return this.currentIndex / this.frames.length;
  }

  get currentSpeed(): number {
    return this.speed;
  }

  loadRecording(recorder: DataRecorder): void {
    this.frames = recorder.getFrames();
    this.currentIndex = 0;
  }

  loadJSON(json: string): void {
    const data = JSON.parse(json);
    this.frames = data.frames;
    this.currentIndex = 0;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(1000, speed));
  }

  onData(callback: (packet: DataPacket) => void): void {
    this.dataCallbacks.push(callback);
  }

  onEntityRemoved(callback: (sourceId: string) => void): void {
    this.removeCallbacks.push(callback);
  }

  play(): void {
    if (this.frames.length === 0 || this._isPlaying) return;
    this._isPlaying = true;

    if (this.currentIndex === 0) {
      this.playbackStart = performance.now();
    } else {
      // Resume from current position
      const currentFrameTime = this.frames[this.currentIndex].timestamp;
      this.playbackStart = performance.now() - (currentFrameTime / this.speed);
    }

    this.tick();
  }

  pause(): void {
    this._isPlaying = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentIndex = 0;
    // Remove all entities
    for (const id of this.knownEntities) {
      for (const cb of this.removeCallbacks) cb(id);
    }
    this.knownEntities.clear();
  }

  seek(progress: number): void {
    const idx = Math.floor(progress * this.frames.length);
    this.currentIndex = Math.max(0, Math.min(idx, this.frames.length - 1));
    if (this._isPlaying) {
      const frameTime = this.frames[this.currentIndex].timestamp;
      this.playbackStart = performance.now() - (frameTime / this.speed);
    }
  }

  private tick = (): void => {
    if (!this._isPlaying) return;

    const elapsed = (performance.now() - this.playbackStart) * this.speed;
    const currentEntities = new Set<string>();

    // Emit all frames up to current playback time
    while (
      this.currentIndex < this.frames.length &&
      this.frames[this.currentIndex].timestamp <= elapsed
    ) {
      const frame = this.frames[this.currentIndex];
      currentEntities.add(frame.packet.sourceId);
      for (const cb of this.dataCallbacks) cb(frame.packet);
      this.currentIndex++;
    }

    // Detect removed entities
    for (const prev of this.knownEntities) {
      if (!currentEntities.has(prev)) {
        for (const cb of this.removeCallbacks) cb(prev);
      }
    }
    this.knownEntities = currentEntities;

    if (this.currentIndex >= this.frames.length) {
      this._isPlaying = false;
      return;
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };
}
