# `yp-legacy-web` — Frontend Client Application
### *React 19 + TypeScript + Vite + Tailwind CSS v4 + Leaflet GIS*

> [!NOTE]
> For the complete documentation covering backend architecture, database schemas, GPS algorithms, anti-spoofing engine, and deployment instructions, refer to the [Main Project README.md](../README.md).

---

## 🌲 Overview

`yp-legacy-web` is the primary web application for the **IEEE YP Green Legacy Project (Tree Tag)**. It provides a real-time, offline-capable progressive web experience for registering, verifying, and mapping planted trees across campuses and conservation sites.

### Key Capabilities:
- **Interactive Multi-layer GIS Map**: Leaflet cartography with custom markers, satellite view, and high-performance clustering (`react-leaflet`, `leaflet.markercluster`).
- **Precision GPS Verification Studio**: Multi-reading satellite buffer with real-time accuracy scoring, centroid stabilization, and anomaly warnings.
- **Hardware Camera Viewfinder**: Environment-facing camera access with instant client-side canvas compression (`utils/imageCompression.ts`) and procedural botanical fallbacks.
- **Zero-Connectivity Field Mode**: IndexedDB local queue (`services/offlineQueue.ts`) for caching captures in offline forest areas and auto-syncing upon network recovery.
- **Cloud Edge Database**: Direct browser-to-PostgreSQL integration via `@neondatabase/serverless` with 5-second polling and real-time administrative event dispatching.
- **IEEE Member Portal & Admin Console**: Role-based access control, OTP authentication, custom reviewer notes, participant leaderboards, and CSV export.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```
Ensure privileged database and Google credentials (`DATABASE_URL`, `GOOGLE_DRIVE_*`) remain on the backend server and are never prefixed with `VITE_`.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Build output is generated into the `dist/` directory and validated with `tsc -b`.

### 5. Linting
```bash
npm run lint
```
Uses [Oxlint](https://oxc.rs/) for sub-second static analysis.

---

## 📁 Key Source Modules

| Path | Purpose |
| :--- | :--- |
| `src/pages/HomePage.tsx` | Master landing page with hero metrics, CSR solutions, and societal footprint |
| `src/pages/MapPage.tsx` | Full-screen interactive GIS tree map with clustering and satellite layers |
| `src/pages/CapturePage.tsx` | 7-stage tree tagging workflow with camera, GPS, and draft review |
| `src/pages/TreesPage.tsx` | Searchable and filterable public registry of all logged saplings |
| `src/pages/TreeDetailPage.tsx` | Comprehensive telemetry dossier for individual trees |
| `src/pages/AdminPage.tsx` | Administrator review portal with live 5s database polling and CSV export |
| `src/pages/SignUpPage.tsx` | Registration wizard with dynamic IEEE Region/Section selector and email OTP |
| `src/pages/LoginPage.tsx` | Secure login and password reset verification modal |
| `src/pages/ContestPage.tsx` | IEEE CSTF Environmental Photo Contest guidelines and submission rules |
| `src/pages/ProfilePage.tsx` | Planter profile dashboard with personal tree statistics |
| `src/services/neonService.ts` | Edge PostgreSQL driver and SQL schema definition |
| `src/services/treeService.ts` | In-memory cache, local store, and remote database sync engine |
| `src/services/offlineQueue.ts` | IndexedDB persistent queue for offline field operations |
| `src/services/anomalyDetection.ts` | Mathematical anti-spoofing (GPS jumps, duplicate locations, speed limits) |
| `src/services/gps/` | Haversine centroid math, stability scoring, and accuracy tiering |
| `src/utils/imageCompression.ts` | Client canvas scaling and JPEG compression routines |

---

## 🎨 Theme & Styling

The UI is built on **Tailwind CSS v4** and styled in accordance with **IEEE Web & Brand Identity Guidelines**:
- Official IEEE Blue: `#00629B`
- Forest Green Primary: `#002218`
- Foliage Green Secondary: `#196b4f`
- Telemetry Accent Mint: `#a2f0cc`
- Surface: `#f4fbf4`

Theme variables and typography definitions can be inspected in [`src/index.css`](./src/index.css) and [`src/styles/design-system.css`](./src/styles/design-system.css).
