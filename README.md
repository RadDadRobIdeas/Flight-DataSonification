# DataSonification

**A modular synth engine driven by real-time data streams.**

Flights. Earthquakes. Solar wind. Tides. Wikipedia edits. Lightning strikes. Cryptocurrency transactions. Ship tracking. The world is generating data every second, and that data has shape, rhythm, and texture. DataSonification turns it into sound.

---

## What Is This?

DataSonification connects to free, publicly available real-time data APIs and routes their numerical streams into a browser-based synthesizer. Altitude becomes pitch. Velocity becomes filter cutoff. A landing becomes a percussive trigger. A magnitude-5 earthquake becomes a deep, resonant boom.

The result is a living, evolving soundscape shaped entirely by the real world.

## How It Sounds

| Approach | Character |
| --- | --- |
| **Single flight, real-time** | Slow, droning, meditative. A transatlantic flight is a 7-hour evolving tone. |
| **Airport zone** | Dense, layered. Dozens of voices rising and falling. Approaches create descending pitch clusters. |
| **Recorded flight, sped up** | Compressed drama. An entire day of departures becomes a 5-minute composition. |
| **Solar wind + tides** | Cosmic ambient. The sun and moon as oscillators with hour/day-scale cycles. |
| **Wikipedia edits** | The pulse of human knowledge. Rapid-fire events, each with size and character. |
| **Lightning strikes** | Stochastic percussion. Silence during clear weather, bursts during storms. |
| **Bitcoin transactions** | The heartbeat of money. Steady rhythm with occasional whale-sized booms. |
| **Ship tracking** | Glacially slow drones. Container ships crossing oceans over days. |

## Architecture

```
  DATA SOURCES              MAPPING ENGINE              SYNTH ENGINE
 ┌────────────┐         ┌───────────────────┐       ┌───────────────┐
 │ Flight ADS-B│         │                   │       │  Voice 1      │
 │ Earthquakes ├────────▶│  Data → Parameter ├──────▶│  Voice 2      │
 │ Solar Wind  │ unified │  with curves,     │ pitch │  Voice 3      │
 │ Tides       │ format  │  scaling, and     │ filter│  ...          │
 │ Wikipedia   ├────────▶│  musical          ├──────▶│  Voice N      │
 │ Lightning   │         │  quantization     │  pan  │               │
 │ Crypto      │         │                   │  gate ├───┐           │
 │ Ships       │         └───────────────────┘       └───┤           │
 └────────────┘                                          ▼           │
                                                    ┌─────────────┐  │
                                                    │ Mixer / FX  │  │
                                                    │ Reverb Delay│◀─┘
                                                    │ Comp Limit  │
                                                    └──────┬──────┘
                                                           ▼
                                                      [ Output ]
```

Any data source can drive any synth parameter. Sources and synths are fully decoupled through a mapping engine that supports linear, logarithmic, exponential, and sigmoid transform curves, optional musical scale quantization, and configurable smoothing.

## Tracking Modes

### Flight Modes
1. **Individual Flight** — Enter callsigns, hear each flight's journey as its own voice
2. **Airport Zone** — All traffic within a radius, polyphonic or aggregated
3. **Airport Events** — Takeoffs, landings, go-arounds, and emergencies as triggered sounds
4. **Route Corridor** — Every aircraft between two cities as an evolving soundscape
5. **Fleet** — Every A380 (or any type) in the sky as a massive chord

### Beyond Flights
6. **Seismic** — Earthquakes as percussive triggers (magnitude → amplitude, depth → pitch)
7. **Solar Wind** — The sound of the sun: plasma speed as drone pitch, magnetic field as harmony
8. **Tidal Breathing** — Coastal water levels as interlocking 12-hour oscillations
9. **Wikipedia Pulse** — Every edit across all wikis as rapid-fire rhythmic triggers
10. **Crypto Pulse** — Bitcoin transactions + price streams as layered rhythm and drone
11. **Lightning Orchestra** — Blitzortung strikes as stochastic percussion
12. **Ship Drones** — Glacially slow AIS vessel tracking as deep evolving drones

### Composite Presets
- **"Planet Earth"** — Everything layered: solar wind background, tidal harmony, flight melodies, Wikipedia rhythm, earthquake bass, lightning crashes
- **"Airport at Night"** — Zone tracking over tidal and wind textures
- **"Cosmic"** — Solar wind drone modulated by ISS position and satellite count

## The Synth Engine

- **3 oscillators per voice** (sine, saw, square, triangle, PWM, noise, wavetable)
- **Filter** with dedicated ADSR envelope and key tracking
- **Amplitude ADSR** supporting both drone mode (gate held by continuous data) and trigger mode (full cycle per event)
- **LFO** with data-driven rate and depth
- **Per-voice effects** (distortion, chorus, phaser)
- **Global effects bus** (reverb, delay, compressor, limiter)
- **Polyphonic voice allocation** with configurable max polyphony and voice stealing
- **Musical quantization** across 14+ scale types including microtonal and non-octave tunings
- **Data recorder/playback** at arbitrary speeds (1x to 1000x)

## Data Sources

No paid APIs. No FlightAware subscription needed. All primary sources are completely free.

| Source | Data | Protocol | Auth Required |
| --- | --- | --- | --- |
| [adsb.lol](https://www.adsb.lol/) | Flight telemetry | REST (1s) | None |
| [Airplanes.live](https://airplanes.live/) | Flight telemetry | REST (1s) | None |
| [OpenSky Network](https://opensky-network.org/) | Flight telemetry | REST (5-10s) | None / Free |
| [USGS Earthquakes](https://earthquake.usgs.gov/) | Seismic events | REST | None |
| [NOAA SWPC](https://www.swpc.noaa.gov/) | Solar wind plasma & magnetics | REST (60s) | None |
| [NOAA Tides](https://tidesandcurrents.noaa.gov/) | Water level, wind, pressure | REST (1-6 min) | None |
| [Wikipedia EventStreams](https://stream.wikimedia.org/) | Edit events | SSE (5-20/s) | None |
| [Blitzortung](https://www.blitzortung.org/) | Lightning strikes | WebSocket | None |
| [Blockchain.com](https://www.blockchain.com/explorer/api) | Bitcoin transactions | WebSocket (4-7/s) | None |
| [CoinCap](https://coincap.io/) | Crypto prices | WebSocket | None |
| [AISStream](https://aisstream.io/) | Ship tracking | WebSocket | Free key |
| [ISS Tracker](https://wheretheiss.at/) | Orbital position | REST (1s) | None |

See [DATA_SOURCES_RESEARCH.md](DATA_SOURCES_RESEARCH.md) for detailed API documentation with endpoints, field descriptions, and rate limits.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Audio | Web Audio API / Tone.js |
| UI | React or Svelte |
| Build | Vite |
| Visualization | Canvas 2D / deck.gl |

## Status

**In planning.** See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the full technical architecture and 6-phase roadmap. See [PLAN_SUMMARY.md](PLAN_SUMMARY.md) for an overview.

## License

TBD
