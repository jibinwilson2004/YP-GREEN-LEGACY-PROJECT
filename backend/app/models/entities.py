from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, CheckConstraint, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(500))
    institution: Mapped[str | None] = mapped_column(String(250))
    ieee_id: Mapped[str | None] = mapped_column(String(100))
    membership_grade: Mapped[str | None] = mapped_column(String(100))
    region: Mapped[str | None] = mapped_column(String(100))
    section: Mapped[str | None] = mapped_column(String(150))
    country: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    disabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(250), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Cluster(Base):
    __tablename__ = "clusters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    institution_id: Mapped[int | None] = mapped_column(ForeignKey("institutions.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Tree(Base):
    __tablename__ = "trees"
    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_trees_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="ck_trees_longitude"),
        CheckConstraint("accuracy >= 0", name="ck_trees_accuracy"),
        Index("ix_trees_location_gist", "location", postgresql_using="gist"),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    species: Mapped[str] = mapped_column(String(250), nullable=False, index=True)
    common_name: Mapped[str | None] = mapped_column(String(250))
    botanical_name: Mapped[str | None] = mapped_column(String(250))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False), nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    altitude: Mapped[float | None] = mapped_column(Float)
    gps_source: Mapped[str] = mapped_column(String(50), default="SMARTPHONE_GPS", nullable=False)
    location_confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    location_status: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False)
    reading_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stability_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gps_stability: Mapped[str | None] = mapped_column(String(30))
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    date_of_planting: Mapped[str | None] = mapped_column(String(50))
    student: Mapped[str | None] = mapped_column(String(200))
    college: Mapped[str | None] = mapped_column(String(250))
    cluster: Mapped[str | None] = mapped_column(String(150))
    institution_id: Mapped[int | None] = mapped_column(ForeignKey("institutions.id", ondelete="SET NULL"))
    cluster_id: Mapped[int | None] = mapped_column(ForeignKey("clusters.id", ondelete="SET NULL"))
    institution: Mapped[str | None] = mapped_column(String(250))
    country: Mapped[str | None] = mapped_column(String(100))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.email", ondelete="SET NULL"), index=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False, index=True)
    verified_by: Mapped[str | None] = mapped_column(String(320))
    verification_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    identification_confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    admin_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    photos: Mapped[list["TreePhoto"]] = relationship(back_populates="tree", cascade="all, delete-orphan")
    gps_readings: Mapped[list["GpsReading"]] = relationship(back_populates="tree", cascade="all, delete-orphan")


class TreePhoto(Base):
    __tablename__ = "tree_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tree_id: Mapped[str] = mapped_column(ForeignKey("trees.id", ondelete="CASCADE"), index=True)
    object_key: Mapped[str] = mapped_column(String(1024), unique=True, nullable=False)
    photo_type: Mapped[str] = mapped_column(String(50), default="primary", nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    tree: Mapped[Tree] = relationship(back_populates="photos")


class GpsReading(Base):
    __tablename__ = "gps_readings"
    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_gps_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="ck_gps_longitude"),
        CheckConstraint("accuracy >= 0", name="ck_gps_accuracy"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tree_id: Mapped[str] = mapped_column(ForeignKey("trees.id", ondelete="CASCADE"), index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    altitude: Mapped[float | None] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    tree: Mapped[Tree] = relationship(back_populates="gps_readings")


class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tree_id: Mapped[str] = mapped_column(ForeignKey("trees.id", ondelete="CASCADE"), index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100))
    details: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class PartnerRequest(Base):
    __tablename__ = "partner_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_name: Mapped[str] = mapped_column(String(250), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50))
    organization_type: Mapped[str | None] = mapped_column(String(100))
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
