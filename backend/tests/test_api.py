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
