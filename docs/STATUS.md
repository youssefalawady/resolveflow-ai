# Project Status

Last updated: **25 November 2026**

## Current checkpoint

**Checkpoint 3 — Early voice feasibility experiment**

Status: in progress on `setup/voice-feasibility`. The isolated browser experiment, secure local token exchange, fixed synthetic test set, measurement functions, two-way browser reply controls, correction record, and two-failure structured handoff are implemented and tested. Real Azure/ElevenLabs credentials, human-spoken measurements, and the resulting provider decision remain intentionally pending, so this checkpoint is not complete.

## Verified starting state

- Repository: `https://github.com/youssefalawady/resolveflow-ai`
- Default branch: `main`
- Remote HEAD at inspection: `3a2627818fee27405a8cb732fb5a43b10a04157c` (`Initial commit`)
- Tracked content at inspection: `.gitignore` and a 91-byte `README.md`; no application code, tests, CI, docs directory, tags, or additional branches.
- Existing repository instructions: none before this checkpoint.
- Workspace contained no clone initially; the public repository was cloned without modifying remote history.
- GitHub CLI 2.95.0 is installed. Its initial authentication status check reported an invalid configured token, but the repository branch push and pull-request creation subsequently succeeded with the available credential path. Recheck authentication if a later GitHub operation fails.

## Verified local runtime

| Tool | Observed version/state |
|---|---|
| Git | 2.54.0.windows.1 |
| GitHub CLI | 2.95.0 |
| Python (`python`) | 3.12.10 |
| Python launcher (`py`) | installed but reports no registered Python |
| Node.js | v24.13.0 |
| npm | 11.6.2 |
| Docker Desktop | 4.100.1, installed and running |
| Docker Engine / Compose | 29.9.3 / v5.7.1 |

These host observations describe this machine on the date above. The verified containers currently run Python 3.12.16, Node 24.22.3 (LTS), npm 11.19.1, and PostgreSQL 17.12. Project dependencies are pinned in `pyproject.toml` and `package-lock.json`; base image patch versions remain supplied by the selected supported image lines.

## Checkpoint 1 deliverables

- `README.md`: product goal, intended experience, provisional stack, documentation map, and development principles.
- `AGENTS.md`: repository-wide contribution, safety, architecture, verification, and status-maintenance rules.
- `docs/PROJECT_PLAN.md`: ten checkpoints with acceptance criteria, evaluation design, scope fallbacks, and provisional four-week schedule (25 November–22 December 2026).
- `docs/ARCHITECTURE.md`: proposed components, boundaries, workflow states, conceptual contracts, persistence, reliability, voice/handoff, security, and open decisions.
- `docs/POLICIES.md`: prominently labeled draft/fictional policies and unresolved approval questions.
- `docs/STATUS.md`: this durable handoff record.

## Checkpoint 2 deliverables

- `compose.yaml`: health-gated PostgreSQL, API, and web services with persistent development volumes.
- `apps/api`: Python 3.12/FastAPI service, typed settings, async PostgreSQL readiness, Alembic, initial `service_metadata` migration, and four health tests.
- `apps/web`: Node 24/React/Vite status page, API proxy, responsive styling, and two component tests.
- `.env.example`: development placeholders only; `.env` remains ignored.
- `.github/workflows/ci.yml`: backend lint/format/type/migration/tests and frontend lint/type/tests/build on pull requests and `main` pushes.
- `README.md`: exact start, check, stop, reset, URL, and repository-layout instructions.

## Checkpoint 2 verification

- `docker compose config --quiet`: passed.
- Clean image builds: passed for API and web.
- Fresh PostgreSQL volume initialized and Alembic upgraded to `20261125_0001 (head)`.
- All three services reported healthy; live API and web HTTP requests returned 200.
- Backend: Ruff lint and format passed; strict mypy passed for seven source files; four pytest tests passed.
- Frontend: ESLint and TypeScript checks passed; two Vitest tests passed; Vite production build passed.
- npm audit reported zero known vulnerabilities for the locked frontend tree at verification time.
- The GitHub Actions workflow mirrors these checks and includes pull-request plus `main`/`setup/**` triggers. GitHub did not create a run while the workflow exists only on this unmerged stacked branch, so its first remote run must be verified after the reviewed branch sequence is merged/retargeted.

## Checkpoint 3 work so far

- `apps/web/src/voice-lab`: consent-gated in-memory capture, 16 kHz PCM conversion, fixed Arabic/English/mixed test cases, same-clip provider replay, latency/WER/critical-field metrics, correction capture, browser reply/interruption controls, JSON export, and handoff event.
- `apps/api/.../voice_lab.py`: provider configuration status and short-lived token endpoints; long-lived keys are never returned to the browser.
- `docs/VOICE_FEASIBILITY.md`: official source review, provider limitations, fair protocol, test set, empty truthful results table, and decision gate.
- LiveKit is deferred to full voice integration so transport behavior does not confound this recognition comparison.
- No hosted key, personal recording, or invented measurement is present in the repository.

## Checkpoint 3 verification so far

- Backend Ruff lint/format: passed.
- Backend strict mypy: passed for ten source files.
- Backend tests: nine passed, including route registration, secret non-disclosure, missing-configuration behavior, short-token responses, health, and readiness behavior.
- Frontend ESLint and TypeScript: passed.
- Frontend tests: seven passed across three files, including normalization/metrics, consent/configuration UI, handoff generation, and foundation behavior.
- Frontend production build: passed. The Azure SDK is dynamically loaded only for its provider run.
- Real microphone/provider behavior: pending human trial; automated checks are not represented as hosted-provider evidence.

## Decisions recorded

- Build and test the durable complaint engine through text before full voice integration.
- Run a small, measured voice feasibility experiment early rather than committing to unverified provider behavior.
- Use PostgreSQL as business and audit source of truth; do not add Redis without a concrete measured need.
- Keep LLM recommendations separate from deterministic policy/action authorization.
- Treat agent messages as schema-validated findings, not authority.
- Require idempotency at workflow, service, and database levels.
- Model compensation as new recorded actions and preserve irreversible outcomes.
- Make real staff takeover part of the core demonstration; Egyptian telephone-network calling remains optional/out of scope.

## Open decisions and risks

- University submission date is not confirmed; the target currently ends 22 December 2026.
- Draft policy windows, monetary limits, return rules, and evidence requirements need team approval.
- Speech-to-text performance for Egyptian Arabic, code-switching, numbers, interruption, and latency is unmeasured.
- LiveKit, LangGraph, ElevenLabs, Azure speech, and LLM provider integrations are unverified in this repository; current APIs, quotas, prices, and compatibility must be checked before implementation.
- Authentication, customer identity verification, audio/transcript retention, and staff approval roles need decisions.
- Remote CI has not run yet because the workflow is new on an unmerged stacked branch; do not report remote CI as passed until GitHub produces a successful run after review/merge.
- Four weeks is aggressive for full voice, takeover, reliability, and a 40-case evaluation; internal feature gates and scope protection are essential.

## Checkpoint history

| Checkpoint | Result | Evidence |
|---|---|---|
| 1. Documentation/contracts | Complete | Six documentation files committed and pushed on the setup branch; link/whitespace/topic checks passed; pull request #1 opened and left unmerged |
| 2. Development environment | Complete locally / PR open | Three healthy containers; migration at head; six automated tests plus lint/type/build and HTTP checks passed; pull request #2 opened and left unmerged; first remote CI run pending |
| 3. Voice feasibility | In progress | Lab and automated checks complete locally; real same-clip trials and provider decision pending |
| 4–10 | Not started | See `docs/PROJECT_PLAN.md` |

## Exact next checkpoint

Finish only **Checkpoint 3: early voice feasibility experiment**; do not start complaint logic yet.

The next human actions are intentionally small:

1. Create free/test Azure Speech and ElevenLabs resources if the team approves their terms; do not purchase a tier yet.
2. Put the three values named in `.env.example` into the ignored local `.env` file yourself; never paste them into chat or commit them.
3. Restart the API, open <http://localhost:5173/voice-lab>, allow microphone access, and run the seven synthetic prompts against both providers using the protocol in `docs/VOICE_FEASIBILITY.md`.
4. Share only the exported measurement JSON files, not raw audio or credentials, so results and the provider decision can be documented.

Checkpoint 3 remains deliberately unfinished until those measurements exist. Do not couple this lab to complaint logic, start Checkpoint 4, or report a provider winner before the data is collected.
