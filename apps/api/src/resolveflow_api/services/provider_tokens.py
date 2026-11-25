from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import cast
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class ProviderTokenError(RuntimeError):
    """Raised when a provider refuses or fails a short-lived token request."""


@dataclass(frozen=True)
class ElevenLabsToken:
    token: str
    expires_in_seconds: int = 900


def _post(url: str, headers: dict[str, str]) -> bytes:
    request = Request(url=url, data=b"", headers=headers, method="POST")
    try:
        with urlopen(request, timeout=10) as response:  # noqa: S310 - fixed HTTPS provider URLs
            return cast(bytes, response.read())
    except HTTPError as error:
        raise ProviderTokenError(f"Provider rejected the token request ({error.code})") from error
    except URLError as error:
        raise ProviderTokenError("Provider token service is unreachable") from error


async def issue_azure_speech_token(*, key: str, region: str) -> str:
    url = f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    payload = await asyncio.to_thread(
        _post,
        url,
        {"Ocp-Apim-Subscription-Key": key},
    )
    token = payload.decode("utf-8").strip()
    if not token:
        raise ProviderTokenError("Azure returned an empty authorization token")
    return token


async def issue_elevenlabs_scribe_token(*, key: str) -> ElevenLabsToken:
    payload = await asyncio.to_thread(
        _post,
        "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe"
        "?max_session_duration_seconds=120",
        {"xi-api-key": key, "Accept": "application/json"},
    )
    try:
        data = json.loads(payload)
        token = str(data["token"]).strip()
    except (json.JSONDecodeError, KeyError, TypeError) as error:
        raise ProviderTokenError("ElevenLabs returned an invalid token response") from error
    if not token:
        raise ProviderTokenError("ElevenLabs returned an empty single-use token")
    return ElevenLabsToken(token=token)
