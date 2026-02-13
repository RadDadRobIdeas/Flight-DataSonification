// Records individual voice stems to separate audio buffers.
// Uses the Web Audio API MediaStreamDestination + MediaRecorder per stem.

import * as Tone from 'tone';

interface StemRecording {
  entityId: string;
  recorder: MediaRecorder;
  chunks: Blob[];
  startTime: number;
}

export class StemRecorder {
  private recordings: Map<string, StemRecording> = new Map();
  private _isRecording = false;

  get isRecording(): boolean {
    return this._isRecording;
  }

  get activeStems(): string[] {
    return Array.from(this.recordings.keys());
  }

  /** Start recording a stem from a Tone.js gain node */
  addStem(entityId: string, source: Tone.Gain): void {
    if (this.recordings.has(entityId)) return;

    const dest = Tone.getContext().createMediaStreamDestination();
    source.connect(dest as unknown as AudioNode);

    const recorder = new MediaRecorder(dest.stream, {
      mimeType: this.getSupportedMimeType(),
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    this.recordings.set(entityId, {
      entityId,
      recorder,
      chunks,
      startTime: Date.now(),
    });

    if (this._isRecording) {
      recorder.start(1000); // collect data every second
    }
  }

  /** Remove a stem (voice was released) */
  removeStem(entityId: string): void {
    const rec = this.recordings.get(entityId);
    if (!rec) return;
    if (rec.recorder.state === 'recording') {
      rec.recorder.stop();
    }
    // Keep the recording data — don't delete from recordings map
    // It can still be exported after the voice is gone
  }

  /** Start recording all current stems */
  startAll(): void {
    this._isRecording = true;
    for (const rec of this.recordings.values()) {
      if (rec.recorder.state !== 'recording') {
        rec.chunks.length = 0;
        rec.startTime = Date.now();
        rec.recorder.start(1000);
      }
    }
  }

  /** Stop recording all stems */
  stopAll(): void {
    this._isRecording = false;
    for (const rec of this.recordings.values()) {
      if (rec.recorder.state === 'recording') {
        rec.recorder.stop();
      }
    }
  }

  /** Export a single stem as a Blob */
  async exportStem(entityId: string): Promise<Blob | null> {
    const rec = this.recordings.get(entityId);
    if (!rec || rec.chunks.length === 0) return null;

    // Stop if still recording
    if (rec.recorder.state === 'recording') {
      rec.recorder.stop();
      // Wait for final data
      await new Promise<void>((resolve) => {
        rec.recorder.onstop = () => resolve();
      });
    }

    return new Blob(rec.chunks, { type: this.getSupportedMimeType() });
  }

  /** Export all stems as a map of entityId → Blob */
  async exportAllStems(): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>();
    for (const entityId of this.recordings.keys()) {
      const blob = await this.exportStem(entityId);
      if (blob) results.set(entityId, blob);
    }
    return results;
  }

  /** Download a stem as a file */
  async downloadStem(entityId: string, filename?: string): Promise<void> {
    const blob = await this.exportStem(entityId);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `stem_${entityId}_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Download all stems as individual files */
  async downloadAllStems(): Promise<void> {
    for (const entityId of this.recordings.keys()) {
      await this.downloadStem(entityId);
    }
  }

  /** Clear all recording data */
  clear(): void {
    this.stopAll();
    this.recordings.clear();
  }

  private getSupportedMimeType(): string {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    }
    return 'audio/ogg;codecs=opus';
  }
}
