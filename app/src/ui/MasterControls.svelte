<script lang="ts">
  import { masterGain, reverbSend, delaySend, isRecording } from '../stores';

  let gain = $state(0.8);
  let reverb = $state(0.2);
  let delay = $state(0.15);
  let recording = $state(false);

  masterGain.subscribe((v) => { gain = v; });
  reverbSend.subscribe((v) => { reverb = v; });
  delaySend.subscribe((v) => { delay = v; });
  isRecording.subscribe((v) => { recording = v; });

  interface Props {
    onGainChange: (v: number) => void;
    onReverbChange: (v: number) => void;
    onDelayChange: (v: number) => void;
    onRecordToggle: () => void;
  }

  let { onGainChange, onReverbChange, onDelayChange, onRecordToggle }: Props = $props();

  function handleGain(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    masterGain.set(v);
    onGainChange(v);
  }

  function handleReverb(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    reverbSend.set(v);
    onReverbChange(v);
  }

  function handleDelay(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    delaySend.set(v);
    onDelayChange(v);
  }
</script>

<div class="master-controls">
  <h3>Master</h3>

  <div class="control">
    <label for="master-gain">Volume</label>
    <input
      id="master-gain"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={gain}
      oninput={handleGain}
    />
    <span class="value">{Math.round(gain * 100)}%</span>
  </div>

  <div class="control">
    <label for="reverb-send">Reverb</label>
    <input
      id="reverb-send"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={reverb}
      oninput={handleReverb}
    />
    <span class="value">{Math.round(reverb * 100)}%</span>
  </div>

  <div class="control">
    <label for="delay-send">Delay</label>
    <input
      id="delay-send"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={delay}
      oninput={handleDelay}
    />
    <span class="value">{Math.round(delay * 100)}%</span>
  </div>

  <button
    class="record-btn"
    class:recording
    onclick={onRecordToggle}
  >
    {recording ? '⏹ Stop Recording' : '⏺ Record Stems'}
  </button>
</div>

<style>
  .master-controls {
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

  .control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  label {
    width: 50px;
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
  }

  input[type="range"] {
    flex: 1;
    accent-color: #4a9eff;
  }

  .value {
    width: 35px;
    font-size: 0.75rem;
    color: #666;
    text-align: right;
    font-family: monospace;
  }

  .record-btn {
    width: 100%;
    padding: 0.6rem;
    margin-top: 0.5rem;
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    color: #ccc;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .record-btn:hover {
    background: #444;
  }

  .record-btn.recording {
    background: #c62828;
    border-color: #e53935;
    color: #fff;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
