FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY pyproject.toml alembic.ini ./
COPY alembic ./alembic
COPY src ./src
COPY tests ./tests

RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir --editable ".[dev]"

EXPOSE 8000

CMD ["uvicorn", "resolveflow_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
