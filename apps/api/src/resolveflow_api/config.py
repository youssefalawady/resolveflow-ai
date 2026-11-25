from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ResolveFlow AI API"
    app_env: str = "development"
    database_url: str = (
        "postgresql+asyncpg://resolveflow:resolveflow-local-only@localhost:5432/resolveflow"
    )
    azure_speech_key: SecretStr | None = None
    azure_speech_region: str | None = None
    elevenlabs_api_key: SecretStr | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
