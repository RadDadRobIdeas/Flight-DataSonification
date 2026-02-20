<script lang="ts">
  import { trackingMode, callsignInput, airportInput, airportRadius, typeInput, trackingLabel } from '../stores';

  let callsignValue = $state('');
  let airportValue = $state('');
  let radiusValue = $state(50);
  let typeValue = $state('');
  let mode = $state<'callsign' | 'airport' | 'type'>('callsign');
  let label = $state('');

  trackingLabel.subscribe((v) => { label = v; });

  function updateMode(newMode: 'callsign' | 'airport' | 'type') {
    mode = newMode;
    trackingMode.set(newMode);
  }

  function updateCallsign() {
    const val = callsignValue.toUpperCase().trim();
    if (!val) return;
    callsignInput.set(val);
    trackingLabel.set(`Queued: ${val}`);
  }

  function updateAirport() {
    const val = airportValue.toUpperCase().trim();
    if (!val) return;
    airportInput.set(val);
    airportRadius.set(radiusValue);
    trackingLabel.set(`Queued: ${val} (${radiusValue}nm)`);
  }

  function updateType() {
    const val = typeValue.toUpperCase().trim();
    if (!val) return;
    typeInput.set(val);
    trackingLabel.set(`Queued: type ${val}`);
  }
</script>

<div class="flight-config">
  <h3>Flight Tracking</h3>

  <div class="mode-tabs">
    <button
      class:active={mode === 'callsign'}
      onclick={() => updateMode('callsign')}
    >
      Callsign
    </button>
    <button
      class:active={mode === 'airport'}
      onclick={() => updateMode('airport')}
    >
      Airport Zone
    </button>
    <button
      class:active={mode === 'type'}
      onclick={() => updateMode('type')}
    >
      Aircraft Type
    </button>
  </div>

  {#if mode === 'callsign'}
    <div class="input-group">
      <label for="callsign">Callsign / Flight Number</label>
      <div class="input-row">
        <input
          id="callsign"
          type="text"
          placeholder="e.g. UAL123, BAW456"
          bind:value={callsignValue}
          onkeydown={(e) => e.key === 'Enter' && updateCallsign()}
        />
        <button onclick={updateCallsign}>Track</button>
      </div>
      <p class="hint">Enter airline code + flight number</p>
    </div>
  {/if}

  {#if mode === 'airport'}
    <div class="input-group">
      <label for="airport">Airport ICAO Code</label>
      <div class="input-row">
        <input
          id="airport"
          type="text"
          placeholder="e.g. KJFK, EGLL, KLAX"
          bind:value={airportValue}
          onkeydown={(e) => e.key === 'Enter' && updateAirport()}
        />
        <button onclick={updateAirport}>Track</button>
      </div>
      <label for="radius">Radius: {radiusValue} nm</label>
      <input
        id="radius"
        type="range"
        min="10"
        max="250"
        bind:value={radiusValue}
      />
    </div>
  {/if}

  {#if mode === 'type'}
    <div class="input-group">
      <label for="actype">ICAO Type Code</label>
      <div class="input-row">
        <input
          id="actype"
          type="text"
          placeholder="e.g. A388, B738, B744"
          bind:value={typeValue}
          onkeydown={(e) => e.key === 'Enter' && updateType()}
        />
        <button onclick={updateType}>Track</button>
      </div>
      <p class="hint">Track all aircraft of this type worldwide</p>
    </div>
  {/if}

  {#if label}
    <div class="tracking-label">{label}</div>
  {/if}
</div>

<style>
  .flight-config {
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

  .mode-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .mode-tabs button {
    flex: 1;
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #999;
    cursor: pointer;
  }

  .mode-tabs button.active {
    background: #3a3a3a;
    color: #fff;
    border-color: #666;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
  }

  input[type="text"] {
    flex: 1;
    padding: 0.5rem;
    background: #111;
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;
    font-family: monospace;
    font-size: 0.9rem;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #4a9eff;
  }

  button {
    padding: 0.5rem 1rem;
    background: #4a9eff;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    font-size: 0.8rem;
  }

  button:hover {
    background: #3a8eef;
  }

  .hint {
    font-size: 0.7rem;
    color: #666;
    margin: 0;
  }

  .tracking-label {
    margin-top: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #252525;
    border: 1px solid #444;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #4a9eff;
    font-family: monospace;
  }
</style>
