<script lang="ts">
  import { dataFeed } from '../stores';
  import type { DataPacket } from '../types/data';

  let packets = $state<DataPacket[]>([]);
  dataFeed.subscribe((p) => { packets = p; });

  // Deduplicate by sourceId — show latest packet per entity
  function latestByEntity(feed: DataPacket[]): DataPacket[] {
    const map = new Map<string, DataPacket>();
    for (const p of feed) {
      map.set(p.sourceId, p);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aCall = (a.metadata?.callsign as string) || a.sourceId;
      const bCall = (b.metadata?.callsign as string) || b.sourceId;
      return aCall.localeCompare(bCall);
    });
  }

  function fmtAlt(p: DataPacket): string {
    const ft = Math.round(p.continuous.altitude?.value / 0.3048) || 0;
    return ft.toLocaleString() + ' ft';
  }

  function fmtSpeed(p: DataPacket): string {
    const kts = Math.round((p.continuous.velocity?.value || 0) / 0.514444);
    return kts + ' kts';
  }

  function fmtHdg(p: DataPacket): string {
    return Math.round(p.continuous.heading?.value || 0) + '\u00B0';
  }

  function fmtVRate(p: DataPacket): string {
    const fpm = Math.round((p.continuous.verticalRate?.value || 0) / 0.00508);
    if (fpm > 0) return '+' + fpm + ' fpm';
    return fpm + ' fpm';
  }
</script>

<div class="data-feed">
  <h3>Live Data <span class="count">{latestByEntity(packets).length}</span></h3>

  <div class="feed-table">
    <div class="feed-header">
      <span class="col-call">Callsign</span>
      <span class="col-alt">Altitude</span>
      <span class="col-spd">Speed</span>
      <span class="col-hdg">Hdg</span>
      <span class="col-vs">V/S</span>
    </div>

    {#each latestByEntity(packets) as p (p.sourceId)}
      <div class="feed-row">
        <span class="col-call callsign">{p.metadata?.callsign || p.sourceId}</span>
        <span class="col-alt">{fmtAlt(p)}</span>
        <span class="col-spd">{fmtSpeed(p)}</span>
        <span class="col-hdg">{fmtHdg(p)}</span>
        <span class="col-vs" class:climbing={p.continuous.verticalRate?.value > 0.5} class:descending={p.continuous.verticalRate?.value < -0.5}>{fmtVRate(p)}</span>
      </div>
    {/each}

    {#if packets.length === 0}
      <div class="empty">No data yet. Hit Start to begin tracking.</div>
    {/if}
  </div>
</div>

<style>
  .data-feed {
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

  .feed-table {
    font-family: monospace;
    font-size: 0.72rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .feed-header {
    display: flex;
    gap: 0.3rem;
    padding: 0.3rem 0.5rem;
    color: #666;
    border-bottom: 1px solid #333;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
  }

  .feed-row {
    display: flex;
    gap: 0.3rem;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid #222;
    color: #aaa;
  }

  .feed-row:hover {
    background: #222;
  }

  .col-call { width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .col-alt { width: 75px; text-align: right; }
  .col-spd { width: 60px; text-align: right; }
  .col-hdg { width: 40px; text-align: right; }
  .col-vs { width: 75px; text-align: right; }

  .callsign {
    color: #4a9eff;
    font-weight: bold;
  }

  .climbing { color: #8bc34a; }
  .descending { color: #ff9800; }

  .empty {
    color: #555;
    font-size: 0.8rem;
    padding: 1rem;
    text-align: center;
  }
</style>
