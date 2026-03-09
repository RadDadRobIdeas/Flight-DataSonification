# Flight DataSonification — Project Handoff

> **Purpose:** This document serves as a complete context prompt for a new Claude Code session to continue development on this project. It covers the vision, architecture, current state, what works, what's broken, and what to build next.

---

## Project Vision

**DataSonification** is a web-based modular synth engine driven by real-time data streams. The primary data source is live flight telemetry (ADS-B), where aircraft parameters like altitude, airspeed, heading, and vertical rate are mapped to synth parameters like pitch, filter cutoff, stereo pan, and filter resonance. Status changes (takeoffs, landings, emergencies) trigger one-shot events.

The project is designed to expand beyond flights into other real-time data sources: earthquakes, solar wind, tides, Wikipedia edits, cryptocurrency, lightning strikes, ship tracking, satellites, and more.

**Key design principles:**
- Free data sources only — no API keys required (primary sources: adsb.lol, airplanes.live)
- Stem recording — each tracked entity records to its own audio file, not a mixed output
- Data stream recording — raw telemetry captured for offline playback at arbitrary speeds
- Musical quantization — data values snap to configurable musical scales
- Web-first — runs in any modern browser, potential for standalone app later

---

## Tech Stack

- **Framework:** Svelte 5 (with `$state()` runes, not legacy `$:` syntax)
- **Build:** Vite 7.x
- **Language:** TypeScript (strict)
- **Audio:** Tone.js 15.x (Web Audio API wrapper)
- **Data:** Polling REST APIs (ADS-B v2 format), planned SSE/WebSocket for future sources
- **No backend** — entirely client-side

---

## Repository Structure

```
Flight-DataSonification/
├── DATA_SOURCES_RESEARCH.md       # 820-line research on 30+ free real-time APIs
├── DEVELOPMENT_PLAN.md            # 754-line technical spec and 6-phase roadmap
├── PLAN_SUMMARY.md                # Obsidian-compatible condensed plan
├── README.md                      # GitHub-facing project intro
├── HANDOFF.md                     # This file
└── app/                           # Vite + Svelte application
    ├── package.json               # tone, svelte, typescript, vite
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
    └── src/
        ├── main.ts                # Entry point (mounts App.svelte)
        ├── App.svelte             # Main app — orchestration, transport, layout
        ├── app.css                # Global styles
        ├── version.ts             # VERSION = '0.1.1', CODENAME = 'Whisper'
        ├── stores.ts              # Svelte writable/derived stores for global state
        ├── types/
        │   ├── data.ts            # DataPacket, ContinuousValue, DataEvent, DataSourceAdapter, DataSourceInfo
        │   ├── synth.ts           # VoiceParams, OscillatorParams, FilterParams, EnvelopeParams, DEFAULT_VOICE_PARAMS
        │   └── mapping.ts         # MappingConfig, ScaleName, SynthParameter, QuantizeConfig
        ├── data/
        │   ├── AdsbAdapter.ts     # ADS-B flight data (adsb.lol / airplanes.live), 3 tracking modes
        │   └── DataRecorder.ts    # Raw packet recording + DataPlayer for playback at variable speed
        ├── engine/
        │   ├── Voice.ts           # Single synth voice: 3 oscillators → filter → amp env → panner → output
        │   ├── SynthEngine.ts     # Polyphonic manager: voice allocation, stealing, effects sends, stem taps
        │   ├── StemRecorder.ts    # Per-voice MediaRecorder for audio stem capture
        │   └── Orchestrator.ts    # Central coordinator: data → mapping → synth → recording
        ├── mapping/
        │   ├── MappingEngine.ts   # Data field → synth parameter routing with curves & smoothing
        │   ├── scales.ts          # 9 musical scales, MIDI↔freq conversion, quantization
        │   └── presets.ts         # flightDronePreset(), flightAmbientPreset()
        └── ui/
            ├── FlightConfig.svelte    # Tracking mode selector (callsign / airport / type)
            ├── DataFeed.svelte        # Live data table (callsign, alt, speed, heading, v/s)
            ├── VoiceMonitor.svelte    # Active voices display (pitch, gain meter, alt, speed, pan)
            └── MasterControls.svelte  # Volume, reverb, delay sliders + record toggle
```

---

## Architecture — Data Flow

```
[ADS-B API] → AdsbAdapter → DataPacket → Orchestrator
                                            ├─→ DataRecorder (raw packet capture)
                                            ├─→ pushDataFeed() → DataFeed.svelte (live table)
                                            ├─→ MappingEngine.process() → MappedValues
                                            │     └─→ MappingEngine.applyToVoice()
                                            └─→ SynthEngine
                                                  ├─→ Voice (allocate/retrieve per entity)
                                                  │     └─→ 3 Oscillators → Filter → AmpEnv → Panner → Output
                                                  ├─→ Effects (Reverb, Delay, Limiter)
                                                  └─→ StemRecorder (per-voice audio capture)
```

### Unified DataPacket Format
Every data source normalizes to this interface:
```typescript
interface DataPacket {
  sourceType: string;          // 'flight', 'earthquake', etc.
  sourceId: string;            // unique entity ID (e.g., ICAO hex)
  timestamp: number;
  continuous: Record<string, ContinuousValue>;  // altitude, velocity, heading, etc.
  events: DataEvent[];         // on_ground, new_contact, emergency
  metadata?: Record<string, unknown>;           // callsign, hex, display info
}

interface ContinuousValue {
  value: number;
  min: number;
  max: number;
  unit: string;
}
```

### Mapping System
Configurable routing: `dataField → transform → synthParameter`
- **Curves:** linear, log, exp
- **Features:** input/output range, clamping, inversion, smoothing (EMA), musical scale quantization
- **Targets:** pitch, filterFreq, filterQ, amplitude, pan, oscAGain, oscBGain, oscCGain

### Presets
- **Flight Drone:** altitude→pitch (log, pentatonic minor, 80-800Hz), velocity→filter (200-8000Hz), heading→pan, verticalRate→filterQ
- **Flight Ambient:** altitude→pitch (log, natural minor, 40-400Hz), velocity→filter (100-3000Hz), longitude→pan, verticalRate→amplitude

---

## Current State: v0.1.1 "Whisper" (Phase 1 MVP)

### What's Implemented
- ADS-B data adapter with 3 tracking modes (callsign, airport zone, aircraft type)
- Polyphonic synth engine (up to 32 voices, voice stealing)
- 3 oscillators per voice, lowpass filter, ADSR envelopes, panner
- Effects: reverb (4s decay), feedback delay, master limiter
- Mapping engine with curves, smoothing, and scale quantization
- 9 musical scales
- Per-voice stem recording (MediaRecorder → WebM/Opus)
- Raw data recording with JSON export
- Data playback engine (0.1x to 1000x speed)
- Live data feed panel showing tracked aircraft
- Voice monitor with per-voice telemetry
- Hot-swap tracking (change target without stopping)
- Auto-start data recording (downloads always have data)
- Download persistence (data recorder survives stop)

### What Works (as of v0.1.1)
- App builds and runs (`cd app && npm install && npm run dev`)
- UI renders: status bar, flight config, preset selector, master controls, transport buttons, data feed, voice monitor
- Track button shows queued feedback
- Start/Stop transport
- Status bar shows connection state and errors
- Download Data button always visible

### Known Issues / Not Yet Verified
- **Sound output has not been end-to-end tested** — the data pipeline was fixed in v0.1.1 (safe `data.ac || []` parsing, console logging, metadata propagation) but no one has confirmed audio actually plays in a browser yet. The most likely remaining issue is that voices might be created but the gain might be too low, or Tone.js context might need explicit user gesture handling.
- **Stem recording download** — MediaRecorder-based stem recording was implemented but not tested end-to-end
- **Preset switching while running** — currently only takes effect on next Start (not hot-swappable yet)
- **The `gain` value in the UI update loop is hardcoded to 0.6** — doesn't reflect actual voice gain. The `pan` is hardcoded to 0. These should read from the actual Voice object.
- **`retrack()` creates a new adapter without removing the old data source from the Orchestrator** — the `dataSources` map in Orchestrator accumulates entries. This should disconnect and remove the old source first.

### User's Bug Report from v0.1.0 (what drove v0.1.1 fixes)
1. ~~Track button does nothing until Start~~ → Fixed: shows "Queued:" feedback
2. ~~No sound, no visuals~~ → Fixed: safe data parsing, logging, status callbacks
3. ~~Voices section doesn't populate~~ → Fixed: metadata propagation, UI update loop
4. ~~Preset dropdown appears non-functional~~ → Partially fixed: presets work but only on start
5. ~~Changing tracked item requires stop/restart~~ → Fixed: hot-swap retracking
6. ~~Download stems produces no file~~ → Fixed: auto-start recording
7. ~~Download buttons disappear after stop~~ → Fixed: persistent recorder reference
8. ~~Downloaded JSON is empty (0 frames)~~ → Fixed: auto-start data recording in Orchestrator
9. User wants raw data view → Done: DataFeed.svelte

---

## Version Codenames & Roadmap

```
0.1.x  Whisper  — Phase 1: Foundation MVP          ← CURRENT (v0.1.1)
0.2.x  Breaker  — Phase 2: Musical Depth
0.3.x  Current  — Phase 3: Multi-Source
0.4.x  Drone    — Phase 4: Advanced Synth
0.5.x  Eclipse  — Phase 5: All Sources
1.0.x  Flare    — Phase 6: Polish & Release
```

### Phase 2 "Breaker" — Next Up
- Full voice architecture refinements (wavetable oscillators, sub-oscillator)
- Additional effects (chorus, phaser, distortion)
- Airport events mode (Mode 3: takeoff/landing triggers with one-shot envelopes)
- Route corridor tracking (Mode 4)
- Preset save/load system
- Improved voice allocation (priority-based, not just oldest-first stealing)
- Live preset switching (hot-swap mappings while running)
- Map visualization overlay

### Phase 3 "Current" — Multi-Source
- Earthquake adapter (USGS real-time feed)
- Solar wind adapter (NOAA DSCOVR)
- Tidal/ocean adapter (NOAA CO-OPS)
- Wikipedia edit stream (SSE)
- Source layering (multiple simultaneous data sources)
- Data playback UI (scrub, speed control)

See `DEVELOPMENT_PLAN.md` for the complete 754-line technical specification.

---

## Development Setup

```bash
cd app
npm install          # If SSL issues: npm config set strict-ssl false, then install, then set it back to true
npm run dev          # Starts Vite dev server (usually http://localhost:5173)
npx vite build       # Production build → app/dist/
```

**Node version tested:** v25.6.1, npm 11.9.0

**Git branch:** `claude/flight-data-synth-WhYAC` (5 commits ahead of `main`)

---

## User Preferences & Context

- **User:** RadDadRobIdeas (GitHub). Mac user, uses Obsidian for notes.
- **Experience level:** Not a professional developer — needs clear terminal instructions, path guidance, etc.
- **Creative direction:** User gave full creative freedom. Appreciates ambitious features and thorough planning.
- **Recording priority:** Stems (per-voice), not mixed output. Also wants data stream recording for offline rendering.
- **Documentation:** Wants Obsidian-compatible markdown (callout blocks, wikilinks) alongside GitHub-facing docs.
- **UI framework:** No preference — Svelte was chosen by the assistant. User is open to web app or standalone.
- **iOS:** User asked about running on iOS — PWA is the answer but it's not a priority right now.

---

## Key Files to Read First

If you're continuing development, start with these:
1. `DEVELOPMENT_PLAN.md` — The master plan and architecture spec
2. `app/src/App.svelte` — Main app, transport controls, adapter wiring
3. `app/src/engine/Orchestrator.ts` — Central data→synth coordinator
4. `app/src/data/AdsbAdapter.ts` — Primary data source implementation
5. `app/src/stores.ts` — All global reactive state
6. `app/src/mapping/presets.ts` — How data maps to sound

---

## Immediate Next Steps

1. **End-to-end test:** Run the app, pick an airport (KJFK, KLAX), press Start, verify that:
   - Console shows `[ADS-B] Fetching:` and `[ADS-B] Received N aircraft` logs
   - DataFeed table populates with aircraft
   - Voice Monitor shows allocated voices
   - Audio plays through speakers
2. **Fix hardcoded gain/pan** in App.svelte's update loop (lines 158-159) — read actual values from Voice
3. **Fix retrack() accumulation** — remove old data source from Orchestrator before adding new one
4. **Hot-swap presets** — allow changing mapping preset while running
5. **Begin Phase 2 "Breaker"** per the roadmap
