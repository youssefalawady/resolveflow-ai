from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from resolveflow_api.config import Settings, get_settings
from resolveflow_api.main import app
from resolveflow_api.routes import voice_lab
from resolveflow_api.services.provider_tokens import ElevenLabsToken


@pytest.fixture
def client() -> Iterator[TestClient]:
    app.dependency_overrides.clear()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def override_settings(settings: Settings) -> None:
    app.dependency_overrides[get_settings] = lambda: settings


def test_provider_status_never_exposes_secrets(client: TestClient) -> None:
    override_settings(
        Settings(
            azure_speech_key=SecretStr("azure-secret"),
            azure_speech_region="eastus",
            elevenlabs_api_key=SecretStr("eleven-secret"),
        )
    )

    response = client.get("/voice-lab/providers")

    assert response.status_code == 200
    assert response.json() == {
        "providers": [
            {"provider": "azure", "configured": True, "secret_exposed": False},
            {"provider": "elevenlabs", "configured": True, "secret_exposed": False},
        ],
        "audio_retention": "memory-only",
    }
    assert "azure-secret" not in response.text
    assert "eleven-secret" not in response.text


@pytest.mark.parametrize("path", ["/voice-lab/tokens/azure", "/voice-lab/tokens/elevenlabs"])
def test_token_endpoint_requires_local_configuration(client: TestClient, path: str) -> None:
    override_settings(Settings())

    response = client.post(path)

    assert response.status_code == 503


def test_azure_token_endpoint_returns_only_short_lived_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    override_settings(
        Settings(azure_speech_key=SecretStr("azure-secret"), azure_speech_region="eastus")
    )

    async def issue_token(*, key: str, region: str) -> str:
        assert key == "azure-secret"
        assert region == "eastus"
        return "short-lived-azure-token"

    monkeypatch.setattr(voice_lab, "issue_azure_speech_token", issue_token)

    response = client.post("/voice-lab/tokens/azure")

    assert response.status_code == 200
    assert response.json() == {
        "token": "short-lived-azure-token",
        "region": "eastus",
        "expires_in_seconds": 540,
    }


def test_elevenlabs_token_endpoint_returns_single_use_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    override_settings(Settings(elevenlabs_api_key=SecretStr("eleven-secret")))

    async def issue_token(*, key: str) -> ElevenLabsToken:
        assert key == "eleven-secret"
        return ElevenLabsToken(token="single-use-token")

    monkeypatch.setattr(voice_lab, "issue_elevenlabs_scribe_token", issue_token)

    response = client.post("/voice-lab/tokens/elevenlabs")

    assert response.status_code == 200
    assert response.json() == {"token": "single-use-token", "expires_in_seconds": 900}
