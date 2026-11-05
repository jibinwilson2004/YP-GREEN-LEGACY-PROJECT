from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Cluster, Institution, PartnerRequest, Tree, User
from app.schemas.common import DashboardStats, PartnerRequestCreate, PublicStats, ResourceCreate, ResourceRead
from app.utils.security import require_admin

router = APIRouter(tags=["institutions, clusters, and administration"])


@router.post("/partner-requests", status_code=201)
def create_partner_request(payload: PartnerRequestCreate, db: Session = Depends(get_db)):
    request = PartnerRequest(
        organization_name=payload.organization_name,
        contact_name=payload.contact_name,
        email=str(payload.email).lower(),
        phone=payload.phone,
        organization_type=payload.organization_type,
        message=payload.message,
    )
    db.add(request)
    db.commit()
    return {"success": True, "id": request.id}


@router.get("/institutions", response_model=list[ResourceRead])
def list_institutions(db: Session = Depends(get_db)):
    return db.scalars(select(Institution).order_by(Institution.name)).all()


@router.post("/institutions", response_model=ResourceRead, status_code=201)
def create_institution(payload: ResourceCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    item = Institution(name=payload.name, description=payload.description)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Institution name already exists")
    db.refresh(item)
    return item


@router.get("/institutions/{institution_id}", response_model=ResourceRead)
def get_institution(institution_id: int, db: Session = Depends(get_db)):
    item = db.get(Institution, institution_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    return item


@router.get("/clusters", response_model=list[ResourceRead])
def list_clusters(db: Session = Depends(get_db)):
    return db.scalars(select(Cluster).order_by(Cluster.name)).all()


@router.post("/clusters", response_model=ResourceRead, status_code=201)
def create_cluster(payload: ResourceCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    item = Cluster(name=payload.name, institution_id=payload.institution_id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cluster name already exists or institution does not exist")
    db.refresh(item)
    return item


@router.get("/clusters/{cluster_id}", response_model=ResourceRead)
def get_cluster(cluster_id: int, db: Session = Depends(get_db)):
    item = db.get(Cluster, cluster_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return item


@router.get("/admin/dashboard/statistics", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    active = Tree.deleted_at.is_(None)
    return DashboardStats(
        total_trees=db.scalar(select(func.count()).select_from(Tree).where(active)) or 0,
        pending_trees=db.scalar(select(func.count()).select_from(Tree).where(active, Tree.verification_status == "PENDING")) or 0,
        verified_trees=db.scalar(select(func.count()).select_from(Tree).where(active, Tree.verification_status == "VERIFIED")) or 0,
        rejected_trees=db.scalar(select(func.count()).select_from(Tree).where(active, Tree.verification_status == "REJECTED")) or 0,
        total_users=db.scalar(select(func.count()).select_from(User).where(User.disabled.is_(False))) or 0,
    )


@router.get("/public/statistics", response_model=PublicStats)
def public_stats(db: Session = Depends(get_db)):
    active = (Tree.deleted_at.is_(None),)
    verified = (*active, Tree.verification_status == "VERIFIED")
    return PublicStats(
        total_trees=db.scalar(select(func.count()).select_from(Tree).where(*active)) or 0,
        verified_trees=db.scalar(select(func.count()).select_from(Tree).where(*verified)) or 0,
        institution_count=db.scalar(select(func.count()).select_from(Institution)) or 0,
        average_accuracy=db.scalar(select(func.avg(Tree.accuracy)).where(*verified)),
    )


@router.get("/participants")
def participants(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = db.execute(
        select(
            User.email,
            User.full_name,
            User.institution,
            User.created_at,
            func.count(Tree.id).label("tree_count"),
            func.count(Tree.id).filter(Tree.verification_status == "PENDING").label("pending_count"),
            func.count(Tree.id).filter(Tree.verification_status == "VERIFIED").label("verified_count"),
        )
        .outerjoin(Tree, (Tree.user_id == User.email) & Tree.deleted_at.is_(None))
        .where(User.disabled.is_(False))
        .group_by(User.id)
        .order_by(func.count(Tree.id).desc())
    ).all()
    return [
        {
            "userId": email,
            "fullName": full_name,
            "displayName": full_name,
            "institution": institution,
            "registeredAt": created_at,
            "treeCount": tree_count,
            "pendingCount": pending_count,
            "verifiedCount": verified_count,
        }
        for email, full_name, institution, created_at, tree_count, pending_count, verified_count in rows
    ]
