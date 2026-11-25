from fastapi import FastAPI

from resolveflow_api.config import get_settings
from resolveflow_api.routes.health import router as health_router
from resolveflow_api.routes.voice_lab import router as voice_lab_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Foundation API for the ResolveFlow AI complaint-resolution system.",
)
app.include_router(health_router)
app.include_router(voice_lab_router)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "docs": "/docs",
        "health": "/health/ready",
    }
