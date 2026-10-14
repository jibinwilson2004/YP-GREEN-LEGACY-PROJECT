# IEEE YP Green Legacy Project (Tree Tag)
### *Verifiable Precision Afforestation, Biometric Forest Telemetry & GIS Mapping Engine*

[![IEEE Young Professionals](https://img.shields.io/badge/IEEE-Young%20Professionals%20CSTF-00629B.svg?style=flat-square&logo=ieee&logoColor=white)](https://yp.ieee.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-v1.9.4-199900.svg?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon_Serverless_Postgres-00E599.svg?style=flat-square&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Python](https://img.shields.io/badge/Backend-Python_3_SMTP_Service-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-000000.svg?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Table of Contents
1. [Executive Overview](#-executive-overview)
2. [Problem Statement & Mission](#-problem-statement--mission)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Core Features & Modules](#-core-features--modules)
   - [Precision GPS Telemetry Engine](#1-precision-gps-telemetry-engine)
   - [Anti-Spoofing & Anomaly Detection](#2-anti-spoofing--anomaly-detection)
   - [Camera Capture & Procedural Fallback](#3-camera-capture--procedural-fallback)
   - [Offline-First IndexedDB Queue](#4-offline-first-indexeddb-queue)
   - [Interactive Leaflet GIS Map](#5-interactive-leaflet-gis-map)
   - [Authentication & Dynamic IEEE Registry](#6-authentication--dynamic-ieee-registry)
   - [Admin Verification Dashboard](#7-admin-verification-dashboard)
   - [Contest & Societal Footprint Portals](#8-contest--societal-footprint-portals)
6. [Database Schema & Data Model](#-database-schema--data-model)
7. [Microservice APIs (Python SMTP Server)](#-microservice-apis-python-smtp-server)
8. [Repository Directory Structure](#-repository-directory-structure)
9. [Installation & Local Setup](#-installation--local-setup)
10. [Environment Variables](#-environment-variables)
11. [Deployment Guide](#-deployment-guide)
12. [IEEE Brand Identity Compliance](#-ieee-brand-identity-compliance)
13. [Institutional Governance & Authors](#-institutional-governance--authors)

---

## 🌿 Executive Overview

The **IEEE YP Green Legacy Project (Tree Tag)** is an enterprise-grade digital afforestation telemetry registry developed by the **IEEE Young Professionals Climate and Sustainability Taskforce (CSTF)** in collaboration with **APJAKTU NSSCELL NRPF**. 

It transforms tree-planting initiatives from unverified photo-ops into a **satellite-verifiable, cryptographically auditable, and tamper-evident public ecological ledger**. Through multi-reading GPS stabilization, mathematical anomaly detection, hardware camera streaming, IndexedDB offline queuing, and serverless edge databases, Tree Tag ensures every planted sapling possesses permanent geospatial provenance.

```
                     +---------------------------------------+
                     |    IEEE YP Green Legacy Platform      |
                     +---------------------------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
[ Web Application ]             [ Backend Services ]               [ Cloud Database ]
- React 19 + TypeScript         - Python 3 HTTP Server             - Neon Serverless Postgres
- Vite 8 + Tailwind CSS 4       - Gmail SMTP Dispatcher            - Instant Multi-Device Sync
- Leaflet GIS & Clustering      - 6-Digit Email OTP Verification   - Connection Pooling
- IndexedDB Offline Queue       - Admin Push Notifications         - Direct SQL via Serverless Driver
```

---

## 🎯 Problem Statement & Mission

Traditional afforestation and corporate social responsibility (CSR) tree-planting campaigns suffer from significant structural deficiencies:
1. **Greenwashing & Paper Parks**: Millions of seedlings claimed on paper are never planted or monitored.
2. **Double-Counting & Duplicate Claims**: The same geographic patch is claimed by multiple sponsors without ground-truth location data.
3. **No Longitudinal Survival Tracking**: Trees are forgotten immediately following inauguration events without survivability audits.
4. **Poor Mobile Connectivity in Forests**: Remote planting sites lack cell coverage, preventing digital registration on site.

### The Tree Tag Solution:
- **Precision Ground Truth**: Captures multiple consecutive GPS satellite fixes, filtering multipath drift and computing median coordinate displacement.
- **Anti-Fraud Engine**: Detects GPS jump teleportation, rejects duplicates within a 3-meter radius, and flags impossible physical travel (>120 km/h).
- **Zero-Data Field Operations**: Allows planters to capture saplings deep inside valleys or forests without cellular service; data queues locally into IndexedDB and automatically syncs when signal returns.
- **Verified Institutional Registry**: Every tree entry links to a verified student planter, university institution, timestamp, altitude, confidence score, and IEEE auditor verification sign-off.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Browser / Mobile)"]
        UI["React 19 SPA (Vite)"]
        Cam["HTML5 Camera API / Canvas Engine"]
        Geo["Geolocation Watcher (Multi-Reading Buffer)"]
        IDB[("IndexedDB Offline Queue (idb)")]
        LStore[("LocalStorage Cache")]
    end

    subgraph Backend["Python Microservice (otp_server.py)"]
        HttpSrv["HTTP Request Handler (:5001)"]
        OTP["OTP Generator & In-Memory Store"]
        SMTP["Gmail SMTP SSL Service (Port 465)"]
    end

    subgraph CloudDB["Neon Serverless PostgreSQL"]
        TblUsers[("users Table")]
        TblTrees[("trees Table")]
    end

    subgraph External["External Systems"]
        Gmail["Google Mail Relay"]
        AdminInbox["Admin Email (jibinwilson315@gmail.com)"]
        LeafletTiles["CartoDB / OpenStreetMap Tiles"]
    end

    %% Client flows
    Cam -->|Compressed Blob / Base64| UI
    Geo -->|Continuous Lat/Lng/Acc| UI
    UI <-->|Cache & Fast Hydration| LStore
    UI <-->|Store Drafts When Offline| IDB

    %% Auth & Notifications
    UI -->|POST /api/send-otp| HttpSrv
    UI -->|POST /api/verify-otp| HttpSrv
    UI -->|POST /api/notify-tree-tag| HttpSrv
    UI -->|POST /api/send-partner-request| HttpSrv
    
    HttpSrv --> OTP
    HttpSrv --> SMTP
    SMTP -->|TLS Encrypted| Gmail
    Gmail --> AdminInbox

    %% Database Direct Connection
    UI -->|@neondatabase/serverless SQL| TblUsers
    UI -->|@neondatabase/serverless SQL| TblTrees
    UI -->|Tile Requests| LeafletTiles
```

---

## 💻 Technology Stack

### Frontend Architecture
- **Framework**: [React 19.2](https://react.dev/) with modern functional components, hooks, and Concurrent Features.
- **Language**: [TypeScript 6.0](https://www.typescriptlang.org/) for strict compile-time type safety.
- **Build Engine & Bundler**: [Vite 8.3](https://vitejs.dev/) with Hot Module Replacement (HMR) and SWC/OXC compilation.
- **Styling & Design Tokens**: [Tailwind CSS v4.3](https://tailwindcss.com/) with CSS variables theme definition and custom semantic design systems.
- **Mapping & GIS**: [Leaflet 1.9](https://leafletjs.com/) and [React-Leaflet 5.0](https://react-leaflet.js.org/) paired with [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) for high-performance point clustering.
- **Offline Storage**: [IndexedDB via `idb` v8.0](https://github.com/jakearchibald/idb) providing asynchronous transactional storage.
- **Icons & Typography**: Google Fonts ([Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk), [Outfit](https://fonts.google.com/specimen/Outfit), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)) and Google [Material Symbols Outlined](https://fonts.google.com/icons).
- **Linter**: [Oxlint 1.81](https://oxc.rs/docs/guide/usage/linter.html) for ultra-fast AST-based linting.

### Backend & Microservices
- **Python HTTP Microservice**: `otp_server.py` built with standard library `http.server`, `socketserver`, `smtplib`, and `email.message`.
- **Email Delivery**: Asynchronous multi-threaded Gmail SMTP SSL relay on port 465 with rich responsive HTML email templates.
- **Cloud Database**: [Neon Serverless Postgres](https://neon.tech/) using `@neondatabase/serverless` WebSocket/HTTP edge client for direct browser-to-database communication with connection pooling.

### Hosting & Infrastructure
- **Deployment**: [Vercel](https://vercel.com/) with Single Page Application rewrites (`vercel.json`).

---

## 🌟 Core Features & Modules

### 1. Precision GPS Telemetry Engine
Located in [`yp-legacy-web/src/services/gps/`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/services/gps/):
- **Continuous Multi-Reading Buffer**: Gathers up to 12 consecutive satellite fixes over 10-15 seconds rather than taking a single volatile reading.
- **Haversine Centroid Calculation**: Computes the true geometric center of all collected fixes:
  $$\text{Centroid} = \left(\frac{1}{N}\sum \text{lat}_i, \frac{1}{N}\sum \text{lng}_i\right)$$
- **Stability Score (0–100)**: Evaluates spread and standard deviation. Displacements under 1.5 meters reward a 95–100% stability score.
- **4-Tier Precision Classification**:
  | Tier | Accuracy Range | Operational Status |
  | :--- | :--- | :--- |
  | `HIGH_PRECISION` | $\le 3\text{ meters}$ | Ideal for RTK / dual-frequency mobile GNSS |
  | `VERIFIED` | $3\text{ m} < \text{Acc} \le 10\text{ m}$ | Accepted for standard smartphone GPS registration |
  | `LOW_PRECISION` | $10\text{ m} < \text{Acc} \le 20\text{ m}$ | Warning issued; user prompted to step away from canopy |
  | `UNRELIABLE` | $> 20\text{ meters}$ | Registration blocked until satellite lock stabilizes |

### 2. Anti-Spoofing & Anomaly Detection
Located in [`yp-legacy-web/src/services/anomalyDetection.ts`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/services/anomalyDetection.ts):
- **GPS Jump Detection**: Detects abrupt sensor glitches where coordinates displace by $> 30\text{ m}$ or $> 4 \times \text{accuracy}$ between adjacent readings.
- **Duplicate Tree Prevention**: Scans local and remote database records using spherical distance formulas. Registrations within **3 meters** of an existing tagged tree trigger `DUPLICATE` warnings to avoid duplicate claims.
- **Velocity / Teleportation Spoofing Guard**: Compares timestamp and distance delta from the planter's last recorded tree. Speeds exceeding **120 km/h** flag `SUSPICIOUS_MOVEMENT`, neutralizing GPS mock location tools.

### 3. Camera Capture & Procedural Fallback
Located in [`yp-legacy-web/src/components/tree/TreePhoto.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/components/tree/TreePhoto.tsx) and [`imageCompression.ts`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/utils/imageCompression.ts):
- **Live Stream Viewfinder**: Accesses rear hardware cameras using `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })`.
- **Client-Side Compression**: Compresses raw high-resolution captures via HTML5 Canvas to 1280px maxWidth at 82% JPEG quality. Decreases payload size from ~8 MB to ~150 KB, enabling reliable transmission over 2G/3G forest edge links.
- **Procedural Eco-Sapling Canvas Fallback**: If browser permissions or camera hardware drivers fail, an HTML5 canvas procedurally draws a branded botanical illustration with date-stamped telemetry metadata, ensuring the registration workflow is never blocked.
- **File Upload Fallback**: Supports manual image selection or native camera capture via standard file inputs.

### 4. Offline-First IndexedDB Queue
Located in [`yp-legacy-web/src/services/offlineQueue.ts`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/services/offlineQueue.ts):
- When tree planting occurs in zero-signal regions, capture drafts and photo blobs are saved into an IndexedDB database named `yp-legacy-offline`.
- A background event listener on `window.addEventListener('online')` automatically detects network recovery, iterates over the queued items, transmits them to the remote database, and cleans the queue.

### 5. Interactive Leaflet GIS Map
Located in [`yp-legacy-web/src/pages/MapPage.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/pages/MapPage.tsx) and [`components/map/TreeMap.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/components/map/TreeMap.tsx):
- Custom high-contrast evergreen tree markers with animated pulse rings for recently tagged trees.
- Circular GPS accuracy confidence radius rings rendered on hover or selection.
- High-performance marker clustering allowing tens of thousands of trees to render fluidly at 60 FPS.
- Direct tree popup cards featuring botanical classification, planting dates, planter details, and navigation links to full inspection dossiers (`/trees/:id`).
- Layer toggling for satellite imagery, cartographic street layers, and user filters.

### 6. Authentication & Dynamic IEEE Registry
Located in [`yp-legacy-web/src/pages/SignUpPage.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/pages/SignUpPage.tsx) and [`LoginPage.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/pages/LoginPage.tsx):
- **Strict Email Verification**: Generates cryptographically secure 6-digit OTP codes with a 10-minute expiration window, dispatched via Gmail SMTP.
- **Dynamic IEEE Organization Unit (OU) Picker**: Automatically maps IEEE Regions (Region 1 through Region 10) to their respective organizational sections (e.g., Kerala Section, Boston Section, Tokyo Section).
- **Membership Grade Selection**: Supports Student Member, Graduate Student Member, Member, Senior Member, and Fellow grades.
- **Forgot Password Flow**: Secure password resets verified via OTP sent to registered email addresses.

### 7. Admin Verification Dashboard
Located in [`yp-legacy-web/src/pages/AdminPage.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/pages/AdminPage.tsx):
- **Live 5-Second Neon Database Polling**: Real-time synchronization across administrative monitors as volunteers submit tree tags from the field.
- **Instant Audit Workflow**: One-click approval (`VERIFIED`) or rejection (`REJECTED`) with mandatory or optional auditor review notes.
- **Participant Directory**: Live leaderboard tracking total trees tagged, verification ratios, student names, and collegiate affiliations.
- **CSV Data Export**: One-click generation and download of complete tree telemetry spreadsheets for governmental or institutional auditing.

### 8. Contest & Societal Footprint Portals
Located in [`yp-legacy-web/src/pages/ContestPage.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/pages/ContestPage.tsx) and [`components/home/ActivityIdeasCanvas.tsx`](file:///c:/Users/LEVONO/Downloads/stitch_tree_tag_environmental_landing_page/yp-legacy-web/src/components/home/ActivityIdeasCanvas.tsx):
- **IEEE Environmental Photo Contest**: Official portal for member eco-photography submissions, EXIF geotag verification rules, and certificate awards.
- **Interactive Societal Footprint Canvas**: Draggable, scrollable interactive card matrix illustrating afforestation programs across educational campuses, elder-care facilities, and natural economic zones (Oxy Parks).
- **Partner Request Ingestion**: Direct modal enabling corporations, NGOs, and universities to request afforestation partnerships.

---

## 🗄 Database Schema & Data Model

The project utilizes Neon Serverless PostgreSQL. Schemas are automatically created and initialized on application startup via `neonService.initSchema()`.

### `trees` Table Definition
```sql
CREATE TABLE IF NOT EXISTS trees (
  id                        TEXT PRIMARY KEY,           -- Format: 'YP-000001'
  species                   TEXT NOT NULL,              -- Scientific or common name
  common_name               TEXT,                       -- e.g., 'Neem', 'Teak'
  botanical_name            TEXT,                       -- e.g., 'Azadirachta indica'
  image_url                 TEXT,                       -- Primary photo URL or Base64
  images                    JSONB,                      -- Array of image URLs/Base64 strings
  latitude                  DOUBLE PRECISION NOT NULL,  -- WGS 84 Latitude
  longitude                 DOUBLE PRECISION NOT NULL,  -- WGS 84 Longitude
  accuracy                  DOUBLE PRECISION NOT NULL,  -- Accuracy radius in meters
  altitude                  DOUBLE PRECISION DEFAULT 0, -- Altitude above sea level in meters
  gps_source                TEXT,                       -- 'SMARTPHONE_GPS', 'RTK_GNSS', etc.
  location_confidence       INT,                        -- Confidence percentage (0-100)
  location_status           TEXT,                       -- 'HIGH', 'MEDIUM', 'LOW'
  reading_count             INT,                        -- Number of readings averaged
  stability_score           INT,                        -- Stability score (0-100)
  gps_stability             TEXT,                       -- 'STABLE', 'UNSTABLE', 'MODERATE'
  captured_at               TIMESTAMPTZ,                -- Capture timestamp (ISO 8601)
  date_of_planting          TEXT,                       -- Formatted date string (DD-MM-YYYY)
  updated_at                TEXT,                       -- Last update date string
  student                   TEXT,                       -- Planter / Student full name
  college                   TEXT,                       -- College or institutional unit
  cluster                   TEXT,                       -- Regional cluster identifier
  institution               TEXT,                       -- Institutional partner (e.g., NSS Cell)
  user_id                   TEXT,                       -- Registered user email / ID
  verification_status       TEXT DEFAULT 'PENDING',     -- 'PENDING', 'VERIFIED', 'REJECTED'
  verified_by               TEXT,                       -- Auditor name / committee
  verification_date         TEXT,                       -- Date of verification
  identification_confidence INT DEFAULT 90,             -- Species identification confidence
  admin_note                TEXT                        -- Auditor feedback note
);
```

### `users` Table Definition
```sql
CREATE TABLE IF NOT EXISTS users (
  email                     TEXT PRIMARY KEY,           -- User email (normalized lowercase)
  full_name                 TEXT,                       -- User's full name
  password_hash             TEXT,                       -- Stored password or hash
  institution               TEXT,                       -- Affiliated college or organization
  ieee_id                   TEXT,                       -- IEEE Membership number
  membership_grade          TEXT,                       -- 'Student Member', 'Member', etc.
  region                    TEXT,                       -- IEEE Region (e.g., 'Region 10')
  section                   TEXT,                       -- IEEE Section (e.g., 'Kerala')
  country                   TEXT,                       -- Country of residence
  created_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚡ Microservice APIs (Python SMTP Server)

The microservice runs via `otp_server.py` on port `5001` (configurable via `PORT` environment variable).

### 1. Send OTP Code
- **Endpoint**: `POST /api/send-otp`
- **Payload**:
  ```json
  {
    "email": "user@example.com",
    "name": "Jane Doe"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Verification code successfully sent to user@example.com",
    "expires_in": 600
  }
  ```

### 2. Verify OTP Code
- **Endpoint**: `POST /api/verify-otp`
- **Payload**:
  ```json
  {
    "email": "user@example.com",
    "otp": "492104"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Email verified successfully!"
  }
  ```

### 3. Tree Tag Admin Notification
- **Endpoint**: `POST /api/notify-tree-tag`
- **Payload**:
  ```json
  {
    "treeId": "YP-000042",
    "species": "Azadirachta indica",
    "planter": "Jane Doe",
    "latitude": 10.0528,
    "longitude": 76.6346
  }
  ```
- **Action**: Immediately fires an asynchronous email alert to the project admin (`jibinwilson315@gmail.com`) prompting audit review.

### 4. Partner Inquiry
- **Endpoint**: `POST /api/send-partner-request`
- **Payload**:
  ```json
  {
    "orgName": "Green Earth Foundation",
    "contactName": "John Smith",
    "email": "john@greenearth.org",
    "phone": "+91 9876543210",
    "orgType": "NGO / Non-Profit",
    "message": "We would like to register 500 saplings in our district."
  }
  ```

### 5. Health Check
- **Endpoint**: `GET /api/health`
- **Response** (`200 OK`):
  ```json
  {
    "status": "online",
    "service": "IEEE YP Green Legacy OTP Verification Server",
    "smtp_configured": true
  }
  ```

---

## 📂 Repository Directory Structure

```text
stitch_tree_tag_environmental_landing_page/
├── assets/                                 # Static assets for root HTML prototypes
│   ├── css/                                # Legacy style sheets
│   │   └── style.css
│   ├── images/                             # Curated high-resolution environmental photography
│   │   ├── hero-misty-forest.png
│   │   ├── pine-forest-aerial.png
│   │   ├── tree-sapling.png
│   │   ├── logo.png
│   │   ├── ieee-diamond.png
│   │   └── ieee-yp-cstf.png
│   └── js/                                 # Prototype scripting
│       ├── main.js
│       └── map.js
├── otp_server.py                           # Python 3 Gmail SMTP & OTP microservice
├── package.json                            # Root orchestrator scripts & Neon packages
├── vercel.json                             # Root Vercel deployment configuration
├── index.html                              # Standalone HTML5 prototype landing page
├── login.html                              # Standalone HTML5 prototype login
├── map.html                                # Standalone HTML5 prototype map
├── profile.html                            # Standalone HTML5 prototype profile
├── signup.html                             # Standalone HTML5 prototype signup
├── yp-legacy-web/                          # 🚀 Primary Production React 19 Application
│   ├── public/                             # Public static assets & favicons
│   │   ├── assets/images/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── App.tsx                         # Client-side router & route code splitting
│   │   ├── main.tsx                        # Application mount point
│   │   ├── index.css                       # Tailwind CSS v4 directives & theme definitions
│   │   ├── components/
│   │   │   ├── gps/                        # GPS status displays & verification dials
│   │   │   │   ├── GPSAccuracy.tsx
│   │   │   │   ├── GPSReadings.tsx
│   │   │   │   ├── GPSStatus.tsx
│   │   │   │   └── LocationVerification.tsx
│   │   │   ├── home/                       # Landing page widgets & interactive canvas
│   │   │   │   └── ActivityIdeasCanvas.tsx
│   │   │   ├── layout/                     # Universal navigation headers & footers
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   ├── AppFooter.tsx
│   │   │   │   └── BottomNav.tsx
│   │   │   ├── map/                        # Leaflet map container & layer overlays
│   │   │   │   └── TreeMap.tsx
│   │   │   └── tree/                       # Tree details, photo capture & verification cards
│   │   │       ├── GPSAccuracyCircle.tsx
│   │   │       ├── MapControls.tsx
│   │   │       ├── TreeCard.tsx
│   │   │       ├── TreeDetailsCard.tsx
│   │   │       ├── TreeImageGallery.tsx
│   │   │       ├── TreeInformation.tsx
│   │   │       ├── TreeLocationMap.tsx
│   │   │       ├── TreeMapMarker.tsx
│   │   │       ├── TreePhoto.tsx
│   │   │       ├── TreeVerification.tsx
│   │   │       └── VerificationStatus.tsx
│   │   ├── constants/                      # Static configurations & IEEE data
│   │   │   ├── assets.ts                   # Image asset manifest
│   │   │   └── ieeeRegions.ts              # Complete IEEE Region 1-10 & Section mappings
│   │   ├── hooks/                          # Custom React hooks
│   │   │   ├── useGPS.ts                   # Geolocation buffer & continuous watcher
│   │   │   ├── useOfflineQueue.ts          # IndexedDB sync lifecycle manager
│   │   │   └── useTreeCapture.ts           # Multi-step capture wizard state machine
│   │   ├── pages/                          # Application page views
│   │   │   ├── AdminPage.tsx               # Reviewer dashboard & telemetry audits
│   │   │   ├── CapturePage.tsx             # 7-step tree tagging studio
│   │   │   ├── ContestPage.tsx             # Eco-photo contest portal
│   │   │   ├── HomePage.tsx                # Master environmental landing page
│   │   │   ├── LoginPage.tsx               # Member & admin authentication
│   │   │   ├── MapPage.tsx                 # Fullscreen GIS tree map
│   │   │   ├── ProfilePage.tsx             # User profile & my trees registry
│   │   │   ├── SignUpPage.tsx              # Multi-stage registration with OTP
│   │   │   ├── TreeDetailPage.tsx          # Single-tree biometric dossier
│   │   │   └── TreesPage.tsx               # Filterable public tree registry
│   │   ├── services/                       # Business logic, cloud DB & algorithms
│   │   │   ├── anomalyDetection.ts         # Math algorithms for GPS jumps & velocity
│   │   │   ├── api.ts                      # Network API wrapper
│   │   │   ├── authService.ts              # LocalStorage & Neon user management
│   │   │   ├── neonService.ts              # Direct Neon Postgres SQL queries
│   │   │   ├── offlineQueue.ts             # IndexedDB transaction manager
│   │   │   ├── treeService.ts              # Tree CRUD, merging & cache engine
│   │   │   └── gps/                        # Centroid math & stability calculations
│   │   │       ├── gpsAccuracy.ts
│   │   │       ├── gpsService.ts
│   │   │       ├── gpsStability.ts
│   │   │       └── positionProvider.ts
│   │   ├── types/                          # TypeScript definitions
│   │   │   ├── gps.ts
│   │   │   └── tree.ts
│   │   └── utils/                          # Helper utilities
│   │       └── imageCompression.ts         # Client canvas compression routines
│   ├── package.json                        # Frontend dependencies & scripts
│   ├── tsconfig.json                       # TypeScript compiler options
│   ├── vite.config.ts                      # Vite build configuration
│   └── vercel.json                         # Vercel subproject routing
└── README.md                               # Master Project Documentation
```

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `3.9` or higher
- Modern Web Browser with Location and Camera permissions enabled (Google Chrome, Firefox, Safari, or Microsoft Edge)

### 1. Clone the Repository
```bash
git clone https://github.com/jibinwilson2004/YP-GREEN-LEGACY-PROJECT.git
cd YP-GREEN-LEGACY-PROJECT
```

### 2. Install Dependencies
You can install dependencies from the project root (which triggers recursive resolution for `yp-legacy-web`):
```bash
npm install
npm --prefix yp-legacy-web install
```

### 3. Start the Python SMTP & OTP Microservice
Open a dedicated terminal window and run:
```bash
python otp_server.py
```
*Expected Console Output:*
```text
==================================================
 IEEE Tree Tag OTP Verification Server
 Running on http://127.0.0.1:5001
 Sender: jibinwilson315@gmail.com
==================================================
```

### 4. Start the React Frontend Dev Server
In another terminal window:
```bash
npm run dev
# OR: npm --prefix yp-legacy-web run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## ⚙️ Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Refer to `.env.example` for the complete specification. Never expose `DATABASE_URL` or Google Drive private keys in frontend bundles or `VITE_` variables.

```env
# ── Frontend Configuration (Vite) ──
VITE_API_BASE=""

# ── Backend Privileged Configuration (Server Only) ──
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-instance.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
GOOGLE_DRIVE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="your_drive_folder_id"
GMAIL_ADDRESS="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-char-app-password"
PORT=5001
```

---

## 🚢 Deployment Guide

### Deploying on Vercel
The repository includes a top-level `vercel.json` configured to route backend `/api/*` serverless calls to Express handlers and client-side routes to the Vite single-page application:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "yp-legacy-web/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

1. Connect your GitHub repository to [Vercel](https://vercel.com/).
2. Keep the Framework Preset as **Vite** or **Other**.
3. Set the Root Directory as `./`.
4. Configure backend environment variables in Vercel Project Settings:
   - `DATABASE_URL`: Neon PostgreSQL connection string (prefer pooled endpoint).
   - `JWT_SECRET`: Random 64-character secret.
   - `GOOGLE_DRIVE_CLIENT_EMAIL`: GCP Service account email.
   - `GOOGLE_DRIVE_PRIVATE_KEY`: Service account private key PEM.
   - `GOOGLE_DRIVE_FOLDER_ID`: Dedicated Google Drive folder ID.
   - `ADMIN_EMAIL`: Designated administrator email.
   - `ADMIN_INITIAL_PASSWORD`: Secure initial admin password.
5. Click **Deploy**. Vercel will bundle the React frontend and deploy the serverless `/api` backend. Run `npm run migrate` to apply database migrations.

---

## 🎨 IEEE Brand Identity Compliance

This platform strictly adheres to the official **IEEE Web & Brand Identity Guidelines for Organizational Units (OUs)**:
- **Master Brand Display**: The official IEEE emblem is positioned in the header navigation with required clear-space margins.
- **Brand Palette**:
  - **IEEE Primary Blue**: `#00629B` (Master header and official organizational badges).
  - **Forest Green & Emerald Accents**: `#002218` (Primary Deep Forest), `#196b4f` (Secondary Foliage), and `#a2f0cc` (High-contrast telemetry mint).
  - **Neutral Surfaces**: Crisp high-contrast surfaces (`#f4fbf4`, `#ffffff`) engineered for outdoor legibility in sunlight.
- **Mandatory Compliance Links**: The application footer incorporates mandatory institutional compliance links:
  - [IEEE Privacy Policy](https://www.ieee.org/security-privacy.html)
  - [IEEE Terms & Conditions](https://www.ieee.org/about/help/terms-conditions.html)
  - [IEEE Nondiscrimination Policy](https://www.ieee.org/about/help/terms-conditions.html)

---

## 👥 Institutional Governance & Authors

- **Organizational Unit**: IEEE Young Professionals Climate & Sustainability Taskforce (CSTF)
- **Institutional Partner**: APJ Abdul Kalam Technological University NSS Cell National Reforestation Program (APJAKTU NSSCELL NRPF)
- **Principal Lead & Maintainer**: Jibin Wilson ([@jibinwilson2004](https://github.com/jibinwilson2004))
- **Email Contact**: `jibinwilson315@gmail.com`

---

<p align="center">
  <b>IEEE YP Green Legacy Project</b> — <i>Seeding the future, one verifiable tree at a time.</i><br/>
  © 2026 IEEE Young Professionals Climate &amp; Sustainability Taskforce. All Rights Reserved.
</p>
