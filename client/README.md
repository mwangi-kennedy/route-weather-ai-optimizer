# Route Weather AI Optimizer

A modern, responsive full-stack telemetry and transit safety dashboard engineered to plot custom transportation corridors across Kenya, evaluate regional micro-climates asynchronously, and map structural atmospheric hazards sequentially down the highway.



## System Ideology & Core Philosophy

Traditional weather applications operate on a **point-to-point** lookup philosophy. If an operator is driving from Nairobi to Mombasa, checking the weather at the source and destination fails to capture extreme localized micro-climates, wind tunnels, or flash precipitation happening concurrently along critical highway segments.

**Route Weather AI Optimizer** shifts the paradigm from point-destination lookup to **corridor-based risk monitoring**. By sampling complex geographical routing lines (Polylines), the system analyzes weather factors chronologically across the journey's sequence, serving as a proactive decision-making engine for logistics providers, long-distance cyclists and transit fleets.



##  Key Architectural Pillars & Engineering Solutions

### 1. Dynamic Geocoding Pipeline
* **The Problem:** Hardcoding static town coordinates bounds the system's operational viability to a tiny fraction of Kenyan transit hubs.
* **The Solution:** Integrated an asynchronous look-up engine using the **OpenStreetMap Nominatim Geocoding API**. By appending targeted jurisdiction filtering (`", Kenya"`), the application translates free-text user strings (e.g., *"Eldoret"*, *"Nyeri"*, *"Naivasha"*) into precise geographical floating-point coordinates dynamically.

### 2. Payload & Buffer Optimization
* **The Problem:** Long-distance highway calculations (such as Thika to Mombasa, a ~500km corridor) generate massive, deep GIS coordinate arrays. Passing this raw stream to the server immediately trips default Express body-parser constraints, throwing an unhandled `PayloadTooLargeError` (413).
* **The Solution:** Overhauled the backend middleware architecture to boost core data ingress capacity caps to **10MB**. This ensures extensive polyline tracking structures resolve securely without dropping connections.

### 3. Staggered Asynchronous Downsampling
* **The Problem:** Blasting a third-party weather API simultaneously with dozens of location queries results in immediate rate-limiting (429 HTTP blocks) or performance throttling.
* **The Solution:** 
  * Implemented a spatial compression helper (`sampleRouteCoordinates`) to downsample dense polyline streams down to **8 high-value waypoint check-stops**.
  * Engineered a micro-utility execution wrapper that fires asynchronous queries using an **accumulating staggered sleep multiplier ($index \times 80\text{ms}$)**. This serializes API hits cleanly, satisfying upstream concurrency policies.

### 4. Proactive Hazard Rule Engine
* **The Problem:** Raw weather payloads (`temperature`, `wind_speed`) leave cognitive load on the user to interpret whether current conditions are unsafe for their vehicle profile.
* **The Solution:** Designed a backend normalization mapping layer coupled with a frontend evaluation engine that dynamically scans current metrics against safety baselines:
  * **Wind Shear Threshold:** Flags any segment experiencing crosswinds exceeding **15 kph** (critical for cycling stability or light commercial vehicle balance).
  * **Precipitation Detection:** Performs real-time string-token parsing over incoming icon payloads to catch active `rain`, `drizzle`, or `overcast` visibility hazards.
  * **Visual State Machine:** Automatically changes UI component skins to a glowing warning accent and stamps map popup anchors with active ` Risk Flags`.



##  Technical Stack & System Blueprint

### Frontend Architecture
* **React.js (Vite):** Reactive state handling, managing asynchronous lifecycle events and form states cleanly.
* **React-Leaflet / Leaflet.js:** Renders the map container layer dynamically via OpenStreetMap tiles, utilizing a custom bounds controller to auto-pan and frame calculated vectors.
* **Inline Custom SVG Injection:** Bypasses asset compilation overhead by rendering custom vector-path representations directly inside the DOM (`L.divIcon` for a blue vehicle departure icon, a green racing finish flag, and reactive hazard nodes).

### Backend Architecture
* **Node.js & Express.js:** Scalable REST framework built with an explicit ES Module configuration (`import/export`).
* **Axios Engine:** Outbound HTTP client managing network handshakes with weather endpoints, configured with centralized auth headers utilizing secure system environment variables (`process.env.WEATHER_AI_API_KEY`).

### Third-Party API Specifications
* **OpenStreetMap Nominatim:** Geocoding service used for string-to-coordinate conversions.
* **WeatherAI API Core (`/v1/hourly`):** Queried to pull predictable timeline blocks, from which the immediate closest current metrics are cleanly targeted and mapped.


##  Local Installation & Configuration

### Prerequisites
Make sure your workspace has **Node.js (v16+)** and **npm** installed.

