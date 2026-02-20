# DataSonification

> A modular synth engine driven by real-time data streams -- flights, earthquakes, solar wind, tides, Wikipedia edits, cryptocurrency, lightning, and more.

---

## The Idea

The world generates data every second, and that data has shape, rhythm, and texture. DataSonification turns real-time data streams into sound -- not as a novelty, but as a genuine instrument and installation platform.

Numerical telemetry (altitude, speed, temperature, price) drives continuous drone and tone parameters. Status changes and discrete events (landings, earthquakes, edits, transactions) fire one-shot triggers with their own envelopes. The result is a living, evolving soundscape shaped entirely by the real world.

---

## How It Sounds

| Approach | Character |
| --- | --- |
| Live flight data, real-time | Slow, droning, meditative. A transatlantic flight is a 7-hour evolving tone. |
| Live flight data, airport region | Dense, layered. Dozens of voices rising and falling. Approaches create descending pitch clusters. |
| Recorded flight data, sped up | Compressed drama. An entire day of departures becomes a 5-minute composition. |
| Solar wind + tides | Cosmic ambient. The sun and moon as oscillators with hour/day-scale cycles. |
| Wikipedia edits | The pulse of human knowledge. Rapid-fire events, each with size and character. |
| Lightning strikes | Stochastic percussion. Silence during clear weather, bursts during storms. |
| Bitcoin transactions | The heartbeat of money. Steady rhythm with occasional whale-sized booms. |
| Ship tracking | Glacially slow drones. Container ships crossing oceans over days. |

---

## The Synth Engine

Built on the Web Audio API. Modular, polyphonic, and designed for both drone and percussive synthesis.

### Per-Voice Signal Chain

- **3 Oscillators** -- sine, saw, square, triangle, pulse-width modulation, white/pink/brown noise, wavetable
- **Filter** -- lowpass, highpass, bandpass, notch (with dedicated filter envelope and key tracking)
- **Amplitude Envelope** -- ADSR with ranges from 0ms to 60s, supporting both drone (gate held open) and trigger (full cycle per event) modes
- **Per-Voice Effects** -- distortion, chorus, phaser

### Global Effects Bus

- Reverb (convolution or algorithmic, size can be data-driven)
- Delay (tempo-synced or free-running, time can be data-driven)
- Compressor and limiter on the master bus

### Modulation

- LFO section with data-driven rate and depth
- Full modulation matrix: any data field can target any synth parameter
- Data streams can control LFOs, which in turn modulate synth parameters, creating complex evolving textures from simple inputs

### Voice Allocation

- **Polyphonic** -- each entity (aircraft, ship, etc.) gets its own voice, allocated dynamically
- **Monophonic** -- all entities aggregated into a single voice via configurable functions (average, median, sum, min/max)
- **Unison** -- entity cluster shares a voice with per-entity detuning for thick textures

---

## Mapping Engine

The mapping engine bridges raw data and synth parameters. Any data field can drive any parameter through configurable transforms.

### Transform Curves

| Curve | Best For |
| --- | --- |
| Linear | Even distribution (heading, longitude) |
| Logarithmic | Wide-range values (altitude, transaction value) |
| Exponential | Emphasis on extremes (earthquake magnitude) |
| S-Curve (sigmoid) | Soft limiting at extremes (velocity) |

### Musical Quantization

Mapped pitch values can be quantized to scales including major, minor, pentatonic, dorian, mixolydian, harmonic minor, whole tone, octatonic, just intonation, pythagorean, bohlen-pierce, or left as continuous Hz for true microtonal representation.

### Smoothing

Data arrives in discrete updates. A configurable smoothing filter interpolates between values -- from instant jumps (good for triggers) to glacial glides (good for drones).

---

## Tracking Modes

### Flight Modes

**Mode 1 -- Individual Flight Tracking**
Enter one or more callsigns. Each flight's telemetry drives its own voice. Hear the climb, the cruise, the descent. Two flights on parallel routes become a duet.

**Mode 2 -- Airport Zone Tracking**
Pick an airport and radius. In polyphonic mode, every aircraft in the zone gets a voice -- departures climb in pitch, arrivals descend, overflights hold steady. In monophonic mode, aggregate stats like total aircraft count and average altitude drive a single evolving voice.

> [!tip] Creative Twist -- "Approach Harmony"
> Aircraft on final approach fly the same heading and glideslope at different distances. Map distance-to-runway as chord notes. As planes land, notes drop out. As new ones join, new notes appear. The chord constantly evolves.

**Mode 3 -- Airport Events**
Event-triggered sounds for takeoffs (rising tone), landings (descending thud), go-arounds (dramatic pitch reversal), and emergencies (dissonant alarm). Active flight count drives background drone density. Departure/arrival ratio controls stereo balance.

> [!tip] Creative Twist -- "Airport as Organism"
> The airport breathes. Departures are exhales. Arrivals are inhales. Rush hour is hyperventilation. 3 AM is deep, slow breaths.

**Mode 4 -- Route / Corridor Tracking**
Track every aircraft between two cities. Journey-completion percentage maps to pitch. The entire route becomes a single evolving soundscape. Record a red-eye at 100x speed and a 5-hour flight becomes a 3-minute piece.

**Mode 5 -- Fleet Tracking**
Track every A380 or 737 in the sky simultaneously. Each one is a slightly different voice in a massive chord.

### Non-Flight Modes

**Mode 6 -- Seismic Sonification**
Each earthquake triggers a percussive sound. Magnitude maps to amplitude (exponential -- M5 is 10x louder than M4). Depth maps to pitch. Location maps to stereo pan.

> [!tip] Creative Twist -- "Ring of Fire"
> Place the listener in the center of the Pacific. Earthquakes around the Ring of Fire create surround-sound tectonic percussion.

**Mode 7 -- Solar Wind Drone**
Solar wind speed (300--800 km/s) becomes the base pitch of a drone. Proton density controls filter resonance. Temperature controls brightness. The Bz magnetic field component controls chord quality -- positive is major/bright, negative is minor/dark. A geomagnetic storm onset triggers a dramatic harmonic shift.

**Mode 8 -- Tidal Breathing**
Water levels from multiple NOAA stations create interlocking slow oscillations on a 12.4-hour cycle. Wind adds noise texture. Pressure sweeps the filter. Speed it up 360x and a full day becomes 4 minutes of phasing chords.

**Mode 9 -- Wikipedia Pulse**
Every Wikimedia edit is a trigger hit. Edit size controls amplitude. Namespace controls pitch register. Bot edits get a different timbre than human edits. Language wiki controls stereo position.

**Mode 10 -- Crypto Pulse**
Bitcoin transactions provide a steady rhythmic pulse. Value maps to pitch on a log scale -- dust transactions are high ticks, whale transfers are deep booms. Continuous price streams from CoinCap drive a parallel drone layer.

**Mode 11 -- Lightning Orchestra**
Each Blitzortung lightning strike is a percussive trigger panned by longitude. During storms, strikes arrive several times per second. During clear weather -- silence.

**Mode 12 -- Ship Drones**
Ships are the slowest-moving tracked entities. Speed over ground maps to pitch, heading to pan, rate of turn to pitch bend. Navigation status changes timbre -- underway is sawtooth, anchored is sine, moored is triangle.

### Composite Presets

**"Planet Earth"** -- Layer everything. Solar wind as deep background, tides as slow harmony, flights as mid-register melody, Wikipedia edits as hi-hat rhythm, earthquakes as bass percussion, lightning as crashes.

**"Airport at Night"** -- Airport zone tracking at a major hub over a nearby tide station background with local wind noise and landing/takeoff accents.

**"Cosmic"** -- Solar wind drone modulated by ISS orbital position, satellite count as chord density, geomagnetic Kp index as mood/key selection.

---

## Data Sources

No paid APIs required. The primary flight data sources are completely free ADS-B aggregators that replaced FlightAware for this use case.

### Zero Auth Required

| Source | Data Type | Protocol | Update Rate | Quality |
| --- | --- | --- | --- | --- |
| adsb.lol | Flight telemetry | REST | 1s (no limit) | Excellent |
| Airplanes.live | Flight telemetry | REST | 1s | Excellent |
| OpenSky Network | Flight telemetry | REST | 5--10s | Excellent |
| USGS Earthquakes | Seismic events | REST | Minutes | Good |
| NOAA Solar Wind (SWPC) | Plasma and magnetic field | REST | 60s | Excellent |
| NOAA Tides and Currents | Water level, wind, pressure | REST | 1--6 min | Excellent |
| NDBC Buoys | Waves, weather | HTTP text | 10--60 min | Excellent |
| Wikipedia EventStreams | Edit events | SSE | Real-time (5--20/s) | Outstanding |
| Blitzortung | Lightning strikes | WebSocket | Real-time (variable) | Excellent |
| Blockchain.com | Bitcoin transactions | WebSocket | Real-time (4--7/s) | Excellent |
| CoinCap | Crypto prices | WebSocket | Sub-second | Excellent |
| ISS Position | Orbital tracking | REST | 1s | Good |

### Free API Key Required

| Source | Data Type | Quality |
| --- | --- | --- |
| AISStream | Ship tracking (WebSocket) | Excellent |
| N2YO | Satellite positions | Good |
| Cloudflare Radar | Internet traffic and outages | Moderate |

### Other Sources Worth Exploring

| Source | What |
| --- | --- |
| USGS Water Services | Real-time river flow and gauge height at thousands of US stations |
| OpenAQ | Global air quality (PM2.5, ozone, NO2) |
| EURDEP | European radiation monitoring network |
| NOAA Aurora Forecast | Aurora borealis probability (pairs with solar wind) |
| Movebank | Animal telemetry / migration tracking |
| LIGO | Gravitational wave detections |

---

## Development Roadmap

### Phase 1 -- Foundation
Single flight tracking with a basic synth. Proves the concept end to end.

### Phase 2 -- Musical Depth
Full voice architecture, effects, airport tracking modes, scale quantization, preset system.

### Phase 3 -- Multi-Source
Add earthquakes, solar wind, Wikipedia, tides. Composite layering. Data recorder and playback with speed control.

### Phase 4 -- Advanced Synth
Wavetable oscillators, full modulation matrix, per-voice effects, microtuning, sidechain, audio export.

### Phase 5 -- All Sources
Complete the data source library: lightning, crypto, ships, satellites, transit, buoys.

### Phase 6 -- Polish
Globe visualization, MIDI/OSC output, curated presets, Web Workers, PWA support, documentation.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Audio | Web Audio API / Tone.js |
| UI | React or Svelte |
| State | Zustand or Svelte stores |
| Visualization | Canvas 2D / deck.gl |
| Streaming | Native EventSource (SSE), WebSocket API |
| Build | Vite |
| Testing | Vitest |

Desktop (Electron/Tauri) and headless Node.js deployment paths are planned for installation and hardware synth integration (MIDI/OSC).

---

> [!info] Further Reading
> See [[DATA_SOURCES_RESEARCH]] for detailed API endpoint documentation with field-level descriptions, rate limits, and example requests.
> See [[DEVELOPMENT_PLAN]] for the full technical architecture, interface specifications, and implementation details.
