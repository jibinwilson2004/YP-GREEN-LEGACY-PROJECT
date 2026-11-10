from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Tree, User
from app.routers.trees import _tree_output, _visible_tree_query
from app.schemas.common import TreeRead
from app.utils.security import get_optional_user

router = APIRouter(prefix="/map", tags=["map"])


@router.get("/trees", response_model=list[TreeRead])
def map_trees(
    min_lat: float = Query(ge=-90, le=90),
    max_lat: float = Query(ge=-90, le=90),
    min_lng: float = Query(ge=-180, le=180),
    max_lng: float = Query(ge=-180, le=180),
    zoom: int = Query(default=10, ge=0, le=24),
    institution: str | None = None,
    cluster: str | None = None,
    user_id: str | None = None,
    status: Literal["VERIFIED", "PENDING", "REJECTED", "FLAGGED"] | None = None,
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    if min_lat > max_lat or min_lng > max_lng:
        raise HTTPException(status_code=422, detail="Viewport minimum bounds must not exceed maximum bounds")
    is_admin = user is not None and user.role == "admin"
    own_filter = user is not None and user_id is not None and user_id.lower() == user.email.lower()
    if status and status != "VERIFIED" and not is_admin and not own_filter:
        raise HTTPException(status_code=403, detail="Only administrators can view unverified tree markers")
    envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    limit = min(limit, max(500, zoom * 50))
    query = _visible_tree_query().where(func.ST_Intersects(Tree.location, envelope))
    if not is_admin and not own_filter:
        query = query.where(Tree.verification_status == "VERIFIED")
    if institution:
        query = query.where(Tree.institution == institution)
    if cluster:
        query = query.where(Tree.cluster == cluster)
    if user_id:
        query = query.where(func.lower(Tree.user_id) == user_id.lower())
    if status:
        query = query.where(Tree.verification_status == status)
    rows = db.scalars(query.order_by(Tree.created_at.desc()).limit(limit)).all()
    return [_tree_output(row, db, is_admin=is_admin) for row in rows]


@router.get("/clusters")
def map_clusters(
    min_lat: float = Query(ge=-90, le=90),
    max_lat: float = Query(ge=-90, le=90),
    min_lng: float = Query(ge=-180, le=180),
    max_lng: float = Query(ge=-180, le=180),
    zoom: int = Query(default=6, ge=0, le=24),
    db: Session = Depends(get_db),
):
    if min_lat > max_lat or min_lng > max_lng:
        return {"clusters": []}
    envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    precision = max(1, min(5, zoom // 3))
    scale = 10**precision
    latitude_bin = func.floor(Tree.latitude * scale) / scale
    longitude_bin = func.floor(Tree.longitude * scale) / scale
    rows = db.execute(
        select(latitude_bin, longitude_bin, func.count())
        .where(
            Tree.deleted_at.is_(None),
            Tree.verification_status == "VERIFIED",
            func.ST_Intersects(Tree.location, envelope),
        )
        .group_by(latitude_bin, longitude_bin)
        .limit(1000)
    ).all()
    return {
        "clusters": [
            {"latitude": float(lat), "longitude": float(lng), "count": count}
            for lat, lng, count in rows
        ]
    }
