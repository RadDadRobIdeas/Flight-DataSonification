// ADS-B data adapter using adsb.lol (primary) and airplanes.live (fallback).
// Both use the same v2 API format. No authentication required.

import type { DataPacket, DataSourceAdapter, DataSourceInfo } from '../types/data';

// Raw ADS-B v2 aircraft object from the API
interface AdsbAircraft {
  hex: string;         // ICAO 24-bit address
  flight?: string;     // callsign (trimmed)
  alt_baro?: number | 'ground';
  alt_geom?: number;   // geometric altitude (feet)
  gs?: number;         // ground speed (knots)
  track?: number;      // true track (degrees)
  baro_rate?: number;  // vertical rate (ft/min)
  geom_rate?: number;
  squawk?: string;
  emergency?: string;
  category?: string;
  lat?: number;
  lon?: number;
  ias?: number;        // indicated airspeed
  tas?: number;        // true airspeed
  mach?: number;
  wd?: number;         // wind direction
  ws?: number;         // wind speed
  oat?: number;        // outside air temp
  nav_heading?: number;
  nav_altitude_mcp?: number;
  seen?: number;       // seconds since last message
  seen_pos?: number;
  rssi?: number;       // signal strength dBFS
}

interface AdsbResponse {
  ac?: AdsbAircraft[];
  msg?: string;
  now?: number;
  total?: number;
  ctime?: number;
  ptime?: number;
}

export type AdsbProvider = 'adsb.lol' | 'airplanes.live';

interface AdsbAdapterConfig {
  provider?: AdsbProvider;
  pollIntervalMs?: number;
  // Tracking mode configs
  callsigns?: string[];           // Mode 1: specific flights
  center?: { lat: number; lon: number; radiusNm: number }; // Mode 2: airport zone
  aircraftType?: string;          // Mode 5: fleet tracking
}

const API_BASES: Record<AdsbProvider, string> = {
  'adsb.lol': 'https://api.adsb.lol/v2',
  'airplanes.live': 'https://api.airplanes.live/v2',
};

export class AdsbAdapter implements DataSourceAdapter {
  private config: Required<Pick<AdsbAdapterConfig, 'provider' | 'pollIntervalMs'>> & AdsbAdapterConfig;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private dataCallbacks: Array<(packet: DataPacket) => void> = [];
  private removeCallbacks: Array<(sourceId: string) => void> = [];
  private statusCallbacks: Array<(info: DataSourceInfo) => void> = [];
  private knownEntities: Set<string> = new Set();
  private _info: DataSourceInfo;

  constructor(config: AdsbAdapterConfig = {}) {
    this.config = {
      provider: config.provider || 'adsb.lol',
      pollIntervalMs: config.pollIntervalMs || 3000,
      ...config,
    };

    this._info = {
      id: `adsb-${this.config.provider}`,
      name: `ADS-B (${this.config.provider})`,
      type: 'flight',
      status: 'disconnected',
      entityCount: 0,
      lastUpdate: 0,
    };
  }

  get info(): DataSourceInfo {
    return { ...this._info };
  }

  async connect(): Promise<void> {
    this.updateStatus('connecting');

    try {
      // Initial fetch to verify connectivity
      await this.fetchAndEmit();
      this.updateStatus('connected');

      // Start polling
      this.pollTimer = setInterval(() => {
        this.fetchAndEmit().catch((err) => {
          this.updateStatus('error', err.message);
          console.error('[ADS-B] Poll error:', err);
        });
      }, this.config.pollIntervalMs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      this.updateStatus('error', msg);
      throw err;
    }
  }

  disconnect(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.updateStatus('disconnected');

    // Notify removal of all entities
    for (const entityId of this.knownEntities) {
      for (const cb of this.removeCallbacks) cb(entityId);
    }
    this.knownEntities.clear();
  }

  onData(callback: (packet: DataPacket) => void): void {
    this.dataCallbacks.push(callback);
  }

  onEntityRemoved(callback: (sourceId: string) => void): void {
    this.removeCallbacks.push(callback);
  }

  onStatusChange(callback: (info: DataSourceInfo) => void): void {
    this.statusCallbacks.push(callback);
  }

  /** Update tracking configuration — can be called while connected */
  updateConfig(config: Partial<AdsbAdapterConfig>): void {
    Object.assign(this.config, config);
  }

  /** Force an immediate fetch (e.g. after config change) */
  async refresh(): Promise<void> {
    await this.fetchAndEmit();
  }

  private updateStatus(status: DataSourceInfo['status'], errorMessage?: string): void {
    this._info.status = status;
    this._info.errorMessage = errorMessage;
    for (const cb of this.statusCallbacks) cb(this.info);
  }

  private async fetchAndEmit(): Promise<void> {
    const url = this.buildUrl();
    console.log('[ADS-B] Fetching:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
    }

    const data: AdsbResponse = await response.json();
    this._info.lastUpdate = Date.now();

    // Handle missing or empty aircraft array
    const aircraft = data.ac || [];
    if (aircraft.length === 0) {
      console.log('[ADS-B] Response has 0 aircraft. msg:', data.msg, 'total:', data.total);
    } else {
      console.log(`[ADS-B] Received ${aircraft.length} aircraft`);
    }

    const currentEntities = new Set<string>();

    for (const ac of aircraft) {
      // Skip aircraft without position data
      if (ac.lat === undefined || ac.lon === undefined) continue;

      // Filter by callsign if in Mode 1
      if (this.config.callsigns && this.config.callsigns.length > 0) {
        const callsign = ac.flight?.trim();
        if (!callsign || !this.config.callsigns.some(
          (cs) => callsign.toUpperCase().startsWith(cs.toUpperCase())
        )) {
          continue;
        }
      }

      const entityId = ac.hex;
      currentEntities.add(entityId);

      const packet = this.aircraftToPacket(ac);
      for (const cb of this.dataCallbacks) cb(packet);
    }

    // Detect removed entities
    for (const prevEntity of this.knownEntities) {
      if (!currentEntities.has(prevEntity)) {
        for (const cb of this.removeCallbacks) cb(prevEntity);
      }
    }

    this.knownEntities = currentEntities;
    this._info.entityCount = currentEntities.size;
    this.updateStatus(this._info.status === 'error' ? 'connected' : this._info.status);
  }

  private buildUrl(): string {
    const base = API_BASES[this.config.provider];

    // Mode 1: specific callsigns — use the first callsign for API query
    // (we filter additional callsigns client-side)
    if (this.config.callsigns && this.config.callsigns.length > 0) {
      return `${base}/callsign/${this.config.callsigns[0]}`;
    }

    // Mode 2: geographic area
    if (this.config.center) {
      const { lat, lon, radiusNm } = this.config.center;
      return `${base}/point/${lat}/${lon}/${radiusNm}`;
    }

    // Mode 5: aircraft type
    if (this.config.aircraftType) {
      return `${base}/type/${this.config.aircraftType}`;
    }

    // Fallback: won't work well (returns everything) — should always have a filter
    return `${base}/point/40.6413/-73.7781/50`; // Default: JFK area
  }

  private aircraftToPacket(ac: AdsbAircraft): DataPacket {
    const onGround = ac.alt_baro === 'ground';
    const altFeet = onGround ? 0 : (typeof ac.alt_baro === 'number' ? ac.alt_baro : 0);
    const altMeters = altFeet * 0.3048;

    const packet: DataPacket = {
      sourceType: 'flight',
      sourceId: ac.hex,
      timestamp: Date.now(),
      continuous: {
        altitude: {
          value: altMeters,
          min: 0,
          max: 13716, // ~45000 feet in meters
          unit: 'meters',
        },
        velocity: {
          value: (ac.gs || 0) * 0.514444, // knots to m/s
          min: 0,
          max: 300,
          unit: 'm/s',
        },
        heading: {
          value: ac.track || 0,
          min: 0,
          max: 360,
          unit: 'degrees',
        },
        verticalRate: {
          value: (ac.baro_rate || 0) * 0.00508, // ft/min to m/s
          min: -30,
          max: 30,
          unit: 'm/s',
        },
        latitude: {
          value: ac.lat || 0,
          min: -90,
          max: 90,
          unit: 'degrees',
        },
        longitude: {
          value: ac.lon || 0,
          min: -180,
          max: 180,
          unit: 'degrees',
        },
      },
      events: [],
      // Attach metadata for display
      metadata: {
        callsign: ac.flight?.trim() || '',
        hex: ac.hex,
        altFeet: altFeet,
        groundSpeed: ac.gs || 0,
        onGround,
      },
    };

    // Add optional fields if available
    if (ac.ias !== undefined) {
      packet.continuous.indicatedAirspeed = {
        value: ac.ias * 0.514444,
        min: 0,
        max: 300,
        unit: 'm/s',
      };
    }
    if (ac.mach !== undefined) {
      packet.continuous.mach = {
        value: ac.mach,
        min: 0,
        max: 1.0,
        unit: 'mach',
      };
    }
    if (ac.rssi !== undefined) {
      packet.continuous.signalStrength = {
        value: ac.rssi,
        min: -50,
        max: 0,
        unit: 'dBFS',
      };
    }

    // Detect events
    if (onGround) {
      packet.events.push({
        type: 'on_ground',
        severity: 0.5,
        metadata: { callsign: ac.flight?.trim() },
      });
    }
    if (!this.knownEntities.has(ac.hex)) {
      packet.events.push({
        type: 'new_contact',
        severity: 0.3,
        metadata: { callsign: ac.flight?.trim(), hex: ac.hex },
      });
    }
    if (ac.squawk === '7700' || ac.squawk === '7600' || ac.squawk === '7500') {
      packet.events.push({
        type: 'emergency',
        severity: 1.0,
        metadata: { squawk: ac.squawk, callsign: ac.flight?.trim() },
      });
    }

    return packet;
  }
}
