import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app


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
