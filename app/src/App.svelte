<script lang="ts">
  import { VERSION, CODENAME } from './version';
  import { Orchestrator } from './engine/Orchestrator';
  import { AdsbAdapter } from './data/AdsbAdapter';
  import { flightDronePreset, flightAmbientPreset } from './mapping/presets';
  import {
    isRunning,
    isRecording,
    activeVoices,
    trackingMode,
    callsignInput,
    airportInput,
    airportRadius,
    typeInput,
  } from './stores';
  import FlightConfig from './ui/FlightConfig.svelte';
  import VoiceMonitor from './ui/VoiceMonitor.svelte';
  import MasterControls from './ui/MasterControls.svelte';

  let orchestrator = $state<Orchestrator | null>(null);
  let adapter = $state<AdsbAdapter | null>(null);
  let running = $state(false);
  let recording = $state(false);
  let statusMessage = $state('Ready');
  let selectedPreset = $state('drone');
  let updateTimer: ReturnType<typeof setInterval> | null = null;

  isRunning.subscribe((v) => { running = v; });
  isRecording.subscribe((v) => { recording = v; });

  // Airport coordinates lookup (common airports for quick use)
  const AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
    KJFK: { lat: 40.6413, lon: -73.7781 },
    KLAX: { lat: 33.9425, lon: -118.4081 },
    KORD: { lat: 41.9742, lon: -87.9073 },
    KATL: { lat: 33.6407, lon: -84.4277 },
    EGLL: { lat: 51.4700, lon: -0.4543 },
    LFPG: { lat: 49.0097, lon: 2.5479 },
    EDDF: { lat: 50.0379, lon: 8.5622 },
    RJTT: { lat: 35.5494, lon: 139.7798 },
    VHHH: { lat: 22.3080, lon: 113.9185 },
    YSSY: { lat: -33.9461, lon: 151.1772 },
    OMDB: { lat: 25.2528, lon: 55.3644 },
    KDFW: { lat: 32.8998, lon: -97.0403 },
    KDEN: { lat: 39.8561, lon: -104.6737 },
    KSFO: { lat: 37.6213, lon: -122.3790 },
  };

  async function start() {
    try {
      orchestrator = new Orchestrator();
      await orchestrator.start();

      // Set mapping preset
      const preset = selectedPreset === 'ambient'
        ? flightAmbientPreset()
        : flightDronePreset();
      orchestrator.setMappings(preset);

      // Create adapter based on tracking mode
      let mode: string = '';
      trackingMode.subscribe((v) => { mode = v; })();

      let callsign = '';
      callsignInput.subscribe((v) => { callsign = v; })();

      let airport = '';
      airportInput.subscribe((v) => { airport = v; })();

      let radius = 50;
      airportRadius.subscribe((v) => { radius = v; })();

      let acType = '';
      typeInput.subscribe((v) => { acType = v; })();

      if (mode === 'callsign' && callsign) {
        const callsigns = callsign.split(',').map((s) => s.trim()).filter(Boolean);
        adapter = new AdsbAdapter({ callsigns });
        statusMessage = `Tracking: ${callsigns.join(', ')}`;
      } else if (mode === 'airport' && airport) {
        const coords = AIRPORT_COORDS[airport];
        if (coords) {
          adapter = new AdsbAdapter({
            center: { lat: coords.lat, lon: coords.lon, radiusNm: radius },
          });
          statusMessage = `Tracking: ${airport} (${radius}nm)`;
        } else {
          statusMessage = `Unknown airport: ${airport}. Using KJFK.`;
          adapter = new AdsbAdapter({
            center: { lat: 40.6413, lon: -73.7781, radiusNm: radius },
          });
        }
      } else if (mode === 'type' && acType) {
        adapter = new AdsbAdapter({ aircraftType: acType });
        statusMessage = `Tracking type: ${acType}`;
      } else {
        // Default: JFK area
        adapter = new AdsbAdapter({
          center: { lat: 40.6413, lon: -73.7781, radiusNm: 50 },
        });
        statusMessage = 'Tracking: KJFK area (default)';
      }

      orchestrator.addDataSource(adapter);
      await orchestrator.connectAll();

      isRunning.set(true);

      // UI update loop
      updateTimer = setInterval(() => {
        if (!orchestrator) return;
        const voices = orchestrator.synth.voiceIds.map((entityId) => {
          const voice = orchestrator!.synth.getVoice(entityId);
          return {
            entityId,
            pitch: voice?.currentPitch || 0,
            gain: 0.5,
            pan: 0,
          };
        });
        activeVoices.set(voices);
      }, 500);

    } catch (err) {
      statusMessage = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(err);
    }
  }

  function stop() {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
    orchestrator?.dispose();
    orchestrator = null;
    adapter = null;
    isRunning.set(false);
    activeVoices.set([]);
    statusMessage = 'Stopped';
  }

  function toggleRecording() {
    if (!orchestrator) return;
    if (recording) {
      orchestrator.stopRecording();
      isRecording.set(false);
      statusMessage = 'Recording stopped. Stems available for download.';
    } else {
      orchestrator.startRecording();
      isRecording.set(true);
      statusMessage = 'Recording stems...';
    }
  }

  async function downloadStems() {
    if (!orchestrator) return;
    await orchestrator.stemRecorder.downloadAllStems();
  }

  function downloadData() {
    if (!orchestrator) return;
    orchestrator.dataRecorder.downloadJSON();
  }
</script>

<div class="app">
  <header>
    <h1>DataSonification</h1>
    <span class="version">v{VERSION} "{CODENAME}"</span>
  </header>

  <div class="status-bar">
    <span class="status-dot" class:connected={running}></span>
    <span class="status-text">{statusMessage}</span>
  </div>

  <div class="layout">
    <div class="sidebar">
      <FlightConfig />

      <div class="preset-select">
        <h3>Preset</h3>
        <select bind:value={selectedPreset}>
          <option value="drone">Flight Drone</option>
          <option value="ambient">Flight Ambient</option>
        </select>
      </div>

      <MasterControls
        onGainChange={(v) => orchestrator?.synth.setMasterGain(v)}
        onReverbChange={(v) => orchestrator?.synth.setReverbSend(v)}
        onDelayChange={(v) => orchestrator?.synth.setDelaySend(v)}
        onRecordToggle={toggleRecording}
      />

      <div class="transport">
        {#if !running}
          <button class="start-btn" onclick={start}>
            Start
          </button>
        {:else}
          <button class="stop-btn" onclick={stop}>
            Stop
          </button>
        {/if}
      </div>

      {#if recording || orchestrator?.dataRecorder.frameCount}
        <div class="export-buttons">
          <button onclick={downloadStems}>Download Stems</button>
          <button onclick={downloadData}>Download Data</button>
        </div>
      {/if}
    </div>

    <div class="main-panel">
      <VoiceMonitor />
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    background: #111;
    color: #ddd;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #fff;
  }

  .version {
    font-size: 0.75rem;
    color: #666;
    font-family: monospace;
  }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid #222;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #555;
  }

  .status-dot.connected {
    background: #4caf50;
    box-shadow: 0 0 6px #4caf50;
  }

  .status-text {
    font-size: 0.8rem;
    color: #888;
  }

  .layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1rem;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .main-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preset-select {
    padding: 1rem;
    border: 1px solid #333;
    border-radius: 8px;
    background: #1a1a1a;
  }

  .preset-select h3 {
    margin: 0 0 0.5rem 0;
    color: #ccc;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preset-select select {
    width: 100%;
    padding: 0.4rem;
    background: #222;
    border: 1px solid #444;
    border-radius: 4px;
    color: #ccc;
    font-size: 0.85rem;
  }

  .transport {
    display: flex;
    gap: 0.5rem;
  }

  .transport button {
    flex: 1;
    padding: 0.8rem;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .start-btn {
    background: #4caf50;
    color: #fff;
  }

  .start-btn:hover {
    background: #43a047;
  }

  .stop-btn {
    background: #c62828;
    color: #fff;
  }

  .stop-btn:hover {
    background: #b71c1c;
  }

  .export-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .export-buttons button {
    flex: 1;
    padding: 0.5rem;
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    color: #ccc;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .export-buttons button:hover {
    background: #444;
  }

  @media (max-width: 768px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
