import re
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.title() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class UserCreate(ApiModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    institution: str | None = None
    ieee_id: str | None = None
    membership_grade: str | None = None
    region: str | None = None
    section: str | None = None
    country: str | None = None


class LoginRequest(ApiModel):
    email: EmailStr
    password: str


class UserRead(ApiModel):
    email: EmailStr
    full_name: str
    role: str
    institution: str | None = None
    ieee_id: str | None = None
    membership_grade: str | None = None
    region: str | None = None
    section: str | None = None
    country: str | None = None


class TokenResponse(ApiModel):
    success: bool = True
    user: UserRead
    token: str
    expires_in: int
    csrf_token: str


class TreeCreate(ApiModel):
    id: str | None = Field(default=None, max_length=120)
    species: str = Field(min_length=1, max_length=250)
    common_name: str | None = None
    botanical_name: str | None = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy: float = Field(ge=0, le=100000)
    altitude: float | None = None
    gps_source: str = "SMARTPHONE_GPS"
    location_confidence: int = Field(default=0, ge=0, le=100)
    location_status: str = "MEDIUM"
    reading_count: int = Field(default=0, ge=0)
    stability_score: int = Field(default=0, ge=0, le=100)
    gps_stability: str | None = None
    captured_at: datetime | None = None
    date_of_planting: str | None = None
    student: str | None = None
    college: str | None = None
    cluster: str | None = None
    institution: str | None = None
    country: str | None = None
    identification_confidence: int = Field(default=0, ge=0, le=100)

    @field_validator("id")
    @classmethod
    def valid_tree_code(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r"[A-Za-z0-9_.-]{1,120}", value):
            raise ValueError("Tree code contains invalid characters")
        return value


class TreeUpdate(ApiModel):
    species: str | None = Field(default=None, min_length=1, max_length=250)
    common_name: str | None = None
    botanical_name: str | None = None
    date_of_planting: str | None = None
    student: str | None = None
    college: str | None = None
    cluster: str | None = None
    institution: str | None = None
    country: str | None = None


class TreeRead(ApiModel):
    id: str
    species: str
    common_name: str | None
    botanical_name: str | None
    image_url: str | None = None
    images: list[str] = Field(default_factory=list)
    latitude: float
    longitude: float
    accuracy: float
    altitude: float | None
    gps_source: str
    location_confidence: int
    location_status: str
    reading_count: int
    stability_score: int
    gps_stability: str | None
    captured_at: datetime
    date_of_planting: str | None
    updated_at: datetime
    student: str | None
    college: str | None
    cluster: str | None
    institution: str | None
    country: str | None = None
    cluster_id: int | None = None
    institution_id: int | None = None
    user_id: str | None
    verification_status: str
    verified_by: str | None
    verification_date: datetime | None
    identification_confidence: int
    admin_note: str | None


class TreeList(ApiModel):
    trees: list[TreeRead]
    total: int
    page: int
    total_pages: int


class GpsReadingCreate(ApiModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy: float = Field(ge=0, le=100000)
    altitude: float | None = None
    timestamp: datetime | None = None


class GpsReadingRead(ApiModel):
    id: int
    tree_id: str
    latitude: float
    longitude: float
    accuracy: float
    altitude: float | None
    timestamp: datetime


class ReviewRequest(ApiModel):
    status: str
    admin_note: str | None = None

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in {"VERIFIED", "REJECTED", "FLAGGED", "PENDING"}:
            raise ValueError("Invalid verification status")
        return value


class PhotoUploadRequest(ApiModel):
    file_name: str = Field(min_length=1, max_length=255)
    mime_type: str
    size_bytes: int = Field(gt=0)
    photo_type: str = "primary"


class PhotoConfirmRequest(ApiModel):
    object_key: str


class PhotoRead(ApiModel):
    id: int
    tree_id: str
    object_key: str
    photo_type: str
    mime_type: str
    size_bytes: int
    url: str
    created_at: datetime


class ResourceCreate(ApiModel):
    name: str = Field(min_length=1, max_length=250)
    description: str | None = None
    institution_id: int | None = None


class ResourceRead(ApiModel):
    id: int
    name: str
    description: str | None = None
    institution_id: int | None = None


class DashboardStats(ApiModel):
    total_trees: int
    pending_trees: int
    verified_trees: int
    rejected_trees: int
    total_users: int


class PublicStats(ApiModel):
    total_trees: int
    verified_trees: int
    institution_count: int
    average_accuracy: float | None = None


class PartnerRequestCreate(ApiModel):
    organization_name: str = Field(min_length=1, max_length=250)
    contact_name: str | None = Field(default=None, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    organization_type: str | None = Field(default=None, max_length=100)
    message: str | None = Field(default=None, max_length=5000)


def model_dump_aliases(model: BaseModel, **kwargs: Any) -> dict[str, Any]:
    return model.model_dump(by_alias=True, **kwargs)
