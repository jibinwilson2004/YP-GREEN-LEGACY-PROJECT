# IEEE YP Green Legacy — Frontend Repository

Production web client for the **IEEE YP Green Legacy Project (Tree Tag)**. Built with React 19, TypeScript, Vite, Tailwind CSS v4, and Leaflet GIS.

---

## 🚀 Features

- **Precision GPS Telemetry**: Multi-reading stabilization engine and anti-spoofing anomaly detection.
- **GIS Cartography**: Interactive Leaflet maps with marker clustering and species filters.
- **Offline-First Resilience**: IndexedDB submission queue with background synchronization.
- **Photo Capture Studio**: Multi-step sapling tagging with canvas compression.
- **Dynamic Portals**: Admin verification dashboard, member registries, and eco-photo contest portal.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Maps & GIS**: [Leaflet](https://leafletjs.com/) + [Leaflet MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Local Storage**: IndexedDB via `idb`
- **Linting & Testing**: Oxlint & Vitest

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
For local development, `VITE_API_BASE_URL` can remain blank to use the built-in Vite proxy to the FastAPI service at `http://localhost:8000`. For production deployments, set it to the full versioned API URL, such as `https://api.example.com/api/v1`.

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

### 5. Run Tests
```bash
npm test
```
