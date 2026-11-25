from __future__ import annotations

from typing import cast

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from resolveflow_api.config import get_settings

engine: AsyncEngine = create_async_engine(
    get_settings().database_url,
    pool_pre_ping=True,
)


async def database_is_ready() -> bool:
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        return cast(int, result.scalar_one()) == 1
