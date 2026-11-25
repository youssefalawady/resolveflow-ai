# ResolveFlow AI

ResolveFlow AI is a university project for a bilingual (Arabic/English) voice customer-service system. Departmental agents cooperate to investigate an order complaint, reconcile evidence, propose an eligible remedy, execute authorized actions against simulated business systems, and escalate when automation is unsafe or insufficient.

> **Current state:** documentation foundation only. No application code or external service integration exists yet. See [docs/STATUS.md](docs/STATUS.md) for the verified repository state and next checkpoint.

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

Local application setup intentionally starts in the next checkpoint. At this checkpoint there are no dependencies to install and no services to run. The planned setup will require Docker Desktop (with Compose), Git, and a code editor; host Python and Node will be optional when development runs inside containers.

Do not add real secrets to the repository. Future configuration will use a committed `.env.example` plus an ignored local `.env`.

## Project status

The working target is four weeks from 25 November to 22 December 2026, pending confirmation of the university deadline. The scope is staged so a demonstrable text-based system exists before higher-risk voice and dashboard work. Progress and blockers are maintained in [docs/STATUS.md](docs/STATUS.md).
