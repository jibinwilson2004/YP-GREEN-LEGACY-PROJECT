# YP Green Legacy FastAPI backend

The active API is an independent FastAPI service. Existing Node/Python backend
code and photographs remain archived under `archive/legacy-node-backend`; this
service does not modify or import that data.

## Requirements

- Python 3.10+
- PostgreSQL 14+ with PostGIS available
- Cloudflare R2 credentials and bucket for photo operations
- A long random `JWT_SECRET_KEY` (at least 32 random bytes)

## Local setup

From the repository root in PowerShell:

```powershell
py -3 -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Set `DATABASE_URL` to a new PostgreSQL database and set a secret key, for
example with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
Set `FRONTEND_ORIGINS=http://localhost:5173`. For a managed PostgreSQL service,
ensure PostGIS is available to the database user.

Configure these R2 values in `backend/.env`:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT_URL` (usually `https://<account-id>.r2.cloudflarestorage.com`)
- `R2_PUBLIC_BASE_URL` (optional; omit to use expiring signed download URLs)

For private buckets, allow browser `PUT` from the frontend origin in the
bucket's CORS settings, with the `Content-Type` request header. Do not expose
R2 credentials in `frontend/.env`.

Apply migrations and start the API:

```powershell
python -m alembic -c backend\alembic.ini upgrade head
npm run dev:backend
```

Alternatively, run `python -m uvicorn app.main:app --reload --port 8000` from
the `backend` directory. `GET /healthz` is a liveness check; `GET /readyz`
checks database connectivity. Open `/docs` for the generated OpenAPI contract.

The React app uses Vite's `/api` proxy to `http://localhost:8000` when
`VITE_API_BASE_URL` is blank. For a deployed API, set the frontend variable to
the full versioned base URL, such as `https://api.example.com/api/v1`.

## Database and admin setup

Migrations create users, trees, photos, GPS readings, institutions, clusters,
verifications, audit logs, and partner requests. The first registered account
has the regular `user` role. Promote a trusted account explicitly through a
database administrator after registration:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Do not expose database credentials to the browser. Tree records are
soft-deleted. Existing production data is not automatically copied; export and
review the legacy system separately before any migration.

## API contract

All application endpoints are under `/api/v1`:

- Auth: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`;
  `GET /auth/me`. Refresh tokens are HttpOnly cookies; refresh/logout also
  validate a double-submit CSRF token. Access tokens are short lived.
- Trees: `POST /trees`, `GET /trees`, `GET /trees/{id}`, `PATCH /trees/{id}`,
  `DELETE /trees/{id}`.
- Photos: `POST /trees/{id}/photos/upload-url`, then upload the bytes with HTTP
  `PUT` to the returned URL, then `POST /trees/{id}/photos/confirm`;
  `GET /trees/{id}/photos`, `DELETE /trees/{id}/photos/{photo_id}`.
- GPS: `POST` and `GET /trees/{id}/gps-readings`.
- Review: `GET /verification/pending`, and `POST
  /verification/{id}/approve`, `/reject`, `/request-reverification`.
- Map: `GET /map/trees` requires viewport bounds and supports institution,
  cluster, verification status, user filtering, and a bounded result count.
  Non-admin users see verified markers, or their own markers when filtering by
  their account email. `GET /map/clusters` returns server-side grouped points.
- Institutions/clusters: list, create (admin only), and detail routes under
  `/institutions` and `/clusters`.
- Admin: `GET /admin/dashboard/statistics`, `GET /participants`.
- Partner contact: `POST /partner-requests`.

Tree listing is paginated (maximum 200 per page); map requests are spatially
bounded and capped. Admin and owner-only operations require a bearer access
token. Public map/detail reads expose verified trees only.

## Limitations and external configuration

R2 uploads/downloads return `503` until valid R2 variables are configured.
Email OTP/password reset is not part of this backend yet; the frontend no
longer accepts a locally generated or arbitrary OTP as proof of identity.
Account registration and password login work without email delivery.

## Tests and deployment

Run backend tests from the repository root with `python -m pytest backend/tests`
or `npm run test:backend`. Deploy using `uvicorn app.main:app --host 0.0.0.0
--port $PORT` from `backend/`; apply `alembic upgrade head` during deployment.
Set the environment variables above, including the production frontend origin.
Keep the React frontend deployment independent and set its
`VITE_API_BASE_URL` to the deployed versioned API.
