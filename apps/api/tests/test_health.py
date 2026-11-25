from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from resolveflow_api.main import app
from resolveflow_api.routes import health


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


def test_liveness_does_not_depend_on_database(client: TestClient) -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "api", "checks": None}


def test_readiness_reports_database_up(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    async def database_is_ready() -> bool:
        return True

    monkeypatch.setattr(health, "database_is_ready", database_is_ready)

    response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "api",
        "checks": {"database": "up"},
    }


def test_readiness_reports_database_down(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def database_is_ready() -> bool:
        return False

    monkeypatch.setattr(health, "database_is_ready", database_is_ready)

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "not_ready",
        "service": "api",
        "checks": {"database": "down"},
    }


def test_readiness_handles_database_error(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def database_is_ready() -> bool:
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(health, "database_is_ready", database_is_ready)

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["checks"] == {"database": "down"}
