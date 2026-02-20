# DataSonification - Development Plan

> A modular synth engine driven by real-time data streams — flights, ships, earthquakes, solar wind, lightning, tides, Wikipedia edits, cryptocurrency, and more.

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Layer](#3-data-layer)
4. [Synth Engine](#4-synth-engine)
5. [Tracking Modes](#5-tracking-modes)
6. [Mapping Engine](#6-mapping-engine)
7. [UI / Interface](#7-ui--interface)
8. [Feature Roadmap](#8-feature-roadmap)
9. [Tech Stack](#9-tech-stack)
10. [Data Sources Summary](#10-data-sources-summary)

---

## 1. Vision & Philosophy

The core idea: **the world is generating data every second, and that data has shape, rhythm, and texture.** This project turns those data streams into sound — not as a gimmick, but as a genuine instrument/installation.

### Design Principles

- **Modular**: Any data source can drive any synth parameter. Sources and synths are decoupled.
- **Layerable**: Run multiple data sources simultaneously, each controlling its own voice or sharing control of a single voice.
- **Musical, not just audible**: Smart scaling, quantization options, and mapping curves so the output sounds intentional, not random.
- **Performable**: The UI should allow real-time tweaking of mappings, scales, ranges — like a mixing console for data-driven sound.
- **Recordable**: Capture audio output and/or data snapshots for later playback at different speeds.

### Why This Is Interesting

| Approach | Character |
|---|---|
| Live flight data, real-time | Slow, droning, meditative. A single transatlantic flight is a 7-hour evolving tone. |
| Live flight data, airport region | Dense, layered. Dozens of voices rising and falling. Approaches create descending pitch clusters. |
| Recorded flight data, sped up | Compressed drama. An entire day of departures becomes a 5-minute composition. |
| Solar wind + tides | Cosmic ambient. The sun and moon as oscillators with hour/day-scale cycles. |
| Wikipedia edits | The pulse of human knowledge. Rapid-fire events, each with size and character. |
| Lightning strikes | Stochastic percussion. Silence during clear weather, bursts during storms. |
| Bitcoin transactions | The heartbeat of money. Steady rhythm with occasional whale-sized booms. |
| Ship tracking | Glacially slow drones. Container ships crossing oceans over days. |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Flight   │ │  Ocean   │ │  Solar   │ │ Wikipedia│ │  Crypto  │ │
│  │  ADS-B    │ │  Tides   │ │  Wind    │ │  Edits   │ │  Txns    │ │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ │
│        │            │            │            │            │        │
│  ┌─────▼────────────▼────────────▼────────────▼────────────▼─────┐ │
│  │                    DATA ADAPTER LAYER                          │ │
│  │  Normalizes all sources into a unified stream of:             │ │
│  │  { sourceId, timestamp, continuous: {}, events: [] }          │ │
│  └───────────────────────────┬───────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                        MAPPING ENGINE                               │
│  Routes normalized data fields to synth parameters via             │
│  user-configurable mappings with scaling, curves, and quantization │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  altitude (0-15000m) ──[log]──[quantize C minor]──> pitch │    │
│  │  velocity (0-300m/s) ──[linear]──────────────────> filter │    │
│  │  on_ground (bool)    ──[trigger]─────────────────> gate   │    │
│  │  edit_size (bytes)   ──[exp]─────────────────────> amp    │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         SYNTH ENGINE                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │  Voice 1    │ │  Voice 2    │ │  Voice 3    │ │  Voice N    │  │
│  │  (Drone)    │ │  (Pad)      │ │  (Perc)     │ │  (...)      │  │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │             │  │
│  │ │ Osc x3  │ │ │ │ Osc x3  │ │ │ │ Noise   │ │ │             │  │
│  │ │ Filter  │ │ │ │ Filter  │ │ │ │ Filter  │ │ │             │  │
│  │ │ Amp Env │ │ │ │ Amp Env │ │ │ │ Amp Env │ │ │             │  │
│  │ │ Effects │ │ │ │ Effects │ │ │ │ Effects │ │ │             │  │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │             │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘  │
│         └───────────────┼───────────────┼───────────────┘          │
│                    ┌────▼───────────────▼────┐                     │
│                    │      MIXER / FX BUS     │                     │
│                    │  Reverb, Delay, Comp    │                     │
│                    └────────────┬────────────┘                     │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                            ┌─────▼─────┐
                            │  OUTPUT   │
                            │  WebAudio │
                            │  + Record │
                            └───────────┘
```

---

## 3. Data Layer

### 3.1 Unified Data Format

Every data source adapter normalizes its data into this structure:

```typescript
interface DataPacket {
  sourceType: string;         // "flight" | "earthquake" | "solar" | "wiki" | ...
  sourceId: string;           // unique per-entity ID (icao24, station ID, etc.)
  timestamp: number;          // ms since epoch

  // Continuous numerical values (updated regularly, drive drones/tones)
  continuous: {
    [paramName: string]: {
      value: number;
      min: number;            // expected range min
      max: number;            // expected range max
      unit: string;           // "meters" | "m/s" | "degrees" | ...
    }
  };

  // Discrete events (one-shot triggers)
  events: Array<{
    type: string;             // "landed" | "departed" | "quake" | "edit" | ...
    severity: number;         // 0.0 - 1.0 normalized intensity
    metadata: Record<string, any>;
  }>;
}
```

### 3.2 Data Source Adapters

Each source has an adapter class that handles:
- Connection management (REST polling, WebSocket, SSE)
- Rate limiting and retry logic
- Parsing raw API responses into `DataPacket` format
- Entity lifecycle (tracking when aircraft/ships appear and disappear)

#### Priority Data Sources (Phase 1)

| Source | Protocol | Adapter Type | Auth |
|---|---|---|---|
| **adsb.lol** | REST poll | `ADS-B v2` | None |
| **Airplanes.live** | REST poll | `ADS-B v2` | None |
| **OpenSky Network** | REST poll | Custom | None/Free account |
| **USGS Earthquakes** | REST poll | GeoJSON | None |
| **NOAA Solar Wind** | REST poll | JSON array | None |
| **Wikipedia EventStreams** | SSE stream | SSE | None |

#### Phase 2

| Source | Protocol | Auth |
|---|---|---|
| **NOAA Tides & Currents** | REST poll | None |
| **Blitzortung Lightning** | WebSocket | None |
| **Blockchain.com BTC** | WebSocket | None |
| **CoinCap Prices** | WebSocket | None |
| **ISS Position** | REST poll | None |

#### Phase 3

| Source | Protocol | Auth |
|---|---|---|
| **AISStream Ships** | WebSocket | Free key |
| **NDBC Buoy Data** | HTTP text | None |
| **N2YO Satellites** | REST poll | Free key |
| **Cloudflare Radar** | REST poll | Free account |
| **GTFS Transit** | Protobuf/REST | Varies |

### 3.3 Data Recorder / Playback

- Record raw `DataPacket` streams to JSON/binary files with timestamps
- Play back recordings at arbitrary speed (1x, 2x, 10x, 100x, 1000x)
- Scrub through recordings
- This is critical for the "sped up previous flights" use case and for offline/demo use

---

## 4. Synth Engine

Built on the **Web Audio API** for browser-based operation. The engine is modular and polyphonic.

### 4.1 Voice Architecture

Each voice is a self-contained signal chain:

```
┌──────────────────────────────────────────────────────────┐
│                        VOICE                              │
│                                                           │
│  ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌────────┐ │
│  │  OSC A  │──▶│         │   │          │   │        │ │
│  │ (type,  │   │         │   │          │   │        │ │
│  │  detune)│   │  FILTER │──▶│  AMP     │──▶│ VOICE  │ │
│  ├─────────┤   │ (type,  │   │ ENVELOPE │   │ OUTPUT │ │
│  │  OSC B  │──▶│  freq,  │   │ (ADSR)   │   │        │ │
│  │ (type,  │   │  Q,     │   │          │   │        │ │
│  │  detune)│   │  env)   │   │          │   │        │ │
│  ├─────────┤   │         │   │          │   │        │ │
│  │  OSC C  │──▶│         │   │          │   │        │ │
│  │ (sub/   │   │         │   │          │   │        │ │
│  │  noise) │   │         │   │          │   │        │ │
│  └─────────┘   └─────────┘   └──────────┘   └────────┘ │
│                                                 │        │
│  ┌──────────────────────────────────────────────┘        │
│  │                                                       │
│  ▼                                                       │
│  ┌──────────────────────────────────────────────┐        │
│  │            VOICE EFFECTS                      │        │
│  │  Distortion ──▶ Chorus ──▶ Phaser            │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Oscillator Types

| Type | Character | Best For |
|---|---|---|
| `sine` | Pure, clean | Sub bass, clean tones, solar wind |
| `triangle` | Soft, hollow | Pads, mellow drones |
| `sawtooth` | Bright, rich | Leads, rich drones, ship tracking |
| `square` | Hollow, digital | Percussive tones, event triggers |
| `pwm` (pulse width mod) | Evolving, buzzy | Living textures, flight drones |
| `noise-white` | Full spectrum | Percussion, wind, lightning |
| `noise-pink` | Warmer noise | Ocean, atmosphere |
| `noise-brown` | Low rumble | Earthquakes, deep drones |
| `custom` | Wavetable | User-designed timbres |

### 4.3 Filter Section

- **Types**: lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf
- **Controllable parameters**: cutoff frequency, resonance (Q), envelope amount
- **Filter envelope**: Separate ADSR for filter cutoff modulation
- **Key tracking**: Filter frequency follows pitch (configurable amount)

### 4.4 Envelope Generators

Two envelopes per voice (amplitude and filter), each with:

| Parameter | Range | Description |
|---|---|---|
| Attack | 0ms - 30s | Rise time. Long for drones, instant for triggers. |
| Decay | 0ms - 30s | Fall to sustain level |
| Sustain | 0.0 - 1.0 | Held level (continuous data keeps gate open) |
| Release | 0ms - 60s | Fade after gate closes (entity disappears/lands) |

**Drone mode** (continuous data): Gate stays open as long as data is flowing. Sustain level matters most. Attack fires when an entity first appears. Release fires when it disappears.

**Trigger mode** (event data): Full ADSR cycle fires on each event. Short attack for percussive hits. Long release for resonant tails.

### 4.5 Modulation Matrix

An LFO section with data-driven rate and depth:

| LFO Parameter | Description |
|---|---|
| Rate | 0.01 Hz - 100 Hz (can be driven by data) |
| Shape | sine, triangle, saw, square, random (S&H) |
| Depth | 0 - 100% (can be driven by data) |
| Target | Any voice parameter (pitch, filter, amplitude, pan, etc.) |

**Key concept**: Data streams can control LFO parameters, which in turn modulate synth parameters. This creates complex, evolving textures from simple data.

### 4.6 Effects Bus

#### Per-Voice Effects
- Distortion/waveshaping (soft clip, hard clip, foldback)
- Chorus/ensemble (thicken drones)
- Phaser (sweeping textures)

#### Global Effects (send buses)
- **Reverb**: Convolution or algorithmic. Size can be data-driven (ISS footprint, earthquake depth).
- **Delay**: Tempo-synced or free. Delay time can be data-driven.
- **Compressor**: Tame dynamic range when many voices are active.
- **Limiter**: Safety on the master bus.

### 4.7 Mixer

| Feature | Description |
|---|---|
| Per-voice level | Individual volume control |
| Per-voice pan | Stereo position (can be driven by longitude/heading) |
| Per-voice mute/solo | Quick audition |
| Send levels | Amount to reverb/delay buses |
| Master level | Overall output |
| Master limiter | Prevent clipping |

### 4.8 Voice Allocation

Two models for how data entities map to synth voices:

**Polyphonic mode**: Each entity (aircraft, ship, etc.) gets its own voice. Voices are allocated dynamically. When an entity disappears, its voice enters the release phase and is reclaimed. Maximum polyphony is configurable (8, 16, 32, 64 voices). Voice stealing (quietest-first or oldest-first) when max is reached.

**Monophonic mode**: All entities of a type are aggregated (averaged, summed, min/max) into a single voice. Good for "how does the entire airport sound" rather than individual flights.

**Unison/Stacked mode**: A cluster of entities shares a single voice but each detunes slightly, creating thick textures. Good for tracking all flights to a single destination.

---

## 5. Tracking Modes

These modes define *what* data to pull and *how* to organize it into voices.

### 5.1 Flight Modes

#### Mode 1: Individual Flight Tracking
- **Input**: One or more callsigns/flight numbers (e.g., `UAL123`, `BAW456`)
- **Voice allocation**: One voice per flight
- **Behavior**: Each flight's telemetry (altitude, speed, heading, vertical rate) drives its own voice. The voice is born at first detection and dies when the flight lands or leaves coverage.
- **Sonification character**: Intimate. You hear each flight's individual journey — the climb, the cruise, the descent.
- **Creative twist**: Assign each flight a different oscillator type or key. Two flights on parallel routes become a duet.

#### Mode 2: Airport Zone Tracking
- **Input**: Airport ICAO code(s) and radius (e.g., `KJFK` 50nm)
- **Voice allocation**: One voice per aircraft in the zone (polyphonic) or one aggregated voice (monophonic)
- **Data source**: ADS-B point/bounding-box queries centered on airport coordinates
- **Behavior (Polyphonic)**: Every aircraft in the zone gets a voice. Departures climb in pitch. Arrivals descend. Overflights hold steady. Dense traffic = dense harmony.
- **Behavior (Monophonic)**: Aggregate stats drive a single voice — average altitude, total aircraft count (drives polyphony/chord density), ratio of climbing vs descending (drives mood/register).
- **Creative twist — "Approach Harmony"**: Aircraft on final approach are flying nearly the same heading, same glideslope, but at different distances. Map their distance-to-runway as a chord where each aircraft is a note. As they land, notes drop out. As new ones join the approach, new notes appear. The chord constantly evolves.

#### Mode 3: Airport Events / Status Board
- **Input**: One or more airport codes
- **Voice allocation**: Event-triggered (trigger mode envelopes)
- **Data derived from**: Monitoring aircraft entering/leaving the airport zone, on_ground state changes
- **Events tracked**:

| Event | Detection Method | Sound Character |
|---|---|---|
| Takeoff | `on_ground` transitions false → true altitude climb | Rising tone, bright attack |
| Landing | Altitude descent, `on_ground` transitions to true | Descending tone, soft thud |
| Go-around | Altitude drops below threshold then climbs | Dramatic pitch reversal |
| New arrival entering zone | New aircraft appears in bounding box, descending | Gentle chime |
| Departure leaving zone | Aircraft exits bounding box, climbing | Fading tone |
| Emergency | Squawk 7500/7600/7700 | Alarm, dissonant interval |

- **Aggregate continuous data**:
  - Active flight count → drone pitch or chord density
  - Average ground speed in zone → tempo/pulse rate
  - Ratio departures:arrivals → stereo balance (departures left, arrivals right)

- **Creative twist — "Airport as Organism"**: Think of the airport as a living thing that breathes. Departures are exhales. Arrivals are inhales. The breathing rate and depth change throughout the day. Rush hour is hyperventilation. 3 AM is deep, slow breaths.

#### Mode 4: Route / Corridor Tracking
- **Input**: Two airport codes (origin/destination pair) or a geographic corridor (lat/lon box)
- **Voice allocation**: All flights on that route/in that corridor
- **Behavior**: Track every aircraft flying between two cities. Each one is at a different phase of its journey. Map journey-completion-percentage (0% = just departed, 100% = about to land) to pitch or position. The entire route becomes a single evolving soundscape.
- **Creative twist — "The Red Eye"**: Pick a specific overnight route (e.g., LAX→JFK). Record it. Play it back at 100x speed. A 5-hour flight becomes a 3-minute piece with clear takeoff, cruise, and landing acts.

#### Mode 5: Fleet Tracking
- **Input**: Aircraft type code (e.g., `A388` for A380, `B748` for 747-8)
- **Voice allocation**: One voice per aircraft of that type currently airborne
- **Behavior**: Track every A380 in the sky simultaneously. They're flying at similar altitudes and speeds but in different directions, over different continents. Each one is a slightly different voice in a massive chord.
- **Creative twist**: A380s have a particular sonic character (deep, heavy). 737s are lighter, more numerous. Mix them.

### 5.2 Non-Flight Modes

#### Mode 6: Seismic Sonification
- **Source**: USGS Earthquake API
- **Continuous**: Global seismic event rate as background drone density
- **Events**: Each earthquake triggers a sound:
  - Magnitude → amplitude and duration (exponential scaling — M5 is 10x louder than M4)
  - Depth → pitch (deeper quakes = lower pitch, shallow = higher)
  - Location → stereo pan (longitude) and reverb (distance from listener reference point)
- **Creative twist — "Ring of Fire"**: Place the listener in the center of the Pacific. Earthquakes along the Ring of Fire create a surround-sound experience of tectonic percussion.

#### Mode 7: Solar Wind Drone
- **Source**: NOAA SWPC solar wind plasma + magnetometer
- **Continuous parameters**:
  - Solar wind speed (300-800 km/s) → base pitch of a drone
  - Proton density → filter resonance (denser = more resonant)
  - Temperature → brightness/harmonic content
  - Bz magnetic field → chord quality (positive Bz = major/bright, negative = minor/dark, approaching zero = tension/dissonance)
  - Bt total field → amplitude
- **Events**: Geomagnetic storm onset (Bz goes strongly negative) triggers dramatic shift
- **Creative twist**: This is literally the sound of the sun. Pair it with ISS position (latitude as slow vibrato) for "sounds from orbit."

#### Mode 8: Tidal Breathing
- **Source**: NOAA Tides & Currents
- **Continuous**: Water level from multiple stations creates interlocking slow oscillations
  - Water level → pitch (slow, ~12.4 hour cycle per station)
  - Wind speed → noise amount / texture
  - Air pressure → filter cutoff
  - Water temperature → warmth / harmonic content
- **Creative twist — "East Coast Choir"**: Select 5-10 tide stations along the Eastern seaboard. Each is a voice. High tide moves northward, creating a wave of pitch that sweeps across the voices over hours. Speed it up 360x and a day becomes 4 minutes of phasing chords.

#### Mode 9: Wikipedia Pulse
- **Source**: Wikimedia EventStreams SSE
- **Event-based** with aggregate continuous:
  - Each edit is a trigger hit. Edit size (bytes added/removed) → amplitude. Namespace → pitch register. Bot edits → different timbre than human edits.
  - Aggregate rate (edits/second) → background drone intensity
  - Which wiki (language) → stereo position or channel assignment
- **Creative twist — "Edit Wars"**: Monitor a single controversial article. Each edit to that article triggers a distinct sound. Reverts are opposing tones. The sonic texture reveals the human conflict happening in real-time.

#### Mode 10: Crypto Pulse
- **Sources**: Blockchain.com WebSocket (transactions) + CoinCap WebSocket (prices)
- **Transactions**: Each BTC transaction is a trigger. Value → pitch (log scale: dust transactions are high ticks, whale transfers are deep booms). Input/output count → complexity/texture.
- **Price**: Continuous price stream drives a drone. Price going up = rising pitch. Price going down = falling pitch. Volatility (rate of change) = filter modulation.
- **Creative twist**: Layer BTC, ETH, and other assets. Each is a different instrument. Correlated price movements create harmony. Divergences create dissonance.

#### Mode 11: Lightning Orchestra
- **Source**: Blitzortung WebSocket
- **Event-based**: Each strike is a percussive trigger
  - Location → stereo pan (longitude) and pitch (latitude)
  - Signal count (detecting stations) → amplitude/intensity
  - Strike rate → density, from silence to chaos
- **Creative twist**: During an active thunderstorm, strikes come in rapid bursts. Speed up a recording of a storm front moving across a continent, and you get a sweeping wave of percussion.

#### Mode 12: Ship Drones
- **Source**: AISStream WebSocket
- **Continuous**: Ships are the slowest-moving entities. Perfect for deep, evolving drones.
  - Speed over ground → pitch (very slow, 0-25 knots)
  - Heading → pan position
  - Rate of turn → pitch bend
  - Navigation status → timbre (underway = sawtooth, anchored = sine, moored = triangle)
- **Creative twist — "The Strait"**: Monitor a major shipping lane (Strait of Hormuz, English Channel, Strait of Malacca). Dozens of ships, all moving slowly in similar directions, create a thick cluster drone that evolves over hours.

### 5.3 Composite / Layered Modes

#### "Planet Earth" Preset
Layer everything:
- Solar wind as the deep background drone (Layer 1)
- Tides as slow-moving harmony (Layer 1)
- Flight data as mid-register melodic voices (Layer 2)
- Wikipedia edits as hi-hat rhythm (Layer 3)
- Earthquakes as bass percussion (Layer 3)
- Lightning as crashes and fills (Layer 3)

#### "Airport at Night" Preset
- Airport zone tracking at a major hub (Layer 2, polyphonic)
- Nearby tide station as background texture (Layer 1)
- Local weather (wind) as noise layer (Layer 1)
- Landing/takeoff events as accents (Layer 3)

#### "Cosmic" Preset
- Solar wind drone (primary voice)
- ISS position as slow modulation
- Satellite count overhead as chord density
- Geomagnetic Kp index as mood/key selection

---

## 6. Mapping Engine

The mapping engine is the bridge between raw data and synth parameters. This is where the musical intelligence lives.

### 6.1 Mapping Configuration

```typescript
interface Mapping {
  source: {
    type: string;           // data source type
    field: string;          // field path (e.g., "continuous.altitude.value")
    entityFilter?: string;  // optional filter (e.g., specific callsign)
  };
  target: {
    voice: string | number; // voice ID or "global"
    parameter: string;      // synth parameter (pitch, filterFreq, amplitude, pan, etc.)
  };
  transform: {
    inputRange: [number, number];   // expected data range
    outputRange: [number, number];  // target parameter range
    curve: "linear" | "log" | "exp" | "scurve" | "custom";
    smoothing: number;              // 0-1, interpolation between updates
    quantize?: {
      scale: string;                // "chromatic" | "major" | "minor" | "pentatonic" | ...
      rootNote: string;             // "C" | "C#" | ... | "B"
    };
    clamp: boolean;                 // clamp to output range or allow overflow
    invert: boolean;                // flip the mapping direction
  };
}
```

### 6.2 Transform Curves

| Curve | Formula | Best For |
|---|---|---|
| `linear` | `y = x` | Even distribution (heading, longitude) |
| `log` | `y = log(x)` | Wide-range values (altitude, transaction value) |
| `exp` | `y = x^n` | Emphasis on extremes (earthquake magnitude) |
| `scurve` | Sigmoid | Soft limiting at extremes (velocity) |

### 6.3 Musical Quantization

Raw data mapped to pitch can be quantized to musical scales:

| Scale | Notes | Character |
|---|---|---|
| Chromatic | All 12 | Unfiltered, atonal |
| Major | 7 notes | Bright, happy |
| Natural Minor | 7 notes | Dark, melancholic |
| Pentatonic Major | 5 notes | Universally pleasant |
| Pentatonic Minor | 5 notes | Bluesy, evocative |
| Whole Tone | 6 notes | Dreamy, ambiguous |
| Dorian | 7 notes | Jazzy, sophisticated |
| Mixolydian | 7 notes | Folk-like, open |
| Harmonic Minor | 7 notes | Eastern, dramatic |
| Octatonic (Dim) | 8 notes | Tense, symmetric |
| Just Intonation | Ratio-based | Pure intervals, drone-friendly |
| Pythagorean | Fifth-stacking | Ancient, resonant |
| Bohlen-Pierce | Non-octave | Alien, otherworldly |
| None (Hz) | Continuous | Microtonal, true data representation |

### 6.4 Smoothing

Data arrives in discrete updates (every 1-10 seconds for flight data). Raw mapping would create stepped, jumpy parameter changes. The smoothing parameter controls a low-pass filter on the mapped value:

- `0.0` = no smoothing (instant jumps, good for triggers)
- `0.5` = moderate smoothing (reaches target in ~1 second)
- `0.9` = heavy smoothing (slow glide, good for drones)
- `0.99` = glacial smoothing (very slow evolution)

### 6.5 Aggregate Functions

When multiple entities feed a single parameter (monophonic mode):

| Function | Description | Use Case |
|---|---|---|
| `average` | Mean of all values | General smoothing |
| `median` | Middle value | Resistant to outliers |
| `sum` | Total | Count-based (density) |
| `min` / `max` | Extremes | Range-based effects |
| `range` | max - min | Spread/width |
| `stddev` | Standard deviation | Chaos/order measure |
| `newest` | Most recent entity | Priority voice |

---

## 7. UI / Interface

### 7.1 Main Views

#### Source Panel
- Active data sources with connection status indicators
- Entity count per source
- Real-time data preview (latest values, sparkline graphs)
- Source configuration (polling interval, geographic filters, entity filters)

#### Voice Panel
- Visual representation of each voice's signal chain
- Real-time level meters
- Oscillator type selectors
- Filter controls (knobs for cutoff, resonance)
- Envelope visualizers (animated ADSR curves)
- Mute/solo/pan per voice

#### Mapping Panel
- Drag-and-drop: data fields on the left, synth parameters on the right
- Visual connection lines showing active mappings
- Inline curve editors for each mapping
- Scale/quantize selectors
- Smoothing slider

#### Visualization Panel
- Map view showing tracked entities (aircraft on a map, earthquake dots, etc.)
- Waveform/spectrum analyzer for audio output
- Parameter value history graphs
- Optional: 3D globe view for "Planet Earth" mode

#### Transport / Recorder
- Live / Playback mode toggle
- Playback speed control (0.1x to 1000x)
- Record button (captures both data and audio)
- Timeline scrubber for recordings

### 7.2 Presets System

- Save/load entire configurations (sources + mappings + synth settings)
- Ship with curated presets for each mode
- Shareable as JSON files

---

## 8. Feature Roadmap

### Phase 1: Foundation (MVP)
**Goal**: Single flight tracking with basic synth, proves the concept.

- [ ] Project scaffolding (TypeScript, Web Audio API, basic UI framework)
- [ ] ADS-B data adapter (adsb.lol or airplanes.live — no auth required)
- [ ] Unified DataPacket format and data pipeline
- [ ] Basic synth engine: 1 oscillator, 1 filter, 1 ADSR envelope per voice
- [ ] Mapping engine with linear/log curves
- [ ] Individual flight tracking mode (Mode 1): enter a callsign, hear it
- [ ] Basic UI: source config, voice controls, simple mapping interface
- [ ] Audio output via Web Audio API

### Phase 2: Musical Depth
**Goal**: Make it sound genuinely good.

- [ ] Full voice architecture (3 oscillators, filter envelope, LFO)
- [ ] Musical quantization (scale selection, root note)
- [ ] Smoothing engine for continuous parameter changes
- [ ] Effects: reverb, delay, chorus
- [ ] Mixer with per-voice levels, pan, sends
- [ ] Airport zone tracking mode (Mode 2)
- [ ] Airport events mode (Mode 3) with trigger envelopes
- [ ] Voice allocation (polyphonic mode with voice stealing)
- [ ] Preset save/load system

### Phase 3: Multi-Source
**Goal**: Layer multiple data sources for rich textures.

- [ ] USGS Earthquake adapter
- [ ] NOAA Solar Wind adapter
- [ ] Wikipedia EventStreams adapter (SSE)
- [ ] NOAA Tides adapter
- [ ] Composite mode (multiple sources layered)
- [ ] Aggregate functions for monophonic mode
- [ ] Map visualization of tracked entities
- [ ] Data recorder / playback engine
- [ ] Playback speed control

### Phase 4: Advanced Synth
**Goal**: Deep sound design capabilities.

- [ ] Wavetable oscillator with custom tables
- [ ] Modulation matrix (any source → any target)
- [ ] Per-voice effect chains
- [ ] Additional oscillator types (PWM, noise colors)
- [ ] Microtuning support (Just Intonation, Pythagorean, custom)
- [ ] Sidechain between voices (e.g., earthquakes duck the drone)
- [ ] Audio recording / export (WAV/MP3)

### Phase 5: All the Sources
**Goal**: Complete the data source library.

- [ ] Blitzortung Lightning adapter (WebSocket)
- [ ] Blockchain.com Bitcoin adapter (WebSocket)
- [ ] CoinCap crypto prices adapter (WebSocket)
- [ ] AISStream ship tracking adapter (WebSocket)
- [ ] ISS position adapter
- [ ] NDBC Buoy data adapter
- [ ] GTFS transit adapter
- [ ] N2YO satellite adapter

### Phase 6: Polish & Performance
**Goal**: Installation-quality stability and UX.

- [ ] Route/corridor tracking mode (Mode 4)
- [ ] Fleet tracking mode (Mode 5)
- [ ] All non-flight modes (6-12)
- [ ] Curated presets for all modes
- [ ] 3D globe visualization
- [ ] Performance optimization (Web Workers for data processing)
- [ ] MIDI output (send to external hardware synths)
- [ ] OSC output (send to Max/MSP, SuperCollider, Ableton, etc.)
- [ ] PWA / installable app
- [ ] Documentation and tutorial

---

## 9. Tech Stack

### Recommended Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Language** | TypeScript | Type safety critical for complex mappings |
| **Audio** | Web Audio API | Native browser, low latency, full synth capability |
| **Audio (advanced)** | Tone.js (wraps Web Audio) | Higher-level synth abstractions, scheduling, effects |
| **UI Framework** | React or Svelte | Component-based, reactive state |
| **State Management** | Zustand or Svelte stores | Lightweight, suitable for real-time state |
| **Visualization** | Canvas 2D / deck.gl | Maps for entity tracking, lightweight |
| **Data Streaming** | Native EventSource (SSE), WebSocket API | Built-in browser APIs |
| **Build** | Vite | Fast HMR, good TypeScript support |
| **Testing** | Vitest | Fast, Vite-native |

### Alternative: Desktop App

If browser limitations become an issue (audio latency, background processing):

| Layer | Technology |
|---|---|
| **Runtime** | Electron or Tauri |
| **Audio** | PortAudio via native bindings, or SuperCollider as backend |
| **Benefit** | Lower latency, no tab-suspension issues, MIDI/OSC native |

### Alternative: Node.js CLI / Headless

For "installation" use where UI isn't needed:

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Audio** | SuperCollider (via OSC from Node), or sox/ffmpeg for recording |
| **Benefit** | Run on a Raspberry Pi driving speakers |

---

## 10. Data Sources Summary

### Zero Auth Required (Highest Priority)

| Source | Data Type | Protocol | Update Rate | Sonification Quality |
|---|---|---|---|---|
| **adsb.lol** | Flight telemetry | REST | 1s (no limit) | Excellent - continuous |
| **Airplanes.live** | Flight telemetry | REST | 1s | Excellent - continuous |
| **OpenSky Network** | Flight telemetry | REST | 5-10s | Excellent - continuous |
| **USGS Earthquakes** | Seismic events | REST | ~minutes | Good - event-based |
| **NOAA Solar Wind** | Plasma & magnetic | REST | 60s | Excellent - continuous |
| **NOAA Tides** | Water level, weather | REST | 1-6min | Excellent - continuous |
| **NDBC Buoys** | Waves, weather | HTTP text | 10-60min | Excellent - continuous |
| **Wikipedia EventStreams** | Edit events | SSE | Real-time (~5-20/s) | Outstanding - streaming |
| **Blitzortung Lightning** | Strike events | WebSocket | Real-time (variable) | Excellent - streaming |
| **Blockchain.com BTC** | Transactions | WebSocket | Real-time (~4-7/s) | Excellent - streaming |
| **CoinCap Prices** | Crypto prices | WebSocket | Real-time (sub-second) | Excellent - streaming |
| **ISS Position** | Orbital position | REST | 1s | Good - continuous |
| **NWS Weather** | Forecasts, alerts | REST | Hourly | Moderate - slow |

### Free Account / API Key Required

| Source | Data Type | Auth | Sonification Quality |
|---|---|---|---|
| **AISStream** | Ship tracking | Free key | Excellent - streaming |
| **N2YO Satellites** | Satellite positions | Free key | Good - continuous |
| **Cloudflare Radar** | Internet traffic | Free account | Moderate - event-based |
| **GitHub Events** | Code activity | Optional (better with) | Moderate - event-based |
| **FlightAware AeroAPI** | Processed flight data | Free tier (limited) | Moderate - limited calls |

### Other Potential Sources Worth Exploring

| Source | What | Why It's Interesting |
|---|---|---|
| **Radioactivity (EURDEP)** | European radiation monitoring network | Slow-changing continuous data from hundreds of stations |
| **River gauges (USGS Water)** | Real-time water flow and gauge height at thousands of US rivers | `waterservices.usgs.gov` - free, no auth, continuous |
| **Air quality (OpenAQ)** | Global air quality measurements | PM2.5, ozone, NO2 from thousands of stations |
| **Volcanic activity (USGS)** | Volcano alert levels and eruption data | Rare but dramatic events |
| **Aurora forecast (NOAA)** | Aurora borealis probability | Pairs with solar wind data |
| **Whale tracking (movebank.org)** | Animal telemetry data | Migration paths as very slow melodies |
| **Satellite imagery bands** | Spectral data from Landsat/Sentinel | Turn light wavelengths into sound wavelengths |
| **Gravitational waves (LIGO)** | Spacetime ripple detections | Already sonified by scientists — extend the concept |

---

## Appendix: Inspirations & Prior Art

- **Listentothe.cloud** — Air traffic control audio mixed with ambient music
- **Bitcoin Monitor** — Early BTC transaction sonification
- **Earthquake sonification** — Various academic projects mapping seismic data to sound
- **Brian Eno's generative music** — Rules-based music generation, same philosophy
- **Radiohead's "Polyfauna"** — Data-driven audio landscapes
- **NASA Sonification Project** — Converting astronomical data to sound

---

*This document is a living plan. Sections will be updated as decisions are made and implementation progresses. See `DATA_SOURCES_RESEARCH.md` for detailed API endpoint documentation.*
