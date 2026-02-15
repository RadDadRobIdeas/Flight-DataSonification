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
    trackingLabel,
    hasRecordedData,
    dataFeed,
  } from './stores';
  import FlightConfig from './ui/FlightConfig.svelte';
  import VoiceMonitor from './ui/VoiceMonitor.svelte';
  import MasterControls from './ui/MasterControls.svelte';
  import DataFeed from './ui/DataFeed.svelte';

  let orchestrator = $state<Orchestrator | null>(null);
  let adapter = $state<AdsbAdapter | null>(null);
  let running = $state(false);
  let recording = $state(false);
  let statusMessage = $state('Ready');
  let selectedPreset = $state('drone');
  let updateTimer: ReturnType<typeof setInterval> | null = null;

  // Persisted data recorder reference (survives stop for downloads)
  let lastDataRecorder = $state<import('./data/DataRecorder').DataRecorder | null>(null);

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

  /** Read current store value synchronously */
  function getStore<T>(store: { subscribe: (cb: (v: T) => void) => () => void }): T {
    let val: T;
    const unsub = store.subscribe((v) => { val = v; });
    unsub();
    return val!;
  }

  function buildAdapter(): { adapter: AdsbAdapter; label: string } {
    const mode = getStore(trackingMode);
    const callsign = getStore(callsignInput);
    const airport = getStore(airportInput);
    const radius = getStore(airportRadius);
    const acType = getStore(typeInput);

    if (mode === 'callsign' && callsign) {
      const callsigns = callsign.split(',').map((s) => s.trim()).filter(Boolean);
      return {
        adapter: new AdsbAdapter({ callsigns }),
        label: `Tracking: ${callsigns.join(', ')}`,
      };
    }

    if (mode === 'airport' && airport) {
      const coords = AIRPORT_COORDS[airport];
      if (coords) {
        return {
          adapter: new AdsbAdapter({ center: { lat: coords.lat, lon: coords.lon, radiusNm: radius } }),
          label: `Tracking: ${airport} (${radius}nm)`,
        };
      }
      // Unknown airport code — still try coordinates if user typed something
      return {
        adapter: new AdsbAdapter({ center: { lat: 40.6413, lon: -73.7781, radiusNm: radius } }),
        label: `Unknown: ${airport}. Defaulting to KJFK (${radius}nm)`,
      };
    }

    if (mode === 'type' && acType) {
      return {
        adapter: new AdsbAdapter({ aircraftType: acType }),
        label: `Tracking type: ${acType}`,
      };
    }

    // Default: JFK area
    return {
      adapter: new AdsbAdapter({ center: { lat: 40.6413, lon: -73.7781, radiusNm: 50 } }),
      label: 'Tracking: KJFK area (default)',
    };
  }

  async function start() {
    try {
      statusMessage = 'Starting audio engine...';

      orchestrator = new Orchestrator();
      await orchestrator.start();

      // Forward status messages to UI
      orchestrator.onStatus((msg) => { statusMessage = msg; });

      // Set mapping preset
      const preset = selectedPreset === 'ambient'
        ? flightAmbientPreset()
        : flightDronePreset();
      orchestrator.setMappings(preset);

      // Build adapter from current config
      const built = buildAdapter();
      adapter = built.adapter;
      statusMessage = built.label;
      trackingLabel.set(built.label);

      // Wire up adapter status changes to UI
      adapter.onStatusChange((info) => {
        if (info.status === 'error') {
          statusMessage = `Error: ${info.errorMessage}`;
        } else if (info.status === 'connected') {
          statusMessage = `${built.label} | ${info.entityCount} aircraft`;
        }
      });

      orchestrator.addDataSource(adapter);
      await orchestrator.connectAll();

      // Keep reference to data recorder for downloads after stop
      lastDataRecorder = orchestrator.dataRecorder;

      isRunning.set(true);

      // UI update loop — sync voice data to store
      updateTimer = setInterval(() => {
        if (!orchestrator) return;

        const voices = orchestrator.synth.voiceIds.map((entityId) => {
          const voice = orchestrator!.synth.getVoice(entityId);
          const meta = orchestrator!.getEntityMeta(entityId);
          return {
            entityId,
            callsign: (meta?.callsign as string) || undefined,
            pitch: voice?.currentPitch || 0,
            gain: voice ? 0.6 : 0,
            pan: 0,
            altitude: (meta?.altFeet as number) || 0,
            velocity: (meta?.groundSpeed as number) || 0,
          };
        });
        activeVoices.set(voices);

        // Update status with entity count
        const info = adapter?.info;
        if (info && info.status === 'connected') {
          statusMessage = `${built.label} | ${info.entityCount} aircraft`;
        }
      }, 500);

    } catch (err) {
      statusMessage = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error('Start failed:', err);
    }
  }

  function stop() {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }

    // Keep data recorder reference before disposing
    if (orchestrator) {
      lastDataRecorder = orchestrator.dataRecorder;
      hasRecordedData.set(lastDataRecorder.frameCount > 0);
    }

    orchestrator?.dispose();
    orchestrator = null;
    adapter = null;
    isRunning.set(false);
    activeVoices.set([]);
    statusMessage = 'Stopped';
  }

  /** Hot-swap tracking target without stopping the engine */
  async function retrack() {
    if (!orchestrator || !running) return;

    // Disconnect old adapter
    if (adapter) {
      adapter.disconnect();
    }

    // Build new adapter from current config
    const built = buildAdapter();
    adapter = built.adapter;
    statusMessage = built.label;
    trackingLabel.set(built.label);

    // Wire status
    adapter.onStatusChange((info) => {
      if (info.status === 'error') {
        statusMessage = `Error: ${info.errorMessage}`;
      } else if (info.status === 'connected') {
        statusMessage = `${built.label} | ${info.entityCount} aircraft`;
      }
    });

    orchestrator.addDataSource(adapter);
    try {
      await adapter.connect();
    } catch (err) {
      statusMessage = `Retrack error: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
  }

  // Watch for tracking config changes while running — auto-retrack
  trackingLabel.subscribe((label) => {
    if (running && label.startsWith('Queued:')) {
      retrack();
    }
  });

  function toggleRecording() {
    if (!orchestrator) return;
    if (recording) {
      orchestrator.stopRecording();
      isRecording.set(false);
      statusMessage = 'Stem recording stopped.';
    } else {
      orchestrator.startRecording();
      isRecording.set(true);
      statusMessage = 'Recording stems...';
    }
  }

  async function downloadStems() {
    if (orchestrator) {
      await orchestrator.stemRecorder.downloadAllStems();
    }
  }

  function downloadData() {
    // Use persisted recorder if orchestrator was stopped
    const recorder = orchestrator?.dataRecorder || lastDataRecorder;
    if (recorder && recorder.frameCount > 0) {
      recorder.downloadJSON();
    } else {
      statusMessage = 'No data recorded yet.';
    }
  }

  let showRecordedData = $state(false);
  hasRecordedData.subscribe((v) => { showRecordedData = v; });
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

      <div class="export-buttons">
        {#if running && recording}
          <button onclick={downloadStems}>Download Stems</button>
        {/if}
        <button onclick={downloadData}>Download Data</button>
      </div>
    </div>

    <div class="main-panel">
      <DataFeed />
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
