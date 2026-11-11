from urllib.parse import quote

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException

from app.core.config import get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _client():
    settings = get_settings()
    required = (
        settings.r2_access_key_id,
        settings.r2_secret_access_key,
        settings.r2_bucket_name,
        settings.r2_endpoint_url,
    )
    if not all(required):
        raise HTTPException(status_code=503, detail="Cloudflare R2 is not configured")
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


def validate_image(mime_type: str, size_bytes: int) -> None:
    if mime_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are accepted")
    if size_bytes <= 0 or size_bytes > get_settings().max_photo_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the configured size limit")


def presigned_upload_url(object_key: str, mime_type: str) -> str:
    settings = get_settings()
    try:
        return _client().generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.r2_bucket_name, "Key": object_key, "ContentType": mime_type},
            ExpiresIn=600,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail="Could not create an R2 upload URL") from exc


def verify_object(object_key: str) -> tuple[str, int]:
    settings = get_settings()
    try:
        client = _client()
        result = client.head_object(Bucket=settings.r2_bucket_name, Key=object_key)
        body = client.get_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Range="bytes=0-15",
        )["Body"]
        signature = body.read(16)
        body.close()
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=400, detail="Uploaded object was not found in R2") from exc
    mime_type = str(result.get("ContentType", ""))
    signatures = {
        "image/jpeg": signature.startswith(b"\xff\xd8\xff"),
        "image/png": signature.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": signature.startswith(b"RIFF") and signature[8:12] == b"WEBP",
    }
    if not signatures.get(mime_type, False):
        raise HTTPException(status_code=415, detail="Uploaded file content is not a valid image of the declared type")
    return mime_type, int(result.get("ContentLength", 0))


def get_object_url(object_key: str) -> str:
    settings = get_settings()
    if settings.r2_public_base_url:
        return f"{settings.r2_public_base_url.rstrip('/')}/{quote(object_key, safe='/')}"
    try:
        return _client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.r2_bucket_name, "Key": object_key},
            ExpiresIn=3600,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail="Could not create an R2 download URL") from exc


def upload_object(object_key: str, data: bytes, mime_type: str) -> None:
    """Upload bytes directly to R2 (server-side, no CORS)."""
    settings = get_settings()
    try:
        _client().put_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Body=data,
            ContentType=mime_type,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail="Could not upload object to R2") from exc


def delete_object(object_key: str, ignore_missing: bool = False) -> None:
    settings = get_settings()
    try:
        _client().delete_object(Bucket=settings.r2_bucket_name, Key=object_key)
    except HTTPException:
        if not ignore_missing:
            raise
    except (BotoCoreError, ClientError) as exc:
        if not ignore_missing:
            raise HTTPException(status_code=502, detail="Could not delete the R2 object") from exc


def delete_objects_by_prefix(prefix: str) -> int:
    """Delete all objects matching a prefix (e.g. 'trees/{tree_id}/') from R2/S3.
    Returns the count of deleted objects.
    """
    settings = get_settings()
    try:
        client = _client()
    except HTTPException:
        return 0

    deleted_count = 0
    try:
        paginator = client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=settings.r2_bucket_name, Prefix=prefix):
            objects = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
            if objects:
                client.delete_objects(
                    Bucket=settings.r2_bucket_name,
                    Delete={"Objects": objects, "Quiet": True},
                )
                deleted_count += len(objects)
        return deleted_count
    except (BotoCoreError, ClientError):
        return deleted_count
