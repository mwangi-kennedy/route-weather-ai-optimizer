# Route Weather AI Optimizer 

A modern, high-capacity full-stack transit telemetry and meteorological risk panel engineered to map custom transportation paths across Kenya, evaluate regional micro-climates dynamically, and alert transport operators to highway atmospheric hazards in real time.


##  System Ideology & Philosophy

Traditional weather applications rely on a fragmented **point-to-point** inquiry philosophy. For example, checking the weather in Nairobi and Mombasa separately fails to account for severe localized weather systems, crosswind channels, or blinding downpours that happen concurrently along critical highway segments.

**Route Weather AI Optimizer** shifts the operational focus from point-destination lookup to **corridor-based risk monitoring**. By sampling complex routing line data (Polylines), the system breaks down a transit trajectory into sequentially monitored sectors. This functions as an automated safety layer tailored for logistics fleets, haulage operations and long-distance cyclists.


##  Core Architectural Pillars & Technical Solutions

### 1. Dynamic Geocoding Pipeline
* **The Challenge:** Hardcoding static town coordinates limits utility and makes the platform completely non-viable for lesser-known towns or custom highway coordinates across Kenyan counties.
* **The Solution:** Integrated an asynchronous lookup chain leveraging the **OpenStreetMap Nominatim Geocoding API**. By passing geographic constraints (`", Kenya"`), the application translates arbitrary user input strings (e.g., *"Eldoret"*, *"Nyeri"*, *"Machakos"*, *"Kakamega"*) into accurate floating-point coordinates dynamically.

### 2. Stream Buffer Optimization (10MB Max Ingress)
* **The Challenge:** High-fidelity highway corridors map out thousands of distinct coordinate waypoints. Transmitting massive raw GIS path structures across an HTTP payload trips default Express constraints, throwing an unhandled `PayloadTooLargeError` (HTTP 413) and crashing the request thread.
* **The Solution:** Overhauled the backend middleware configuration to expand core data ingress limits to **10MB**. This guarantees that extensive routing structures resolve safely without dropping connections.

### 3. Asynchronous Downsampling & Throttling Mitigation
* **The Challenge:** Firing hundreds of concurrent requests to a meteorological weather endpoint results in instantaneous IP throttling, resource exhaustion, or an upstream `429 Too Many Requests` error block.
* **The Solution:** * Designed a structural data-reduction filter (`sampleRouteCoordinates`) to downsample complex polyline coordinates into **8 high-value waypoint check-stops**.
  * Engineered an executive micro-utility timeout loop that spaces out API requests using an **accumulating staggered sleep multiplier ($index \times 80\text{ms}$)**. This serializes downstream traffic cleanly, satisfying concurrency rate limits.

### 4. Proactive Hazard Rule Engine
* **The Challenge:** Raw weather metrics (`temp`, `wind_kph`, `condition`) force cognitive load onto the operator to calculate if a particular road segment is dangerously compromised.
* **The Solution:** Programmed an analytical rule engine that parses live hourly matrices against safety baselines:
  * **Wind Shear Rule:** Automatically flags any segment experiencing crosswinds exceeding **15 kph** (the stability limit for cycling balance or light commercial vehicle cargo loads).
  * **Precipitation Rule:** Executes token-string parsing over incoming weather strings to identify active visibility threats (`rain`, `drizzle`, `heavy showers`).
  * **Visual State Machine:** Updates UI component structures to a glowing warning color profile and appends active `🚨 Risk Flags` onto map markers.


##  Technical Stack & System Blueprint

### Frontend Architecture
* **React.js (Vite):** Reactive view-state compilation, managing asynchronous asynchronous lifecycle hooks cleanly.
* **Leaflet / React-Leaflet:** Renders the map engine layer over OpenStreetMap imagery tiles. Integrated a reactive bounds controller component to capture, auto-pan, and frame calculated coordinates dynamically.
* **Direct SVG Custom Markers:** Bypasses asset compiling overhead by mapping explicit SVG paths into Leaflet DOM representations (`L.divIcon`). Displays a blue vehicle at the origin, a green racing flag at the target destination, and custom interactive dots for intermediates.

### Backend Architecture
* **Node.js & Express.js:** Flexible REST framework configured with a strict ES Module setup (`import/export`).
* **Axios Engine:** Outbound HTTP client managing network handshakes with weather endpoints, configured with centralized auth headers utilizing secure system environment variables (`process.env.WEATHER_AI_API_KEY`).
* **Dotenv Configuration:** Keeps credentials isolated from the application logic layer.

---

##  Complete System Flow Chart

```text
[User UI Inputs] ──> [OSM Nominatim Geocoder] ──> [Resolves Lat/Lng Coordinates]
                                                               │
[Express API Route Handler] <── [Sends Large JSON Payload] ───┘
         │
         ├──> [Boosts Body Limits to 10MB]
         ├──> [Downsamples Path into 8 Waypoints]
         └──> [Staggers Tasks sequentially via 80ms Sleep Delay Loop]
                               │
[Normalized UI Output Alert] <─┴─ [WeatherAI API /v1/hourly Endpoint Evaluated]
