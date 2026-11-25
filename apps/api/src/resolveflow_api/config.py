from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ResolveFlow AI API"
    app_env: str = "development"
    database_url: str = (
        "postgresql+asyncpg://resolveflow:resolveflow-local-only@localhost:5432/resolveflow"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
