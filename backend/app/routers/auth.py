from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.session import get_db
from app.models.entities import User
from app.schemas.common import LoginRequest, TokenResponse, UserCreate, UserRead
from app.utils.security import (
    create_token,
    decode_token,
    get_current_user,
    hash_password,
    set_refresh_cookie,
    verify_password,
    verify_csrf,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


def _token_response(user: User, response: Response) -> TokenResponse:
    settings = get_settings()
    access = create_token(user, "access", timedelta(minutes=settings.jwt_access_token_expire_minutes))
    refresh = create_token(user, "refresh", timedelta(days=settings.jwt_refresh_token_expire_days))
    csrf_token = set_refresh_cookie(response, refresh)
    return TokenResponse(
        user=UserRead.model_validate(user),
        token=access,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        csrf_token=csrf_token,
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        institution=payload.institution,
        ieee_id=payload.ieee_id,
        membership_grade=payload.membership_grade,
        region=payload.region,
        section=payload.section,
        country=payload.country,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user, response)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or user.disabled or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return _token_response(user, response)


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    verify_csrf(request)
    token = request.cookies.get("yp_refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh cookie is missing")
    payload = decode_token(token, "refresh")
    user = db.get(User, int(payload["sub"]))
    if user is None or user.disabled:
        raise HTTPException(status_code=401, detail="User is unavailable")
    settings = get_settings()
    access = create_token(user, "access", timedelta(minutes=settings.jwt_access_token_expire_minutes))
    replacement = create_token(user, "refresh", timedelta(days=settings.jwt_refresh_token_expire_days))
    csrf_token = set_refresh_cookie(response, replacement)
    return {"token": access, "expires_in": settings.jwt_access_token_expire_minutes * 60, "csrf_token": csrf_token}


@router.post("/logout")
def logout(request: Request, response: Response):
    verify_csrf(request)
    secure = get_settings().environment == "production"
    response.delete_cookie("yp_refresh_token", path="/api/v1/auth", httponly=True, secure=secure)
    response.delete_cookie("yp_csrf_token", path="/api/v1/auth", secure=secure)
    return {"success": True}


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user
