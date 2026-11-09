import math
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import AuditLog, Cluster, GpsReading, Institution, Tree, TreePhoto, User, Verification
from app.schemas.common import (
    GpsReadingCreate,
    GpsReadingRead,
    ReviewRequest,
    TreeCreate,
    TreeList,
    TreeRead,
    TreeUpdate,
)
from app.utils.security import get_current_user, get_optional_user, require_admin

router = APIRouter(tags=["trees"])


def _tree_code() -> str:
    return f"YP-{uuid.uuid4().hex[:12].upper()}"


def _tree_output(tree: Tree, db: Session) -> TreeRead:
    return TreeRead.model_validate(
        {
            **{column.name: getattr(tree, column.name) for column in Tree.__table__.columns if column.name != "location"},
            "image_url": None,
            "images": [],
        }
    )


def _visible_tree_query():
    return select(Tree).where(Tree.deleted_at.is_(None))


@router.post("/trees", response_model=TreeRead, status_code=201)
def create_tree(payload: TreeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    code = payload.id or _tree_code()
    existing = db.get(Tree, code)
    if existing is not None:
        if existing.user_id == user.email and existing.deleted_at is None:
            return _tree_output(existing, db)
        raise HTTPException(status_code=409, detail="Tree code already exists")
    values = payload.model_dump(exclude={"id", "captured_at"})
    institution = db.scalar(select(Institution).where(Institution.name == payload.institution)) if payload.institution else None
    cluster = db.scalar(select(Cluster).where(Cluster.name == payload.cluster)) if payload.cluster else None
    tree = Tree(
        id=code,
        **values,
        institution_id=institution.id if institution else (cluster.institution_id if cluster else None),
        cluster_id=cluster.id if cluster else None,
        user_id=user.email,
        captured_at=payload.captured_at or datetime.now(timezone.utc),
        location=from_shape(Point(payload.longitude, payload.latitude), srid=4326),
    )
    db.add(tree)
    db.add(AuditLog(actor_id=user.id, action="tree.created", entity_type="tree", entity_id=code))
    db.commit()
    db.refresh(tree)
    return _tree_output(tree, db)


@router.get("/trees", response_model=TreeList)
def list_trees(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    search: str | None = None,
    species: str | None = None,
    status: str | None = None,
    user_id: str | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    query = _visible_tree_query()
    if user is None:
        query = query.where(Tree.verification_status == "VERIFIED")
    elif user.role != "admin":
        query = query.where((Tree.verification_status == "VERIFIED") | (Tree.user_id == user.email))
    if search:
        query = query.where(Tree.species.ilike(f"%{search}%") | Tree.id.ilike(f"%{search}%"))
    if species:
        query = query.where(Tree.species.ilike(f"%{species}%"))
    if status:
        query = query.where(Tree.verification_status == status.upper())
    if user_id:
        query = query.where(Tree.user_id == user_id)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Tree.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return TreeList(trees=[_tree_output(item, db) for item in items], total=total, page=page, total_pages=math.ceil(total / limit))


@router.get("/trees/{tree_id}", response_model=TreeRead)
def get_tree(tree_id: str, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None or (
        tree.verification_status != "VERIFIED"
        and (user is None or (user.role != "admin" and tree.user_id != user.email))
    ):
        raise HTTPException(status_code=404, detail="Tree not found")
    return _tree_output(tree, db)


@router.patch("/trees/{tree_id}", response_model=TreeRead)
def update_tree(tree_id: str, payload: TreeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if user.role != "admin" and tree.user_id != user.email:
        raise HTTPException(status_code=403, detail="You may only update your own tree")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tree, key, value)
    if "institution" in payload.model_fields_set:
        institution = db.scalar(select(Institution).where(Institution.name == payload.institution)) if payload.institution else None
        tree.institution_id = institution.id if institution else None
    if "cluster" in payload.model_fields_set:
        cluster = db.scalar(select(Cluster).where(Cluster.name == payload.cluster)) if payload.cluster else None
        tree.cluster_id = cluster.id if cluster else None
        if cluster and not tree.institution_id:
            tree.institution_id = cluster.institution_id
    db.add(AuditLog(actor_id=user.id, action="tree.updated", entity_type="tree", entity_id=tree.id))
    db.commit()
    db.refresh(tree)
    return _tree_output(tree, db)


@router.delete("/trees/{tree_id}", status_code=204)
def delete_tree(tree_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if user.role != "admin" and tree.user_id.lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="You may only delete your own tree")
    if user.role != "admin" and tree.verification_status == "VERIFIED":
        raise HTTPException(status_code=409, detail="Verified trees cannot be deleted by their owner")
    tree.deleted_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_id=user.id, action="tree.deleted", entity_type="tree", entity_id=tree.id))
    db.commit()


@router.post("/trees/{tree_id}/gps-readings", response_model=list[GpsReadingRead], status_code=201)
def add_gps_readings(
    tree_id: str,
    readings: list[GpsReadingCreate],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None or (user.role != "admin" and tree.user_id != user.email):
        raise HTTPException(status_code=404, detail="Tree not found")
    if not readings or len(readings) > 500:
        raise HTTPException(status_code=422, detail="Provide between 1 and 500 GPS readings")
    entities = [
        GpsReading(
            tree_id=tree_id,
            latitude=item.latitude,
            longitude=item.longitude,
            accuracy=item.accuracy,
            altitude=item.altitude,
            timestamp=item.timestamp or datetime.now(timezone.utc),
        )
        for item in readings
    ]
    db.add_all(entities)
    tree.reading_count = max(tree.reading_count, len(entities))
    db.commit()
    return entities


@router.get("/trees/{tree_id}/gps-readings", response_model=list[GpsReadingRead])
def get_gps_readings(tree_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None or (user.role != "admin" and tree.verification_status != "VERIFIED" and tree.user_id != user.email):
        raise HTTPException(status_code=404, detail="Tree not found")
    return db.scalars(select(GpsReading).where(GpsReading.tree_id == tree_id).order_by(GpsReading.timestamp)).all()


@router.get("/verification/pending", response_model=list[TreeRead])
def pending_verification(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = db.scalars(_visible_tree_query().where(Tree.verification_status == "PENDING").order_by(Tree.created_at)).all()
    return [_tree_output(item, db) for item in rows]


@router.post("/verification/{tree_id}/approve", response_model=TreeRead)
def approve_tree(tree_id: str, payload: ReviewRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _review(tree_id, "VERIFIED", payload.admin_note, db, admin)


@router.post("/verification/{tree_id}/reject", response_model=TreeRead)
def reject_tree(tree_id: str, payload: ReviewRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _review(tree_id, "REJECTED", payload.admin_note, db, admin)


@router.post("/verification/{tree_id}/request-reverification", response_model=TreeRead)
def request_reverification(tree_id: str, payload: ReviewRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _review(tree_id, "PENDING", payload.admin_note, db, admin)


def _review(tree_id: str, status: str, note: str | None, db: Session, admin: User) -> TreeRead:
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    tree.verification_status = status
    tree.verified_by = admin.email
    tree.verification_date = datetime.now(timezone.utc)
    tree.admin_note = note
    db.add(Verification(tree_id=tree.id, reviewer_id=admin.id, status=status, note=note))
    db.add(AuditLog(actor_id=admin.id, action=f"tree.{status.lower()}", entity_type="tree", entity_id=tree.id))
    db.commit()
    db.refresh(tree)
    return _tree_output(tree, db)
