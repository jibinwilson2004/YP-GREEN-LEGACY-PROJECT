import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.routers.trees import delete_tree


class FakeDatabase:
    def __init__(self, tree):
        self.tree = tree
        self.added = []
        self.committed = False

    def scalar(self, _query):
        return self.tree

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.committed = True


def test_liveness_check_does_not_require_external_services():
    response = TestClient(app).get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_versioned_openapi_exposes_core_application_routes():
    response = TestClient(app).get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/auth/register" in paths
    assert "/api/v1/trees/{tree_id}/photos/upload-url" in paths
    assert "/api/v1/map/trees" in paths
    assert "/api/v1/verification/pending" in paths


def test_logout_rejects_missing_csrf_token():
    response = TestClient(app).post("/api/v1/auth/logout")

    assert response.status_code == 403


def test_owner_can_soft_delete_own_unverified_tree():
    tree = SimpleNamespace(
        id="YP-TEST",
        user_id="owner@example.com",
        verification_status="PENDING",
        deleted_at=None,
    )
    db = FakeDatabase(tree)
    user = SimpleNamespace(id=1, email="OWNER@example.com", role="user")

    delete_tree(tree.id, db, user)

    assert tree.deleted_at is not None
    assert db.committed
    assert any(getattr(item, "action", None) == "tree.deleted" for item in db.added)


def test_owner_cannot_delete_verified_tree():
    tree = SimpleNamespace(
        id="YP-TEST",
        user_id="owner@example.com",
        verification_status="VERIFIED",
        deleted_at=None,
    )

    with pytest.raises(HTTPException) as error:
        delete_tree(tree.id, FakeDatabase(tree), SimpleNamespace(id=1, email="owner@example.com", role="user"))

    assert error.value.status_code == 409
    assert tree.deleted_at is None


def test_user_cannot_delete_another_owners_unverified_tree():
    tree = SimpleNamespace(
        id="YP-TEST",
        user_id="owner@example.com",
        verification_status="PENDING",
        deleted_at=None,
    )

    with pytest.raises(HTTPException) as error:
        delete_tree(tree.id, FakeDatabase(tree), SimpleNamespace(id=2, email="other@example.com", role="user"))

    assert error.value.status_code == 403
    assert tree.deleted_at is None


def test_admin_can_delete_verified_or_duplicate_tree():
    tree = SimpleNamespace(
        id="YP-TEST",
        user_id="owner@example.com",
        verification_status="VERIFIED",
        deleted_at=None,
    )
    db = FakeDatabase(tree)
    admin_user = SimpleNamespace(id=99, email="admin@example.com", role="admin")

    delete_tree(tree.id, db, admin_user)

    assert tree.deleted_at is not None
    assert db.committed
    assert any(getattr(item, "action", None) == "tree.deleted" for item in db.added)


def test_institution_hidden_from_public_in_tree_output():
    from datetime import datetime, timezone
    from app.models.entities import Tree
    from app.routers.trees import _tree_output

    tree = Tree(
        id="YP-TEST-PUBLIC",
        species="Azadirachta indica",
        latitude=10.0,
        longitude=76.0,
        accuracy=5.0,
        gps_source="SMARTPHONE_GPS",
        location_confidence=90,
        location_status="HIGH",
        reading_count=5,
        stability_score=85,
        verification_status="VERIFIED",
        identification_confidence=92,
        institution="APJAKTU NSSCELL",
        college="GEC Barton Hill",
        institution_id=1,
        captured_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        location="POINT(76.0 10.0)",
    )
    db = FakeDatabase(tree)

    # Public user / non-admin
    public_output = _tree_output(tree, db, is_admin=False)
    assert public_output.institution is None
    assert public_output.college is None
    assert public_output.institution_id is None

    # Admin user
    admin_output = _tree_output(tree, db, is_admin=True)
    assert admin_output.institution == "APJAKTU NSSCELL"
    assert admin_output.college == "GEC Barton Hill"
    assert admin_output.institution_id == 1

