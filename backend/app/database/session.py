from collections.abc import Generator
from functools import lru_cache

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def _database_url() -> str:
    url = get_settings().database_url
    if not url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=create_engine(_database_url(), pool_pre_ping=True), autoflush=False)


def get_db() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()
