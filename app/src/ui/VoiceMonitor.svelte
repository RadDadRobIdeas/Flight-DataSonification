<script lang="ts">
  import { activeVoices, voiceCount } from '../stores';

  let voices = $state<Array<{
    entityId: string;
    callsign?: string;
    pitch: number;
    gain: number;
    pan: number;
    altitude?: number;
    velocity?: number;
  }>>([]);

  activeVoices.subscribe((v) => { voices = v; });

  let count = $state(0);
  voiceCount.subscribe((c) => { count = c; });

  function formatHz(hz: number): string {
    if (hz >= 1000) return `${(hz / 1000).toFixed(1)}kHz`;
    return `${hz.toFixed(0)}Hz`;
  }

  function fmtAlt(ft: number): string {
    if (!ft) return '—';
    return ft.toLocaleString() + 'ft';
  }

  function fmtSpd(kts: number): string {
    if (!kts) return '—';
    return Math.round(kts) + 'kts';
  }

  function panLabel(pan: number): string {
    if (pan < -0.1) return `L${Math.round(Math.abs(pan) * 100)}`;
    if (pan > 0.1) return `R${Math.round(pan * 100)}`;
    return 'C';
  }
</script>

<div class="voice-monitor">
  <h3>Voices <span class="count">{count}</span></h3>

  <div class="voice-list">
    {#each voices as voice (voice.entityId)}
      <div class="voice-row">
        <span class="entity-id">{voice.callsign || voice.entityId}</span>
        <span class="param alt">{fmtAlt(voice.altitude || 0)}</span>
        <span class="param spd">{fmtSpd(voice.velocity || 0)}</span>
        <span class="param pitch">{formatHz(voice.pitch)}</span>
        <div class="meter-bar">
          <div class="meter-fill" style:width="{voice.gain * 100}%"></div>
        </div>
        <span class="param pan">{panLabel(voice.pan)}</span>
      </div>
    {/each}

    {#if voices.length === 0}
      <div class="empty">No active voices</div>
    {/if}
  </div>
</div>

<style>
  .voice-monitor {
    padding: 1rem;
    border: 1px solid #333;
    border-radius: 8px;
    background: #1a1a1a;
  }

  h3 {
    margin: 0 0 0.75rem 0;
    color: #ccc;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .count {
    background: #333;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    font-size: 0.75rem;
    color: #4a9eff;
  }

  .voice-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .voice-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    background: #222;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: monospace;
  }

  .entity-id {
    width: 80px;
    color: #4a9eff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .param {
    color: #888;
    width: 50px;
    text-align: right;
  }

  .alt {
    color: #b39ddb;
    width: 55px;
    font-size: 0.65rem;
  }

  .spd {
    color: #80cbc4;
    width: 45px;
    font-size: 0.65rem;
  }

  .pitch {
    color: #8bc34a;
  }

  .pan {
    color: #ff9800;
    width: 30px;
  }

  .meter-bar {
    flex: 1;
    height: 4px;
    background: #333;
    border-radius: 2px;
    overflow: hidden;
  }

  .meter-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a9eff, #8bc34a);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .empty {
    color: #555;
    font-size: 0.8rem;
    padding: 1rem;
    text-align: center;
  }
</style>
