# Repository Working Agreement

These instructions apply to the entire repository. They are for human contributors and coding agents.

## Start every session here

1. Read `README.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/POLICIES.md`, and `docs/STATUS.md`.
2. Inspect `git status`, the current branch, and recent commits before editing.
3. Preserve unrelated work. Never discard or overwrite changes just to obtain a clean tree.
4. Select only the next incomplete checkpoint from `docs/STATUS.md`; do not build later checkpoints in the same uncontrolled pass.
5. Record material decisions, verification results, and the next action in `docs/STATUS.md` before ending the checkpoint.

## Delivery rules

- Work on a focused branch. Do not commit directly to `main` and do not merge a pull request automatically.
- Keep changes small, reviewable, and tied to a checkpoint acceptance criterion.
- Explain the goal, why it matters, what changed, what the student must do, and how completion was verified.
- Perform routine coding and checks directly. Ask only for a decision, credential, or access that is genuinely required.
- Never request secrets in chat or commit secrets. Use `.env.example` with placeholder names and keep `.env` ignored.
- Do not purchase services, deploy publicly, change repository visibility, or enable paid resources without explicit approval.
- Treat provider names, model names, prices, quotas, and API capabilities as time-sensitive. Verify them from current official documentation before implementation.
- Prefer free/local test doubles for automated tests. Hosted APIs must be behind interfaces and disabled by default in tests.

## Architecture invariants

- The durable database is the source of truth for cases, evidence, action attempts, business records, and event history.
- Agent output is untrusted input. Validate it against typed schemas before using it.
- An LLM may recommend or summarize; it must never authorize a financial, inventory, shipment, or case-state mutation.
- Policy eligibility and action authorization belong to deterministic Python code using versioned policy configuration.
- Every mutating departmental operation requires an idempotency key. Database uniqueness constraints are the final defense against duplicate refunds, replacements, reservations, or shipments.
- A duplicate complaint is identified by order plus issue identity, not by order alone. Different issues on one order remain distinct cases.
- Before retrying an uncertain external action, query its status with the same idempotency key. Use bounded retries and record every attempt.
- Compensation is an explicit forward action. Never describe an irreversible completed action as rolled back.
- Departmental roles receive least-privilege tools. Do not expose another department's mutation tools through prompts or a shared unrestricted toolbox.
- Store immutable event history alongside current-state projections. State transitions must be validated and auditable.
- Escalation is valid at any workflow stage. A request for a human, repeated speech failure, conflicting critical evidence, policy exception, or exhausted retry budget must be representable as a structured reason.

## Contracts and code organization

- Keep shared API/event schemas versioned and independent of prompts.
- Use explicit identifiers (`case_id`, `order_id`, `issue_fingerprint`, `action_id`, `idempotency_key`, `policy_version`, `correlation_id`).
- Represent money as integer minor units plus ISO currency, never binary floating point.
- Store timestamps in UTC and localize only at presentation boundaries.
- Keep domain logic separate from FastAPI routes, workflow orchestration, provider adapters, and UI components.
- Any workflow node must be safe to resume after process restart.
- Add database migrations for schema changes; do not rely on ORM auto-create outside disposable tests.
- English is the canonical language for code identifiers and internal enums. User-facing text must support Arabic right-to-left rendering and English.

## Verification expectations

For code checkpoints, run the narrowest relevant checks and then the project-wide checks defined by the repository. The foundation checkpoint should establish formatting, linting, type checking, unit/API tests, migration checks, and frontend tests.

Tests must cover happy paths and invariants, including:

- duplicate and concurrent complaint submissions;
- duplicate action attempts;
- distinct issues on the same order;
- restart/resume from persisted state;
- policy denial and exception escalation;
- conflicting evidence;
- bounded retries with an uncertain outcome check;
- replacement reservation compensation when shipment creation fails;
- unauthorized cross-department tool access;
- Arabic, English, and mixed-language critical-field handling.

Do not claim a check passed unless it was actually run. Record skipped checks and why in `docs/STATUS.md` or the pull request.

## Documentation maintenance

- Keep `docs/ARCHITECTURE.md` aligned with implemented boundaries and contracts.
- Keep all store policies labeled **DRAFT / FICTIONAL** until the team explicitly approves a version.
- When a policy changes, create a new policy version; existing decisions retain the version used at decision time.
- Update `docs/PROJECT_PLAN.md` when scope or dates change, and note why.
- Update `docs/STATUS.md` at every checkpoint with completed acceptance criteria, evidence, blockers, and exactly one next checkpoint.
