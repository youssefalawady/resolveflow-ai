from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Response, status
from pydantic import BaseModel

from resolveflow_api.db import database_is_ready

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok", "not_ready"]
    service: str = "api"
    checks: dict[str, Literal["up", "down"]] | None = None


@router.get("/live", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=HealthResponse)
async def readiness(response: Response) -> HealthResponse:
    try:
        ready = await database_is_ready()
    except Exception:
        logger.warning("Database readiness check failed", exc_info=True)
        ready = False

    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="not_ready", checks={"database": "down"})

    return HealthResponse(status="ok", checks={"database": "up"})
