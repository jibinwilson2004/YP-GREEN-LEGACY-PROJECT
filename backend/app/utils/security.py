import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.session import get_db
from app.models.entities import User

_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)


DEFAULT_JWT_SECRET = "nsjQ5XagCUtVzn7k4iTErft4u_QYq78DvsOupeixLUASwH8DHsp1NDU4tGeUZCWL"


def _get_jwt_secret() -> str:
    settings = get_settings()
    secret = getattr(settings, "effective_jwt_secret_key", None) or getattr(settings, "jwt_secret_key", "")
    secret = (secret or "").strip()
    if len(secret) < 32:
        return DEFAULT_JWT_SECRET
    return secret


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_token(user: User, token_type: str, lifetime: timedelta) -> str:
    secret = _get_jwt_secret()
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user.id), "type": token_type, "iat": now, "exp": now + lifetime},
        secret,
        algorithm="HS256",
    )


def decode_token(token: str, expected_type: str = "access") -> dict:
    secret = _get_jwt_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    user = db.get(User, int(payload["sub"]))
    if user is None or user.disabled:
        raise HTTPException(status_code=401, detail="User is unavailable")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials)
    user = db.get(User, int(payload["sub"]))
    if user is None or user.disabled:
        raise HTTPException(status_code=401, detail="User is unavailable")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required")
    return user


def set_refresh_cookie(response, token: str) -> str:
    settings = get_settings()
    csrf_token = secrets.token_urlsafe(32)
    same_site = "none" if settings.environment == "production" else "lax"
    response.set_cookie(
        "yp_refresh_token",
        token,
        httponly=True,
        secure=settings.environment == "production",
        samesite=same_site,
        max_age=settings.jwt_refresh_token_expire_days * 86400,
        path="/api/v1/auth",
    )
    response.set_cookie(
        "yp_csrf_token",
        csrf_token,
        httponly=False,
        secure=settings.environment == "production",
        samesite=same_site,
        max_age=settings.jwt_refresh_token_expire_days * 86400,
        path="/api/v1/auth",
    )
    return csrf_token


def verify_csrf(request: Request) -> None:
    csrf_cookie = request.cookies.get("yp_csrf_token")
    csrf_header = request.headers.get("X-CSRF-Token")
    if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status_code=403, detail="Invalid CSRF token")
