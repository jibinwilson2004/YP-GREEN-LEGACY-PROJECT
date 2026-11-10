import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import get_settings
from app.database.session import get_session_factory
from app.routers import auth, map, photos, resources, trees

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="YP Green Legacy API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(trees.router, prefix="/api/v1")
app.include_router(map.router, prefix="/api/v1")
app.include_router(photos.router, prefix="/api/v1")
app.include_router(resources.router, prefix="/api/v1")


@app.on_event("startup")
def init_schema():
    try:
        with get_session_factory()() as db:
            db.execute(text("ALTER TABLE trees ADD COLUMN IF NOT EXISTS country VARCHAR(100)"))
            db.commit()
    except Exception:
        logging.getLogger(__name__).warning("Schema auto-patch deferred (DB unreachable or already updated)")


@app.get("/healthz")
def health():
    return {"status": "ok"}


@app.get("/readyz")
def readiness():
    try:
        with get_session_factory()() as db:
            db.execute(text("SELECT 1"))
    except Exception as exc:
        logging.getLogger(__name__).exception("Readiness check failed")
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc
    return {"status": "ready"}
