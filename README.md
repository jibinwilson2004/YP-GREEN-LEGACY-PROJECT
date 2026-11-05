# IEEE YP Green Legacy Project

The IEEE Young Professionals Green Legacy Project is a tree registration and
verification application. The existing React UI, GPS capture workflow, and
Leaflet map are retained. The active application now uses a separate FastAPI
backend; the former backend is preserved, but inactive, under
[`archive/legacy-node-backend/`](./archive/legacy-node-backend/).

## Architecture

```text
React + TypeScript + Vite
       │ /api/v1 (JWT, JSON)
       ▼
FastAPI + SQLAlchemy + Alembic
       ├── PostgreSQL + PostGIS
       └── Cloudflare R2 (presigned image URLs)
```

- Tree, GPS, verification, institution, cluster, and audit data is stored in
  PostgreSQL. Geographic viewport queries use PostGIS.
- Images are stored as objects in Cloudflare R2; only object keys and metadata
  are stored in the database.
- Passwords are hashed with Argon2. API access tokens are short-lived JWTs;
  refresh tokens use HttpOnly cookies.
- The frontend does not contain database or R2 credentials. Map queries are
  viewport-bounded and limited; the browser does not download the full registry.
- Registration/login are implemented. Email OTP/password reset remains
  unavailable until an email provider is configured; no demo code is accepted.
- Existing production data and archived photographs are not automatically
  migrated or deleted.

## Local development

Requirements: Node.js 20+, Python 3.10+, PostgreSQL with PostGIS, and (for
photo operations) a Cloudflare R2 bucket.

In PowerShell from the repository root:

```powershell
npm --prefix frontend install
py -3 -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Set `DATABASE_URL`, a random `JWT_SECRET_KEY`, `FRONTEND_ORIGINS`, and the R2
variables in `backend\.env`. Apply schema migrations and start FastAPI:

```powershell
python -m alembic -c backend\alembic.ini upgrade head
npm run dev:backend
```

In another terminal:

```powershell
npm run dev:frontend
```

The frontend runs at `http://localhost:5173` and the API at
`http://localhost:8000`. Vite proxies `/api` requests locally. `GET /healthz`
checks process liveness; `GET /readyz` checks database connectivity. Browse
`http://localhost:8000/docs` for the interactive API schema.

For a deployed frontend, set `VITE_API_BASE_URL` to the versioned API URL, for
example `https://api.example.com/api/v1`. Backend configuration and R2
instructions are in [`backend/README.md`](./backend/README.md).

## Common commands

```powershell
npm run build:frontend
npm run test:frontend
python -m pytest backend\tests
```

## Frontend

The UI is built with React, TypeScript, Vite, Tailwind CSS, and Leaflet. It
includes GPS capture and validation, an offline draft queue, tree details,
photo galleries, and the admin verification interface. Feature code is under
[`frontend/src/`](./frontend/src/).

## API contract

Application endpoints are versioned under `/api/v1`. The main groups are:

- `/auth`: registration, login, refresh, logout, current user
- `/trees`: paginated tree CRUD
- `/trees/{id}/photos`: presigned upload, confirmation, retrieval, deletion
- `/trees/{id}/gps-readings`: GPS reading persistence
- `/verification`: pending review, approval, rejection, reverification
- `/map/trees` and `/map/clusters`: bounded spatial results and server-side
  clusters
- `/institutions`, `/clusters`, `/admin/dashboard/statistics`
- `/partner-requests`

Authorization and filters are enforced server-side. See
[`backend/README.md`](./backend/README.md) for request details and deployment.

## Governance

- IEEE Young Professionals Climate & Sustainability Taskforce
- Institutional partner: APJ Abdul Kalam Technological University NSS Cell
- Maintainer: [Jibin Wilson](https://github.com/jibinwilson2004)

The frontend retains the project's IEEE-inspired green visual system and
institutional compliance links.
