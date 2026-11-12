import csv
import io
import math
import re
import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

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
from app.services.storage import delete_object, delete_objects_by_prefix, get_object_url
from app.utils.security import get_current_user, get_optional_user, require_admin

router = APIRouter(tags=["trees"])


def generate_tree_tag_id(username_or_email: str | None, country: str | None, ts: int | None = None) -> str:
    raw_user = (username_or_email or "user").split("@")[0]
    clean_user = re.sub(r"[^a-zA-Z0-9]", "_", raw_user).lower()
    clean_user = re.sub(r"_+", "_", clean_user).strip("_") or "user"

    raw_country = (country or "india").lower()
    clean_country = re.sub(r"[^a-zA-Z0-9]", "_", raw_country).lower()
    clean_country = re.sub(r"_+", "_", clean_country).strip("_") or "global"

    timestamp = ts if ts is not None else int(datetime.now(timezone.utc).timestamp())
    return f"{clean_user}_{clean_country}_{timestamp}"


def _tree_code() -> str:
    return f"YP-{uuid.uuid4().hex[:12].upper()}"


def _tree_output(tree: Tree, db: Session, is_admin: bool = False) -> TreeRead:
    photo_urls: list[str] = []
    try:
        photos = getattr(tree, "photos", None)
        if photos is None:
            photos = db.scalars(select(TreePhoto).where(TreePhoto.tree_id == tree.id).order_by(TreePhoto.created_at)).all()
        photo_urls = [get_object_url(p.object_key) for p in photos]
    except Exception:
        pass

    raw_data = {column.name: getattr(tree, column.name) for column in Tree.__table__.columns if column.name != "location"}
    # Hide institution details from non-administrators / public viewers
    if not is_admin:
        raw_data["institution"] = None
        raw_data["college"] = None
        raw_data["institution_id"] = None

    return TreeRead.model_validate(
        {
            **raw_data,
            "image_url": photo_urls[0] if photo_urls else None,
            "images": photo_urls,
        }
    )


def _visible_tree_query():
    return select(Tree).where(Tree.deleted_at.is_(None)).options(selectinload(Tree.photos))


@router.post("/trees", response_model=TreeRead, status_code=201)
def create_tree(payload: TreeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    code = payload.id
    if not code or code.startswith("YP-"):
        code = generate_tree_tag_id(user.email, payload.country)
    existing = db.get(Tree, code)
    if existing is not None:
        if existing.user_id == user.email and existing.deleted_at is None:
            return _tree_output(existing, db, is_admin=(user.role == "admin"))
        suffix = int(datetime.now(timezone.utc).microsecond // 1000)
        code = f"{code}_{suffix}"
        existing = db.get(Tree, code)
        if existing is not None:
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
    return _tree_output(tree, db, is_admin=(user.role == "admin"))


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
    is_admin = user is not None and user.role == "admin"
    if user is None:
        query = query.where(Tree.verification_status == "VERIFIED")
    elif not is_admin:
        query = query.where((Tree.verification_status == "VERIFIED") | (Tree.user_id == user.email))
    if search:
        query = query.where(Tree.species.ilike(f"%{search}%") | Tree.id.ilike(f"%{search}%"))
    if species:
        query = query.where(Tree.species.ilike(f"%{species}%"))
    if status:
        query = query.where(Tree.verification_status == status.upper())
    if user_id:
        if not is_admin and (user is None or user_id.lower() != user.email.lower()):
            raise HTTPException(status_code=403, detail="You may only access your own tree-tagging records")
        user_clean = user_id.lower()
        user_prefix = re.sub(r"[^a-zA-Z0-9]", "_", user_clean.split("@")[0]).strip("_")
        query = query.where(
            (func.lower(Tree.user_id) == user_clean)
            | (func.lower(Tree.user_id) == user_prefix)
            | (Tree.id.ilike(f"{user_prefix}_%"))
        )
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Tree.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return TreeList(trees=[_tree_output(item, db, is_admin=is_admin) for item in items], total=total, page=page, total_pages=math.ceil(total / limit))


@router.get("/trees/{tree_id}", response_model=TreeRead)
def get_tree(tree_id: str, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None or (
        tree.verification_status != "VERIFIED"
        and (user is None or (user.role != "admin" and tree.user_id != user.email))
    ):
        raise HTTPException(status_code=404, detail="Tree not found")
    is_admin = user is not None and user.role == "admin"
    return _tree_output(tree, db, is_admin=is_admin)


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
    return _tree_output(tree, db, is_admin=(user.role == "admin"))


@router.delete("/trees/{tree_id}", status_code=204)
def delete_tree(tree_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = db.scalar(_visible_tree_query().where(Tree.id == tree_id))
    if tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if user.role != "admin" and tree.user_id.lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="You may only delete your own tree")
    if user.role != "admin" and tree.verification_status == "VERIFIED":
        raise HTTPException(status_code=409, detail="Verified trees cannot be deleted by their owner")

    # Mandatory: permanently delete all photo files from cloud storage (Cloudflare R2)
    photos = []
    try:
        photos = db.scalars(select(TreePhoto).where(TreePhoto.tree_id == tree_id)).all()
    except Exception:
        pass

    for p in photos:
        try:
            delete_object(p.object_key, ignore_missing=True)
        except Exception:
            pass
        try:
            db.delete(p)
        except Exception:
            pass

    # Purge any remaining files under trees/{tree_id}/ in Cloud Storage
    try:
        delete_objects_by_prefix(f"trees/{tree_id}/")
    except Exception:
        pass

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
    return [_tree_output(item, db, is_admin=True) for item in rows]


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
    return _tree_output(tree, db, is_admin=True)


@router.get("/admin/trees/export")
def export_tree_records(
    format: Literal["csv", "excel"] = "csv",
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    trees = db.scalars(_visible_tree_query().order_by(Tree.created_at.desc())).all()
    headers = [
        "Tree ID",
        "Species",
        "Common Name",
        "Botanical Name",
        "Country",
        "Latitude",
        "Longitude",
        "Accuracy (m)",
        "GPS Source",
        "Location Confidence (%)",
        "Location Status",
        "Stability Score (%)",
        "Reading Count",
        "Date of Planting",
        "Captured At",
        "Student Planter",
        "Submitted By (User)",
        "Verification Status",
        "Tagged Status",
        "Verified By",
        "Verification Date",
        "Identification Confidence (%)",
        "Admin Note",
        "Photo URLs",
        "Institution (Public Restriction)",
    ]

    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow(headers)

    for tree in trees:
        photos = getattr(tree, "photos", None) or []
        photo_urls = [get_object_url(p.object_key) for p in photos]
        writer.writerow([
            tree.id,
            tree.species,
            tree.common_name or "",
            tree.botanical_name or "",
            getattr(tree, "country", None) or "",
            f"{tree.latitude:.6f}",
            f"{tree.longitude:.6f}",
            f"{tree.accuracy:.1f}",
            tree.gps_source,
            str(tree.location_confidence),
            tree.location_status,
            str(tree.stability_score),
            str(tree.reading_count),
            tree.date_of_planting or "",
            tree.captured_at.isoformat() if tree.captured_at else "",
            tree.student or "",
            tree.user_id or "",
            tree.verification_status,
            "Tagged" if tree.verification_status == "VERIFIED" else "Pending Verification",
            tree.verified_by or "",
            tree.verification_date.isoformat() if tree.verification_date else "",
            str(tree.identification_confidence),
            tree.admin_note or "",
            "; ".join(photo_urls),
            "[Hidden for Public Privacy]",
        ])

    csv_data = output.getvalue().encode("utf-8")
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    extension = "csv" if format == "csv" else "xls"
    filename = f"tagged_trees_records_{date_str}.{extension}"
    media_type = "text/csv; charset=utf-8" if format == "csv" else "application/vnd.ms-excel; charset=utf-8"

    return Response(
        content=csv_data,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
