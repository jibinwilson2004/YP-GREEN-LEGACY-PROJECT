import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Tree, TreePhoto, User
from app.schemas.common import PhotoConfirmRequest, PhotoRead, PhotoUploadRequest
from app.services.storage import (
    delete_object,
    get_object_url,
    presigned_upload_url,
    validate_image,
    verify_object,
)
from app.utils.security import get_current_user, get_optional_user

router = APIRouter(tags=["tree photos"])


def _tree_for_user(tree_id: str, db: Session, user: User) -> Tree:
    tree = db.get(Tree, tree_id)
    if tree is None or tree.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if user.role != "admin" and tree.user_id != user.email:
        raise HTTPException(status_code=403, detail="You may only manage photographs for your own tree")
    return tree


def _photo_output(photo: TreePhoto) -> PhotoRead:
    return PhotoRead.model_validate(
        {
            "id": photo.id,
            "tree_id": photo.tree_id,
            "object_key": photo.object_key,
            "photo_type": photo.photo_type,
            "mime_type": photo.mime_type,
            "size_bytes": photo.size_bytes,
            "url": get_object_url(photo.object_key),
            "created_at": photo.created_at,
        }
    )


@router.post("/trees/{tree_id}/photos/upload-url")
def create_upload_url(
    tree_id: str,
    payload: PhotoUploadRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tree = _tree_for_user(tree_id, db, user)
    validate_image(payload.mime_type, payload.size_bytes)
    safe_type = re.sub(r"[^a-zA-Z0-9_-]", "-", payload.photo_type)[:50] or "primary"
    extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[payload.mime_type]
    key = f"trees/{tree.id}/{safe_type}/{uuid.uuid4().hex}.{extension}"
    return {
        "upload_url": presigned_upload_url(key, payload.mime_type),
        "object_key": key,
        "expires_in": 600,
        "headers": {"Content-Type": payload.mime_type},
    }


@router.post("/trees/{tree_id}/photos/confirm", response_model=PhotoRead, status_code=201)
def confirm_upload(
    tree_id: str,
    payload: PhotoConfirmRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _tree_for_user(tree_id, db, user)
    prefix = f"trees/{tree_id}/"
    if not payload.object_key.startswith(prefix) or ".." in payload.object_key:
        raise HTTPException(status_code=400, detail="Object key does not belong to this tree")
    mime_type, size_bytes = verify_object(payload.object_key)
    validate_image(mime_type, size_bytes)
    if db.scalar(select(TreePhoto).where(TreePhoto.object_key == payload.object_key)):
        raise HTTPException(status_code=409, detail="Photograph is already registered")
    photo = TreePhoto(
        tree_id=tree_id,
        object_key=payload.object_key,
        photo_type=payload.object_key.split("/")[-2],
        mime_type=mime_type,
        size_bytes=size_bytes,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return _photo_output(photo)


@router.get("/trees/{tree_id}/photos", response_model=list[PhotoRead])
def list_photos(tree_id: str, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    tree = db.get(Tree, tree_id)
    if tree is None or tree.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if tree.verification_status != "VERIFIED" and (
        user is None or (user.role != "admin" and tree.user_id != user.email)
    ):
        raise HTTPException(status_code=404, detail="Tree not found")
    rows = db.scalars(select(TreePhoto).where(TreePhoto.tree_id == tree_id).order_by(TreePhoto.created_at)).all()
    return [_photo_output(photo) for photo in rows]


@router.delete("/trees/{tree_id}/photos/{photo_id}", status_code=204)
def remove_photo(
    tree_id: str,
    photo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _tree_for_user(tree_id, db, user)
    photo = db.scalar(select(TreePhoto).where(TreePhoto.id == photo_id, TreePhoto.tree_id == tree_id))
    if photo is None:
        raise HTTPException(status_code=404, detail="Photograph not found")
    delete_object(photo.object_key)
    db.delete(photo)
    db.commit()
