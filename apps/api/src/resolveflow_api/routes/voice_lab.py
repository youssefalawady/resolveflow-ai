from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from resolveflow_api.config import Settings, get_settings
from resolveflow_api.services.provider_tokens import (
    ProviderTokenError,
    issue_azure_speech_token,
    issue_elevenlabs_scribe_token,
)

router = APIRouter(prefix="/voice-lab", tags=["voice-lab"])


class ProviderAvailability(BaseModel):
    provider: Literal["azure", "elevenlabs"]
    configured: bool
    secret_exposed: Literal[False] = False


class ProviderStatusResponse(BaseModel):
    providers: list[ProviderAvailability]
    audio_retention: Literal["memory-only"] = "memory-only"


class AzureTokenResponse(BaseModel):
    token: str
    region: str
    expires_in_seconds: int = 540


class ElevenLabsTokenResponse(BaseModel):
    token: str
    expires_in_seconds: int


def _secret_value(settings_value: object) -> str:
    get_secret_value = getattr(settings_value, "get_secret_value", None)
    return str(get_secret_value()).strip() if callable(get_secret_value) else ""


@router.get("/providers", response_model=ProviderStatusResponse)
async def provider_status(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ProviderStatusResponse:
    azure_key = _secret_value(settings.azure_speech_key)
    elevenlabs_key = _secret_value(settings.elevenlabs_api_key)
    return ProviderStatusResponse(
        providers=[
            ProviderAvailability(
                provider="azure",
                configured=bool(azure_key and settings.azure_speech_region),
            ),
            ProviderAvailability(provider="elevenlabs", configured=bool(elevenlabs_key)),
        ]
    )


@router.post("/tokens/azure", response_model=AzureTokenResponse)
async def azure_token(
    settings: Annotated[Settings, Depends(get_settings)],
) -> AzureTokenResponse:
    key = _secret_value(settings.azure_speech_key)
    region = (settings.azure_speech_region or "").strip()
    if not key or not region:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure Speech is not configured for the local voice lab",
        )
    try:
        token = await issue_azure_speech_token(key=key, region=region)
    except ProviderTokenError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error
    return AzureTokenResponse(token=token, region=region)


@router.post("/tokens/elevenlabs", response_model=ElevenLabsTokenResponse)
async def elevenlabs_token(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ElevenLabsTokenResponse:
    key = _secret_value(settings.elevenlabs_api_key)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ElevenLabs is not configured for the local voice lab",
        )
    try:
        provider_token = await issue_elevenlabs_scribe_token(key=key)
    except ProviderTokenError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error
    return ElevenLabsTokenResponse(
        token=provider_token.token,
        expires_in_seconds=provider_token.expires_in_seconds,
    )
