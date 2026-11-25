# ResolveFlow AI

ResolveFlow AI is a university project for a bilingual (Arabic/English) voice customer-service system. Departmental agents cooperate to investigate an order complaint, reconcile evidence, propose an eligible remedy, execute authorized actions against simulated business systems, and escalate when automation is unsafe or insufficient.

> **Current state:** Checkpoint 2 development foundation. PostgreSQL, FastAPI, React, migrations, tests, and CI are implemented; complaint workflows, agents, and hosted integrations have not started. See [docs/STATUS.md](docs/STATUS.md) for verified results and the next checkpoint.

## Intended experience

- Customers call from a browser and speak English, Arabic, or Egyptian Arabic, including mixed-language turns.
- The system confirms critical fields such as order numbers, gathers evidence, and explains a proposed remedy.
- Deterministic policy code—not an LLM assertion—authorizes refunds, replacements, credits, and inventory changes.
- Staff can inspect the complete case history and take over a live interaction.
- Simulated order, payment, inventory, and delivery services make durable changes in a test database.

The complaint workflow is:

`Intake → Investigate → Reconcile → Propose → Execute → Resolved / Escalated`

The workflow is adaptive rather than strictly linear: missing evidence can trigger more investigation, and escalation can occur at any stage.

## Planned system

The provisional stack is Python/FastAPI, LangGraph, PostgreSQL, React, LiveKit, speech recognition, text-to-speech, and Docker Compose. Provider choices and integration details remain subject to feasibility checks; no hosted service or model is currently committed. Redis will be added only if a demonstrated need justifies it.

The seven logical roles are Intake, Case Coordinator, Order Investigator, Warehouse, Finance, Policy Checker, and Escalation. Roles may share an underlying language model, but each receives only its own tools and data access.

## Documentation

- [Project plan](docs/PROJECT_PLAN.md) — checkpoints, acceptance criteria, four-week target, and evaluation plan.
- [Architecture](docs/ARCHITECTURE.md) — boundaries, shared contracts, workflow, persistence, reliability, and voice design.
- [Draft policies](docs/POLICIES.md) — explicitly fictional rules for the demonstration store.
- [Project status](docs/STATUS.md) — completed work, verified environment, decisions, risks, and the exact next action.
- [Contributor/agent guidance](AGENTS.md) — repository-wide working rules and verification expectations.

## Development principles

1. Build the durable complaint engine through text before full voice integration.
2. Run a small voice feasibility experiment early, especially for Egyptian Arabic and mixed-language speech.
3. Keep authorization and invariants in deterministic application code and database constraints.
4. Use structured, versioned contracts between roles and services.
5. Make every externally visible action auditable, idempotent, and recoverable after restart.
6. Measure outcomes honestly against a fixed-workflow baseline using the same policies and seeded data.

## Local setup

### Prerequisites

- Git.
- Docker Desktop with Compose. The verified development environment uses Docker Desktop 4.100.1 and Compose v5.7.1.
- A code editor. Host Python and Node are optional because checks run inside containers.

### Start the application

From the repository root:

```powershell
docker compose up --build --wait
```

The command starts PostgreSQL, applies Alembic migrations, starts FastAPI, and starts the React development server. Open:

- Web status page: <http://localhost:5173>
- API documentation: <http://localhost:8000/docs>
- Liveness: <http://localhost:8000/health/live>
- Readiness (includes database): <http://localhost:8000/health/ready>

The checked-in local defaults work without a `.env` file. To override them, copy `.env.example` to `.env` and keep that file local. Never add real secrets to either file or commit them.

### Run checks

```powershell
docker compose exec api ruff check .
docker compose exec api ruff format --check .
docker compose exec api mypy src
docker compose exec api pytest
docker compose exec api alembic current

docker compose exec web npm run lint
docker compose exec web npm run typecheck
docker compose exec web npm test
docker compose exec web npm run build
```

### Stop or reset

Stop the services while preserving local database data:

```powershell
docker compose down
```

Development-only reset (permanently removes the local PostgreSQL and dependency volumes):

```powershell
docker compose down --volumes
```

Run the reset command only when you intentionally want a clean local database.

## Repository layout

```text
apps/api/                 FastAPI application, Alembic migrations, backend tests
apps/web/                 React/Vite application and frontend tests
.github/workflows/ci.yml  Pull-request quality checks
compose.yaml              Local PostgreSQL, API, and web services
docs/                     Plan, architecture, draft policies, and durable status
```

## Project status

The working target is four weeks from 25 November to 22 December 2026, pending confirmation of the university deadline. Checkpoints 1 and 2 are complete on setup branches. Progress, verification evidence, and blockers are maintained in [docs/STATUS.md](docs/STATUS.md).
