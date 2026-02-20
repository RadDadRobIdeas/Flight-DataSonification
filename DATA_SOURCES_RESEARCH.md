# Real-Time Data Sources for Sonification - Comprehensive Research

> Research conducted 2026-02-08. All URLs verified via web search.

---

## Table of Contents

1. [Flight Data (Primary Focus)](#1-flight-data-primary-focus)
2. [Nature / Environment](#2-nature--environment)
3. [Infrastructure / Space](#3-infrastructure--space)
4. [Social / Digital](#4-social--digital)
5. [Maritime / Transport](#5-maritime--transport)
6. [Sonification Quality Summary Table](#6-sonification-quality-summary-table)

---

## 1. FLIGHT DATA (Primary Focus)

### 1.1 OpenSky Network API

- **URL**: `https://opensky-network.org/api/states/all`
- **Docs**: https://openskynetwork.github.io/opensky-api/rest.html
- **Auth**: Anonymous access available (limited); free registered account for better access. As of March 2025, new accounts use OAuth2 client credentials flow.
- **Cost**: FREE for non-commercial/research use
- **Protocol**: REST (polling)

#### Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/states/all` | All current state vectors (all aircraft worldwide) |
| `GET /api/states/all?icao24=<hex>` | State vectors for specific aircraft |
| `GET /api/states/all?lamin=&lomin=&lamax=&lomax=` | State vectors in bounding box |
| `GET /api/flights/all?begin=&end=` | Flights in time interval |
| `GET /api/flights/aircraft?icao24=&begin=&end=` | Flights for specific aircraft |
| `GET /api/tracks/all?icao24=&time=` | Trajectory/waypoints for aircraft |

#### State Vector Fields (index positions in JSON array)

| Index | Field | Type | Description | Sonification Use |
|---|---|---|---|---|
| 0 | `icao24` | string | Unique ICAO 24-bit address (hex) | Identity/trigger |
| 1 | `callsign` | string | Callsign (8 chars, may be null) | Identity/trigger |
| 2 | `origin_country` | string | Country of origin | Categorization |
| 3 | `time_position` | int | Unix timestamp of last position | Timing |
| 4 | `last_contact` | int | Unix timestamp of last contact | Freshness |
| 5 | `longitude` | float | WGS-84 longitude (degrees) | **Stereo panning** |
| 6 | `latitude` | float | WGS-84 latitude (degrees) | **Pitch/filter mapping** |
| 7 | `baro_altitude` | float | Barometric altitude (meters) | **Pitch (primary)** |
| 8 | `on_ground` | bool | On ground flag | **Event trigger** |
| 9 | `velocity` | float | Ground speed (m/s) | **Tempo/rate/filter** |
| 10 | `true_track` | float | Track angle (degrees, north=0) | **Stereo panning** |
| 11 | `vertical_rate` | float | Vertical rate (m/s) | **Pitch bend/glide** |
| 12 | `sensors` | int[] | Sensor IDs | N/A |
| 13 | `geo_altitude` | float | Geometric altitude (meters) | **Pitch (alt)** |
| 14 | `squawk` | string | Transponder code (4 octal digits) | **Event triggers (7500/7600/7700)** |
| 15 | `spi` | bool | Special position indicator | **Alert trigger** |
| 16 | `position_source` | int | 0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM | Categorization |

#### Rate Limits

| User Type | Resolution | History | Limit |
|---|---|---|---|
| Anonymous | 10 seconds | Current only | 400 credits/day |
| Registered (free) | 5 seconds | Up to 1 hour | Higher credit allowance |

#### Sonification Quality: EXCELLENT
Continuous numerical streams (altitude, velocity, heading, vertical_rate) update every 5-10 seconds. On_ground is a perfect binary trigger. Hundreds to thousands of simultaneous aircraft provide dense data. Vertical rate is especially musical (positive=ascending, negative=descending).

---

### 1.2 adsb.lol (FREE, Community-Driven)

- **URL**: `https://api.adsb.lol`
- **Docs**: https://www.adsb.lol/docs/open-data/api/
- **Auth**: None required (currently)
- **Cost**: FREE, ODbL 1.0 license
- **Protocol**: REST (polling)
- **Rate Limits**: Currently NONE (may add in future)

#### Endpoints (ADSBExchange v2 compatible)

| Endpoint | Description |
|---|---|
| `GET /v2/hex/{hex}` | Aircraft by ICAO hex ID |
| `GET /v2/callsign/{callsign}` | Aircraft by callsign |
| `GET /v2/reg/{reg}` | Aircraft by registration |
| `GET /v2/type/{type}` | Aircraft by ICAO type code (A321, B738) |
| `GET /v2/squawk/{squawk}` | Aircraft by squawk code |
| `GET /v2/lat/{lat}/lon/{lon}/dist/{dist}` | Aircraft within radius of point |
| `GET /v2/mil` | Military aircraft only |

#### Key Response Fields

`hex`, `flight` (callsign), `alt_baro` (feet or "ground"), `alt_geom` (feet), `gs` (ground speed, knots), `track` (true track, degrees), `baro_rate` (ft/min), `geom_rate` (ft/min), `squawk`, `emergency`, `category`, `lat`, `lon`, `nav_heading`, `nav_altitude_mcp`, `ias` (indicated airspeed), `tas` (true airspeed), `mach`, `wd` (wind direction), `ws` (wind speed), `oat` (outside air temp), `seen` (seconds since last message), `seen_pos`, `rssi` (signal strength in dBFS)

#### Sonification Quality: EXCELLENT
Same ADS-B data as OpenSky but with NO rate limits currently. More fields available including wind data, Mach number, signal strength. The `rssi` field is unique and sonifiable. Unfiltered data means more aircraft visible.

---

### 1.3 Airplanes.live (FREE, Unfiltered)

- **URL**: `https://api.airplanes.live/v2/`
- **Docs**: https://airplanes.live/api-guide/
- **Field Reference**: https://airplanes.live/rest-api-adsb-data-field-descriptions/
- **Auth**: None required
- **Cost**: FREE
- **Protocol**: REST (polling)
- **Rate Limits**: 1 request/second

#### Endpoints (same v2 format)

| Endpoint | Description |
|---|---|
| `GET /v2/hex/{hex}` | By ICAO hex (up to 1000) |
| `GET /v2/callsign/{callsign}` | By callsign (up to 1000) |
| `GET /v2/reg/{reg}` | By registration |
| `GET /v2/type/{type}` | By ICAO type code |
| `GET /v2/squawk/{squawk}` | By squawk |
| `GET /v2/mil` | Military aircraft |
| `GET /v2/ladd` | LADD aircraft |
| `GET /v2/pia` | PIA aircraft |
| `GET /v2/point/{lat}/{lon}/{radius}` | Within radius (up to 250nm) |

#### Key Fields (same as adsb.lol v2 format)

`hex`, `flight`, `alt_baro`, `alt_geom`, `gs`, `track`, `baro_rate`, `geom_rate`, `squawk`, `emergency`, `category`, `lat`, `lon`, `nic`, `rc`, `seen_pos`, `wd`, `ws`, `rr_lat`, `rr_lon`, `rssi`

#### Sonification Quality: EXCELLENT
Identical v2 format to adsb.lol. Explicitly unfiltered and unobfuscated MLAT results. 1 req/sec rate limit is sufficient for sonification (poll every 1-5 seconds).

---

### 1.4 ADS-B Exchange (PAID)

- **URL**: https://www.adsbexchange.com/data/
- **Auth**: RapidAPI subscription required
- **Cost**: PAID (no free tier since March 2025)
- **NOTE**: Use adsb.lol or airplanes.live as free alternatives with the same v2 API format.

---

### 1.5 FlightAware AeroAPI

- **URL**: https://www.flightaware.com/aeroapi/portal
- **Docs**: https://www.flightaware.com/commercial/aeroapi
- **Auth**: API key required
- **Cost**: Free Personal tier (~500 calls/month, personal/academic only). Standard tier $100/month.
- **Protocol**: REST (polling)
- **Rate Limits**: Usage-based billing per query
- **Data**: Flight status, positions, schedules, alerts. Less raw telemetry than ADS-B APIs.

#### Sonification Quality: MODERATE
More processed/commercial flight data (schedules, alerts, status). Less suitable for continuous parameter sonification than raw ADS-B state vectors. The 500 calls/month free tier is too limited for real-time sonification.

---

### 1.6 adsbdb.com (Aircraft Metadata)

- **URL**: https://www.adsbdb.com/
- **Use**: Complementary metadata API for enriching aircraft data (airline, type, registration lookup)
- **Cost**: FREE
- **Not real-time tracking** - use alongside live APIs for enrichment

---

## 2. NATURE / ENVIRONMENT

### 2.1 USGS Earthquake API

- **URL (Feeds)**: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson`
- **URL (Query)**: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`
- **Docs**: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- **Auth**: NONE required
- **Cost**: FREE
- **Protocol**: REST (polling)
- **Rate Limits**: None stated, but be reasonable

#### Feed URLs (Pre-built, auto-updating)

| Feed | URL |
|---|---|
| Past Hour, All | `.../summary/all_hour.geojson` |
| Past Hour, M1.0+ | `.../summary/1.0_hour.geojson` |
| Past Day, All | `.../summary/all_day.geojson` |
| Past Day, M2.5+ | `.../summary/2.5_day.geojson` |
| Past Week, All | `.../summary/all_week.geojson` |
| Past Month, Significant | `.../summary/significant_month.geojson` |

#### Query API Parameters

`format`, `starttime`, `endtime`, `minmagnitude`, `maxmagnitude`, `minlatitude`, `maxlatitude`, `minlongitude`, `maxlongitude`, `limit`, `orderby`, `eventid`

#### Key Data Fields (GeoJSON properties)

| Field | Type | Description | Sonification Use |
|---|---|---|---|
| `mag` | float | Magnitude | **Amplitude/intensity** |
| `place` | string | Location description | Display |
| `time` | long | Timestamp (ms since epoch) | Timing |
| `sig` | int | Significance (0-1000) | **Filter/envelope** |
| `alert` | string | Alert level (green/yellow/orange/red) | **Event trigger** |
| `tsunami` | int | Tsunami flag (0/1) | **Alert trigger** |
| `depth` (geometry.coordinates[2]) | float | Depth in km | **Pitch/timbre** |
| `latitude` (geometry.coordinates[1]) | float | Latitude | **Panning** |
| `longitude` (geometry.coordinates[0]) | float | Longitude | **Panning** |
| `mmi` | float | Modified Mercalli Intensity | **Intensity mapping** |
| `felt` | int | Number of felt reports | **Density/texture** |
| `gap` | float | Azimuthal gap (degrees) | Quality indicator |

#### Sonification Quality: GOOD (Event-Based)
Earthquake events are inherently percussive/trigger-based. Magnitude maps to amplitude, depth to pitch, location to stereo. During active periods, several events per hour globally. During quiet periods, may have gaps. Best combined with continuous data sources.

---

### 2.2 NOAA CO-OPS Tides & Currents API

- **URL**: `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
- **Docs**: https://api.tidesandcurrents.noaa.gov/api/prod/
- **Auth**: NONE required
- **Cost**: FREE
- **Protocol**: REST (polling)

#### Available Products

| Product Parameter | Description | Sonification Use |
|---|---|---|
| `water_level` | Real-time water level | **Slow LFO/pitch** |
| `one_minute_water_level` | 1-minute interval water level | **Higher-res LFO** |
| `predictions` | Tide predictions | Baseline comparison |
| `air_temperature` | Air temperature | **Slow modulation** |
| `water_temperature` | Water temperature | **Slow modulation** |
| `wind` | Wind speed, direction, gusts | **Noise/texture** |
| `air_pressure` | Barometric pressure | **Slow filter sweep** |
| `conductivity` | Water conductivity | **Timbre** |
| `salinity` | Salinity | **Timbre** |
| `visibility` | Visibility distance | **Reverb/delay amount** |
| `humidity` | Relative humidity | **Filter resonance** |
| `currents` | Current speed and direction | **Rate/rhythm** |

#### Example API Call

```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9414290&product=water_level&datum=MLLW&time_zone=gmt&units=metric&format=json
```

#### Wind Data Response Fields
`s` (speed), `d` (direction in degrees), `dr` (compass direction), `g` (gust speed), `f` (flag)

#### Sonification Quality: EXCELLENT
Continuous numerical data with 6-minute default intervals (1-minute for water level). Over 200 stations across U.S. coasts. Water level provides beautiful slow sine-like oscillation. Wind provides speed+direction+gusts. Multiple simultaneous stations could create layered textures.

---

### 2.3 NOAA NWS Weather API

- **URL**: `https://api.weather.gov`
- **Docs**: https://www.weather.gov/documentation/services-web-api
- **Auth**: NONE (recommend User-Agent header with contact info)
- **Cost**: FREE
- **Protocol**: REST (polling)

#### Key Endpoints

| Endpoint | Description |
|---|---|
| `GET /points/{lat},{lon}` | Get grid info for location |
| `GET /gridpoints/{office}/{gridX},{gridY}/forecast` | 12-hour forecast periods |
| `GET /gridpoints/{office}/{gridX},{gridY}/forecast/hourly` | Hourly forecast |
| `GET /alerts/active` | Active weather alerts |
| `GET /alerts/active?area={state}` | State-specific alerts |

#### Sonification Quality: MODERATE
Forecast data updates infrequently (hourly). Weather alerts are event-based and could trigger sounds. Less suitable for continuous sonification than tides/buoy data.

---

### 2.4 NDBC (National Data Buoy Center) Real-Time Data

- **URL**: `https://www.ndbc.noaa.gov/data/realtime2/`
- **Docs**: https://www.ndbc.noaa.gov/faq/rt_data_access.shtml
- **Auth**: NONE
- **Cost**: FREE
- **Protocol**: HTTP text files (polling)
- **Format**: Whitespace-delimited text files

#### Data Access Pattern

Fetch `https://www.ndbc.noaa.gov/data/realtime2/{STATION_ID}.txt` where station IDs are like `46087`, `41047`, etc.

#### File Types by Extension

| Extension | Data Type |
|---|---|
| `.txt` | Standard meteorological (wind, pressure, temp, waves) |
| `.drift` | Drifting buoy data |
| `.cwind` | Continuous winds (10-minute intervals) |
| `.spec` | Spectral wave summary |
| `.swden` | Spectral wave density |
| `.swdir` | Spectral wave direction |
| `.ocean` | Oceanographic data (depth, temp, salinity, currents) |
| `.adcp` | Acoustic Doppler Current Profiler |

#### Standard Met Fields

`WDIR` (wind direction), `WSPD` (wind speed m/s), `GST` (gust m/s), `WVHT` (wave height m), `DPD` (dominant wave period s), `APD` (average wave period s), `MWD` (mean wave direction), `PRES` (pressure hPa), `ATMP` (air temp C), `WTMP` (water temp C), `DEWP` (dewpoint C), `VIS` (visibility nmi), `TIDE` (tide ft)

#### Sonification Quality: EXCELLENT
Wave height and period are inherently rhythmic. Spectral wave density data (`swden`) is literally frequency-domain data that could be mapped to audio frequencies. Continuous winds provide sustained modulation. Hourly updates with 45-day history.

---

### 2.5 NOAA SWPC Space Weather / Solar Wind

- **URL**: `https://services.swpc.noaa.gov/products/solar-wind/`
- **Docs**: https://www.swpc.noaa.gov/content/data-access
- **Auth**: NONE
- **Cost**: FREE
- **Protocol**: REST/JSON (polling)

#### Solar Wind Plasma Endpoints

| Endpoint | Fields |
|---|---|
| `plasma-5-minute.json` | `time_tag`, `density`, `speed`, `temperature` |
| `plasma-2-hour.json` | Same fields, 2h window |
| `plasma-6-hour.json` | Same, 6h window |
| `plasma-1-day.json` | Same, 1 day window |
| `plasma-3-day.json` | Same, 3 day window |
| `plasma-7-day.json` | Same, 7 day window |

#### Solar Wind Magnetometer Endpoints

| Endpoint | Fields |
|---|---|
| `mag-5-minute.json` | `time_tag`, `bx_gsm`, `by_gsm`, `bz_gsm`, `lon_gsm`, `lat_gsm`, `bt` |
| `mag-2-hour.json` | Same fields |
| `mag-1-day.json` | Same fields |
| (also 6-hour, 3-day, 7-day) | |

#### Additional SWPC Endpoints

| URL | Data |
|---|---|
| `services.swpc.noaa.gov/products/solar-wind/ephemerides.json` | Spacecraft position |
| `services.swpc.noaa.gov/products/noaa-planetary-k-index.json` | Kp geomagnetic index |
| `services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json` | GOES X-ray flux |
| `services.swpc.noaa.gov/products/alerts.json` | Space weather alerts |

#### Plasma Field Descriptions

| Field | Description | Sonification Use |
|---|---|---|
| `density` | Proton density (p/cm^3) | **Filter resonance** |
| `speed` | Solar wind speed (km/s, typically 300-800) | **Pitch/tempo** |
| `temperature` | Proton temperature (K) | **Timbre/brightness** |
| `bz_gsm` | North-south magnetic field component | **Key parameter - negative = geomagnetic storm potential** |
| `bt` | Total magnetic field strength | **Amplitude/intensity** |

#### Sonification Quality: EXCELLENT
DSCOVR satellite provides continuous data from L1 point. Solar wind speed (300-800 km/s range) maps beautifully to pitch. Density and temperature provide additional dimensions. Bz going negative triggers geomagnetic storms - a natural event trigger. Data resolution: 1-minute averages. Polling the 5-minute endpoint every 60 seconds gives near-real-time data.

---

### 2.6 Blitzortung Lightning Data

- **WebSocket**: `wss://ws1.blitzortung.org:3000` (also ws5, ws6, ws7)
- **Website**: https://www.blitzortung.org/
- **Auth**: None for WebSocket (restricted use); HTTP API requires participant login
- **Cost**: FREE (non-commercial, personal use only)
- **Protocol**: WebSocket (true real-time streaming)

#### WebSocket Access

Connect to `wss://wsN.blitzortung.org:3000` (N = 1, 5, 6, or 7). Data streams lightning strike events with:
- `lat` / `lon` - strike location
- `time` - timestamp (nanosecond precision)
- `sig` - signal count (number of detecting stations)

#### Important Restrictions

- Do NOT connect from highly-frequented websites or apps
- Non-commercial use only
- For third-party apps, set up your own intermediary server (MQTT)
- Connection may be dropped during high-traffic storms

#### Libraries

- **npm**: `@simonschick/blitzortungapi` (Node.js WebSocket wrapper)
- **PyPI**: `blitzortung` (Python, Apache-2.0)
- **Rust**: `blitzortung` crate (with `live` feature)

#### Sonification Quality: EXCELLENT (Event-Based)
True real-time WebSocket streaming of lightning strikes. During active thunderstorms, events can arrive several times per second - perfect for percussive/granular sonification. Location provides panning, signal count provides intensity. Quiet weather = silence (combine with other sources).

---

## 3. INFRASTRUCTURE / SPACE

### 3.1 ISS Position - Where The ISS At

- **URL**: `https://api.wheretheiss.at/v1/satellites/25544`
- **Docs**: https://wheretheiss.at/w/developer
- **Auth**: NONE
- **Cost**: FREE
- **Protocol**: REST (polling)
- **Rate Limits**: ~1 request/second

#### Endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/satellites/25544` | Current ISS position |
| `GET /v1/satellites/25544/positions?timestamps={t1,t2,...}` | Historical positions (up to 10) |
| `GET /v1/satellites/25544?units=miles` | With unit preference |
| `GET /v1/coordinates/{lat},{lon}` | Timezone lookup from coordinates |

#### Response Fields

| Field | Type | Description | Sonification Use |
|---|---|---|---|
| `latitude` | float | Current latitude | **Pitch modulation** |
| `longitude` | float | Current longitude | **Stereo pan** |
| `altitude` | float | Altitude (km) | **Filter/pitch** |
| `velocity` | float | Speed (km/h) | **Tempo** |
| `visibility` | string | "daylight", "eclipsed" | **Event trigger** |
| `footprint` | float | Footprint diameter (km) | **Reverb size** |
| `timestamp` | int | Unix timestamp | Timing |

#### Sonification Quality: GOOD
ISS orbits Earth every ~90 minutes, creating a natural slow cycle. Latitude oscillates between +/-51.6 degrees (sinusoidal), altitude varies slightly. Velocity is nearly constant (~27,600 km/h). The daylight/eclipsed transition is a clean binary trigger. Best as a slow background modulator.

### 3.2 ISS Position - Open Notify

- **URL**: `http://api.open-notify.org/iss-now.json`
- **Docs**: http://open-notify.org/Open-Notify-API/ISS-Location-Now/
- **Auth**: NONE
- **Cost**: FREE
- **Fields**: `latitude`, `longitude`, `timestamp` only
- **Note**: Simpler than wheretheiss.at (fewer fields), pass predictions endpoint is offline

---

### 3.3 N2YO Satellite Tracking API

- **URL**: `https://api.n2yo.com/rest/v1/satellite/`
- **Docs**: https://www.n2yo.com/api/
- **Auth**: API key required (free registration)
- **Cost**: FREE
- **Protocol**: REST (polling)
- **Rate Limits**: 1000 requests/hour

#### Endpoints

| Endpoint | Description |
|---|---|
| `/tle/{id}` | TLE data for satellite |
| `/positions/{id}/{lat}/{lon}/{alt}/{seconds}` | Future positions (1 element/sec) |
| `/visualpasses/{id}/{lat}/{lon}/{alt}/{days}/{min_vis}` | Visual pass predictions |
| `/radiopasses/{id}/{lat}/{lon}/{alt}/{days}/{min_elev}` | Radio pass predictions |
| `/above/{lat}/{lon}/{alt}/{radius}/{category}` | All satellites above location |

#### Position Response Fields

`satlatitude`, `satlongitude`, `sataltitude`, `azimuth`, `elevation`, `ra` (right ascension), `dec` (declination), `timestamp`

#### Sonification Quality: GOOD
Can track any satellite by NORAD ID (25544=ISS, 20580=Hubble, etc.). Position endpoint returns 1-second resolution future positions. The `/above/` endpoint returns all satellites overhead - count could drive density. Azimuth/elevation are excellent for spatial audio. Limited by 1000 req/hour.

---

### 3.4 Power Grid Frequency

- **Real-time visualization**: https://gridradar.net/en/mains-frequency
- **Research database**: https://power-grid-frequency.org/
- **Open data (OSF)**: https://osf.io/m43tg/
- **FNET/GridEye**: https://fnetpublic.utk.edu/

#### Gridradar API
Gridradar.net offers API access to real-time grid frequency, phase angle, and notification of irregularities. European grid frequency (50 Hz nominal) fluctuates by ~0.05 Hz based on supply/demand balance.

#### Sonification Quality: EXCELLENT (if accessible)
Grid frequency is inherently an audio-range signal (50/60 Hz). Deviations from nominal frequency directly reflect power grid supply/demand balance in real-time. The data is literally already a frequency. However, programmatic API access may require contacting Gridradar for terms.

---

### 3.5 Cloudflare Radar (Internet Traffic & Outages)

- **URL**: `https://api.cloudflare.com/client/v4/radar/`
- **Docs**: https://developers.cloudflare.com/api/resources/radar/
- **Auth**: Free Cloudflare account + API token
- **Cost**: FREE
- **Protocol**: REST (polling)

#### Key Endpoints

| Endpoint | Description |
|---|---|
| `/radar/traffic/anomalies` | Internet traffic anomalies (potential outages) |
| `/radar/bgp/routes/realtime?prefix=` | Real-time BGP route lookup |
| `/radar/bgp/hijacks/events` | BGP hijack events |
| `/radar/bgp/leaks/events` | BGP route leak events |
| `/radar/netflows/timeseries` | Traffic volume time series |
| `/radar/attacks/layer3/timeseries` | DDoS attack time series |

#### Sonification Quality: MODERATE
Traffic anomalies and BGP events are sporadic but dramatic when they occur. DDoS attack time series could provide continuous data. Best as an event-trigger layer rather than primary continuous source.

---

## 4. SOCIAL / DIGITAL

### 4.1 Wikipedia EventStreams (Real-Time SSE)

- **URL**: `https://stream.wikimedia.org/v2/stream/recentchange`
- **Docs**: https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams_HTTP_Service
- **Stream directory**: https://stream.wikimedia.org/?doc#/streams
- **Auth**: NONE
- **Cost**: FREE
- **Protocol**: Server-Sent Events (SSE) - true streaming
- **Connection timeout**: 15 minutes (auto-reconnect with Last-Event-ID)
- **Data retention**: 31 days of replayable history

#### Available Streams

| Stream | Description |
|---|---|
| `/v2/stream/recentchange` | All edits across all Wikimedia wikis |
| `/v2/stream/revision-create` | New revisions |
| `/v2/stream/page-create` | New page creations |
| `/v2/stream/page-delete` | Page deletions |
| `/v2/stream/page-move` | Page moves/renames |
| `/v2/stream/recentchange?since=2026-01-01T00:00:00Z` | Resume from timestamp |

#### recentchange Event Fields

| Field | Type | Description | Sonification Use |
|---|---|---|---|
| `type` | string | "edit", "new", "log", "categorize" | **Trigger type** |
| `namespace` | int | 0=article, 1=talk, 2=user, etc. | **Pitch/channel** |
| `title` | string | Page title | Display |
| `comment` | string | Edit summary | Display |
| `timestamp` | int | Unix timestamp | Timing |
| `user` | string | Username | Identity |
| `bot` | bool | Is bot edit | **Filter/layer** |
| `minor` | bool | Minor edit flag | **Velocity/amplitude** |
| `length.old` / `length.new` | int | Page size before/after | **Delta = amplitude** |
| `revision.old` / `revision.new` | int | Revision IDs | Sequence |
| `wiki` | string | Which wiki (enwiki, dewiki, etc.) | **Channel/pitch** |
| `server_name` | string | e.g., "en.wikipedia.org" | Categorization |

#### Example (JavaScript)

```javascript
const evtSource = new EventSource('https://stream.wikimedia.org/v2/stream/recentchange');
evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const delta = (data.length?.new || 0) - (data.length?.old || 0);
    // delta > 0 = content added, delta < 0 = content removed
};
```

#### Sonification Quality: OUTSTANDING
This is perhaps the best single source for sonification. True real-time SSE streaming with no polling needed. High event rate (multiple events per second across all wikis). Rich metadata for mapping: edit size to amplitude, namespace to pitch, wiki language to pan position, bot vs human to timbre. The length delta (bytes added/removed) is a continuous signed value perfect for pitch mapping. Listen to the pulse of human knowledge being created in real-time.

---

### 4.2 GitHub Public Events API

- **URL**: `https://api.github.com/events`
- **Docs**: https://docs.github.com/en/rest/activity/events
- **Auth**: Optional (recommended for higher rate limits)
- **Cost**: FREE
- **Protocol**: REST (polling with ETag support)
- **Rate Limits**: 60 req/hr (anonymous), 5000 req/hr (authenticated)

#### Endpoints

| Endpoint | Description |
|---|---|
| `GET /events` | All public events |
| `GET /repos/{owner}/{repo}/events` | Events for specific repo |
| `GET /users/{username}/events/public` | Events by user |
| `GET /orgs/{org}/events` | Events for org |

#### Event Types

`PushEvent`, `CreateEvent`, `DeleteEvent`, `ForkEvent`, `IssuesEvent`, `IssueCommentEvent`, `PullRequestEvent`, `PullRequestReviewEvent`, `WatchEvent` (star), `ReleaseEvent`, `MemberEvent`, `PublicEvent`, `GollumEvent` (wiki)

#### Key Fields

`type` (event type), `actor.login`, `repo.name`, `created_at`, `payload` (event-specific data)

#### Sonification Quality: MODERATE
Returns up to 300 events, limited to last 30 days. Event latency 30s to 6h (NOT real-time). Better for rhythmic/percussive mapping of activity patterns. Different event types map to different sounds. Use ETag polling to minimize API calls.

---

### 4.3 Blockchain.com Bitcoin WebSocket

- **URL**: `wss://ws.blockchain.info/inv`
- **Docs**: https://www.blockchain.com/explorer/api/api_websocket
- **Auth**: NONE
- **Cost**: FREE
- **Protocol**: WebSocket (true real-time streaming)

#### Subscription Commands

| Command | Description |
|---|---|
| `{"op": "unconfirmed_sub"}` | Subscribe to all unconfirmed transactions |
| `{"op": "unconfirmed_unsub"}` | Unsubscribe |
| `{"op": "blocks_sub"}` | Subscribe to new blocks |
| `{"op": "ping_tx"}` | Get latest transaction |
| `{"op": "addr_sub", "addr": "..."}` | Watch specific address |

#### Transaction Response Fields (op: "utx")

| Field | Description | Sonification Use |
|---|---|---|
| `x.hash` | Transaction hash | Identity |
| `x.time` | Timestamp | Timing |
| `x.out[].value` | Output values (satoshis) | **Amplitude/pitch (log scale)** |
| `x.out[].addr` | Recipient addresses | Identity |
| `x.inputs_n` | Number of inputs | **Complexity/texture** |
| `x.out_n` | Number of outputs | **Complexity/texture** |

#### Sonification Quality: EXCELLENT
True real-time WebSocket streaming. Bitcoin processes ~4-7 transactions per second on average - a steady rhythmic pulse. Transaction values span many orders of magnitude (satoshis to whole BTC), perfect for logarithmic pitch mapping. New blocks every ~10 minutes provide a larger rhythmic event. No auth required.

---

### 4.4 CoinCap WebSocket (Cryptocurrency Prices)

- **URL**: `wss://ws.coincap.io/prices?assets=bitcoin,ethereum`
- **Docs**: https://docs.coincap.io/
- **Auth**: NONE
- **Cost**: FREE
- **Protocol**: WebSocket (true real-time streaming)

#### WebSocket Endpoints

| URL | Description |
|---|---|
| `wss://ws.coincap.io/prices?assets=bitcoin` | Single asset price stream |
| `wss://ws.coincap.io/prices?assets=bitcoin,ethereum,litecoin` | Multiple assets |
| `wss://ws.coincap.io/prices?assets=ALL` | All available coins |
| `wss://ws.coincap.io/trades/binance` | Trades from specific exchange |

#### Response Format

```json
{"bitcoin": "43123.12", "ethereum": "3123.44"}
```

#### REST API (supplementary)

| Endpoint | Description |
|---|---|
| `GET api.coincap.io/v2/assets` | All assets with rank, price, volume, market cap |
| `GET api.coincap.io/v2/assets/{id}` | Single asset detail |
| `GET api.coincap.io/v2/assets/{id}/history?interval=m1` | Price history |
| `GET api.coincap.io/v2/rates` | Currency exchange rates |

#### Sonification Quality: EXCELLENT
True real-time streaming with no auth. Prices update multiple times per second. Multiple simultaneous assets = multiple voices. Price movement (delta from previous) maps to pitch bend. Recommended pattern: REST snapshot + WebSocket delta stream.

---

### 4.5 Reddit API

- **URL**: `https://oauth.reddit.com/`
- **Docs**: https://www.reddit.com/dev/api
- **Auth**: OAuth2 required
- **Cost**: FREE tier available
- **Rate Limits**: 100 req/10min (unauth), 1000 req/10min (OAuth)
- **Protocol**: REST (polling)

#### Sonification Quality: LOW
OAuth requirement adds friction. Rate limits are restrictive. No real-time streaming. Pushshift (historical archive) is effectively dead for new data. Not recommended for sonification when better alternatives exist.

---

## 5. MARITIME / TRANSPORT

### 5.1 AISStream.io (Ship Tracking WebSocket)

- **URL**: `wss://stream.aisstream.io/v0/stream`
- **Docs**: https://aisstream.io/documentation
- **Auth**: Free API key (register at aisstream.io)
- **Cost**: FREE
- **Protocol**: WebSocket (true real-time streaming)

#### Subscription Message

```json
{
    "Apikey": "YOUR_API_KEY",
    "BoundingBoxes": [[[-90, -180], [90, 180]]],
    "FiltersShipMMSI": ["368207620"],
    "FilterMessageTypes": ["PositionReport"]
}
```

#### Message Types

| Type | Description | Key Fields |
|---|---|---|
| `PositionReport` | Vessel position & motion | lat, lon, course, speed, heading, nav status |
| `ShipStaticData` | Vessel identity & voyage | name, destination, ETA, dimensions, type |
| `StandardClassBPositionReport` | Class B transponder positions | lat, lon, speed, course |

#### PositionReport Fields

| Field | Description | Sonification Use |
|---|---|---|
| `MetaData.latitude` | Vessel latitude | **Pitch/panning** |
| `MetaData.longitude` | Vessel longitude | **Stereo position** |
| `TrueHeading` | Heading (degrees) | **Filter sweep** |
| `Sog` (Speed Over Ground) | Speed in knots | **Tempo/rate** |
| `Cog` (Course Over Ground) | Course in degrees | **Modulation** |
| `NavigationalStatus` | Underway, anchored, moored, etc. | **State trigger** |
| `RateOfTurn` | Rate of turn | **Pitch bend** |

#### Sonification Quality: EXCELLENT
True real-time WebSocket. Global ship coverage. ~300 messages/second worldwide. Rich motion data (speed, heading, rate of turn). Navigation status changes are excellent triggers. Filter by geographic area to manage density. The maritime world moves slowly, creating long, evolving textures.

---

### 5.2 GTFS Realtime (Public Transit)

- **Spec**: https://gtfs.org/
- **Docs**: https://developers.google.com/transit/gtfs-realtime
- **Auth**: Varies by agency (many require free API key)
- **Cost**: FREE
- **Protocol**: Protocol Buffers over HTTP (polling)

#### Feed Types

| Feed | Description | Fields |
|---|---|---|
| VehiclePositions | Real-time bus/train locations | lat, lon, bearing, speed, occupancy, route, trip |
| TripUpdates | Arrival/departure predictions | delay, arrival_time, departure_time, stop_id |
| ServiceAlerts | Disruption notifications | cause, effect, description |

#### Example Free Feeds (no API key)

| Agency | Feed URL |
|---|---|
| MBTA (Boston) | `https://cdn.mbta.com/realtime/VehiclePositions.pb` |
| NYC MTA | Requires free API key from `api.mta.info` |
| SF Bay 511 | Requires free API key from `511.org` |

#### Sonification Quality: GOOD
Vehicle positions update every 15-60 seconds. Speed, bearing, occupancy status are good continuous values. Multiple vehicles on a route create rhythmic patterns. Delay data from TripUpdates provides deviation-from-expected values. Protocol Buffer format requires a parser library.

---

## 6. SONIFICATION QUALITY SUMMARY TABLE

### Tier 1: Outstanding (True Real-Time Streaming, Rich Data)

| Source | Protocol | Rate | Best Sonification Parameters |
|---|---|---|---|
| **Wikipedia EventStreams** | SSE | ~5-20 events/sec | edit size, namespace, wiki, bot flag |
| **Blockchain.com BTC** | WebSocket | ~4-7 tx/sec | transaction value, input/output count |
| **CoinCap Prices** | WebSocket | Sub-second | price delta, multi-asset layering |
| **AISStream Ships** | WebSocket | ~300 msg/sec | speed, heading, rate of turn, nav status |
| **Blitzortung Lightning** | WebSocket | Variable (0 to 100+/sec) | strike location, intensity |

### Tier 2: Excellent (Polling, High-Quality Continuous Data)

| Source | Protocol | Poll Interval | Best Sonification Parameters |
|---|---|---|---|
| **OpenSky Network** | REST | 5-10 sec | altitude, velocity, heading, vertical_rate, on_ground |
| **adsb.lol** | REST | 1 sec (no limit) | Same + rssi, mach, wind, TAS |
| **Airplanes.live** | REST | 1 sec | Same v2 format, unfiltered |
| **NOAA Solar Wind** | REST | 60 sec | speed, density, temperature, Bz |
| **NOAA Tides** | REST | 6 min | water_level, wind, temperature, pressure |
| **NDBC Buoy Data** | HTTP/text | 10-60 min | wave height, wave period, spectral density |

### Tier 3: Good (Event-Based or Slow-Updating)

| Source | Protocol | Update Rate | Best Sonification Parameters |
|---|---|---|---|
| **USGS Earthquakes** | REST | Minutes | magnitude, depth, location |
| **ISS Position** | REST | 1 sec | lat, lon, altitude, visibility |
| **N2YO Satellites** | REST | 1 sec | azimuth, elevation, altitude |
| **GTFS Transit** | Protobuf/REST | 15-60 sec | position, delay, occupancy |
| **GitHub Events** | REST | 30s-6h latency | event type, repo activity |
| **Cloudflare Radar** | REST | Minutes | anomalies, BGP events |
| **Grid Frequency** | Varies | Seconds | frequency deviation from 50/60 Hz |

---

## Recommended Sonification Architecture

### Layer 1: Continuous Background Texture
- **NOAA Solar Wind** (speed, density) -> Drone/pad pitch and brightness
- **NOAA Tides** (water level) -> Slow LFO on filter cutoff
- **ISS Position** (latitude oscillation) -> Very slow pitch modulation (~90 min cycle)

### Layer 2: Primary Rhythmic/Melodic Voice
- **Flight ADS-B data** (altitude, velocity, heading, vertical_rate) -> Main melodic content
- **AIS Ship data** (speed, heading, rate of turn) -> Secondary voice

### Layer 3: Event Triggers / Percussion
- **Wikipedia edits** -> Hi-hat/tick on each edit, amplitude from edit size
- **Bitcoin transactions** -> Bass drum, pitch from value
- **Lightning strikes** -> Cymbal crashes, panned by location
- **Earthquakes** -> Deep rumble, magnitude = amplitude

### Layer 4: Alert/Accent Events
- **Squawk 7700** (flight emergency) -> Alarm sound
- **Bz going negative** (solar storm) -> Rising tension
- **Earthquake M5+** -> Full-spectrum burst
- **Ship navigation status change** -> State change chime
