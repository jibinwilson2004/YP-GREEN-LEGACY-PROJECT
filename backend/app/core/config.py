from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_JWT_SECRET = "nsjQ5XagCUtVzn7k4iTErft4u_QYq78DvsOupeixLUASwH8DHsp1NDU4tGeUZCWL"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            Path(__file__).resolve().parents[2] / ".env",
            Path(__file__).resolve().parents[3] / ".env",
            Path.cwd() / ".env",
            Path.cwd() / "backend" / ".env",
        ),
        env_ignore_empty=True,
        extra="ignore",
    )

    database_url: str | None = None
    jwt_secret_key: str = DEFAULT_JWT_SECRET
    jwt_access_token_expire_minutes: int = 20
    jwt_refresh_token_expire_days: int = 14
    frontend_origins: str = "http://localhost:5173"
    environment: str = "development"
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None
    r2_endpoint_url: str | None = None
    r2_public_base_url: str | None = None
    max_photo_bytes: int = 10 * 1024 * 1024

    @property
    def effective_jwt_secret_key(self) -> str:
        secret = (self.jwt_secret_key or "").strip()
        if len(secret) >= 32:
            return secret
        return DEFAULT_JWT_SECRET

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
