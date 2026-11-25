# Project Plan

## Planning basis

This plan targets a four-person Computer Science team and a demonstrable university submission in four weeks. The working dates are **25 November–22 December 2026**; they are provisional until the university deadline is confirmed. The plan protects the core assessed value—multi-agent cooperation, durable actions, reliability, and evaluation—before optional polish.

The team should assign one owner to each active workstream while requiring review by a second person. Suggested ownership rotates across backend/domain, agents/evaluation, voice/realtime, and frontend/operations so knowledge is shared.

## Definition of done for every checkpoint

A checkpoint is complete only when its acceptance criteria are demonstrated, relevant automated checks pass, documentation reflects the implementation, and `docs/STATUS.md` names the next checkpoint. A UI mock, prompt response, or successful HTTP status alone is not evidence that a durable business action occurred.

## Checkpoint plan and acceptance criteria

### 1. Repository documentation and shared contracts

**Goal:** establish a truthful baseline and agreed boundaries before code diverges.

Acceptance criteria:

- Repository state, branches, remotes, and available local runtimes are inspected and recorded.
- `README.md`, `AGENTS.md`, and the four documents under `docs/` describe scope, architecture, draft policies, plan, and current status.
- The complete development sequence and four-week target are recorded.
- Core identifiers, workflow states, findings, decisions, action records, and events have agreed conceptual contracts.
- Store policies are clearly labeled draft and fictional.
- Work is isolated on a setup branch; a pull request is prepared if GitHub authentication permits.

### 2. Development environment and minimal application foundation

**Goal:** give all four team members one reproducible command path to a tested skeleton.

Acceptance criteria:

- Docker Compose starts PostgreSQL, backend, and frontend with health checks.
- FastAPI exposes `/health/live` and `/health/ready`; React renders a basic status page.
- A migration tool creates the initial schema; a clean database can migrate up from zero.
- Configuration is typed, `.env.example` contains placeholders only, and secrets remain ignored.
- Formatting, linting, type checking, unit/API tests, and frontend tests run via documented commands.
- CI runs the same non-hosted checks on a pull request.
- The README includes exact setup, start, test, stop, and reset commands for Windows/macOS/Linux where they differ.

### 3. Early voice feasibility experiment

**Goal:** reduce the largest integration risk without coupling voice to unfinished complaint logic.

Acceptance criteria:

- A disposable browser experiment captures microphone audio and supports a short two-way session.
- Current official documentation and pricing/limits are checked for LiveKit, the selected speech-to-text candidates, and ElevenLabs before credentials or paid tiers are chosen.
- The same small, consented test set covers Modern Standard Arabic, Egyptian Arabic, English, mixed-language turns, order numbers, interruption, and correction.
- Azure speech recognition and the viable streaming alternative are compared using the same clips/utterances, measuring critical-field accuracy and partial/final latency.
- Two failed recognition attempts produce a structured handoff event in the experiment.
- Findings, raw measurements, limitations, and the provider decision are documented; no secret or raw personal recording is committed.

### 4. Fictional policies, seeded data, and departmental APIs

**Goal:** create deterministic business truth and enforce departmental boundaries before adding agents.

Acceptance criteria:

- Versioned YAML policy is loaded and validated by deterministic Python.
- PostgreSQL stores customers, orders/items, payments/refunds, inventory/reservations, deliveries/shipments, cases, issues, evidence, action attempts, and events.
- Seed/reset commands create named deterministic scenarios in development/test only.
- Separate order, warehouse, finance, policy, and delivery interfaces expose least-privilege reads/mutations.
- Mutations persist, require idempotency keys, and are protected by uniqueness/check constraints.
- Unauthorized cross-department calls and invalid state transitions are rejected and tested.
- Failure injection supports timeout, known failure, and uncertain outcome without entering production configuration.

### 5. One complete complaint flow through text

**Goal:** prove the vertical slice before multiplying agents and scenarios.

Acceptance criteria:

- A damaged-order complaint moves through intake, investigation, reconciliation, proposal, agreement, execution, and resolution using a text API/UI.
- Critical fields are confirmed before investigation and customer agreement is recorded when required.
- Evidence, findings, policy decision, proposal, action attempts, and immutable events persist with correlation and policy version.
- A restart between workflow nodes resumes the same case without repeating a completed action.
- The final database state—not only the conversational answer—matches the expected outcome.
- A staff-readable trace explains which deterministic rules authorized or denied each action.

### 6. Departmental agent cooperation

**Goal:** demonstrate adaptive, structured collaboration rather than one monolithic prompt.

Acceptance criteria:

- The seven logical roles exchange schema-validated findings through the coordinator.
- Each role can access only its approved tools; tests prove the boundaries.
- The coordinator requests further investigation when evidence is missing or conflicting.
- Several independent read investigations can run concurrently while mutations remain serialized and authorized.
- LLM/provider adapters support structured output, timeout, bounded retry, and a deterministic test double.
- Traces show role, input references, output schema version, latency, and errors without exposing secrets or unnecessary personal data.

### 7. Remaining scenarios and reliability protections

**Goal:** make the complaint engine correct under the required edge cases.

Acceptance criteria:

- Automated scenarios cover missing/wrong item, late/undelivered order, out-of-window refund, duplicate complaints (including concurrent requests), policy exception, conflicting evidence, and failure midway.
- Issue fingerprints deduplicate the same complaint while permitting a different issue on the same order.
- Concurrent submissions and actions result in one durable remedy.
- Uncertain outcomes are checked by idempotency key before bounded retry.
- The compensation scenario reserves replacement stock, injects shipment failure, releases the reservation, and records both actions.
- Irreversible completed actions remain recorded and lead to follow-up/escalation rather than false rollback.
- Recovery tests restart the process at representative persisted states.

### 8. Full voice integration

**Goal:** connect the proven complaint engine to a usable bilingual browser call.

Acceptance criteria:

- Browser sessions support Arabic/Egyptian Arabic, English, and mixed-language turns with visible consent/status.
- Spoken order numbers are read back and explicitly confirmed or corrected.
- Voice activity detection and interruption stop queued/current speech promptly without corrupting case state.
- Two failed critical-field recognition attempts initiate handoff; the customer can request a person at any time.
- Voice sessions reconnect or fail safely, preserve the case, and expose latency/error metrics.
- Provider failures cannot bypass policy authorization or directly mutate business state.

### 9. Staff dashboard and human takeover

**Goal:** make escalation operational and observable, not merely conversational.

Acceptance criteria:

- Authorized staff can view queue, case summary, evidence, findings, policy decisions, proposals, actions, and complete event history.
- A staff member can accept a handoff, join/take control of the live browser session, exchange messages/audio, and close or return the case.
- Ownership uses an atomic claim/lease so two staff members cannot control the same case accidentally.
- Customer and staff UIs clearly show automation versus human control.
- Development-only seed/reset/failure controls are protected and absent or disabled in production mode.
- Sensitive values are minimized and access/audit events are recorded.

### 10. Evaluation, deployment, documentation, and rehearsal

**Goal:** produce reproducible evidence for the university assessment.

Acceptance criteria:

- Approximately 20 underlying scenarios have Arabic and English variants (about 40 cases) with versioned initial state and expected outcome.
- The agentic system and a fixed-workflow baseline use the same policies, departmental tools, provider settings where applicable, and initial data.
- The harness measures correct resolution/final database state, policy violations, duplicate actions, completion time, voice-response delay, appropriate escalation, and speech/critical-field accuracy.
- Results include denominators, failures, variance where useful, and limitations; no unmeasured claim is presented as a result.
- A repeatable deployment is documented and smoke-tested without making it public unless explicitly approved.
- Architecture, setup, operator guide, demo script, fallback recording plan, and contribution evidence are complete.
- The team rehearses required scenarios plus one injected failure and one live handoff within the presentation time limit.

## Four-week target

| Week | Dates (provisional) | Primary checkpoints | Demonstrable outcome |
|---|---|---|---|
| 1 | 25 Nov–1 Dec | 1, 2, start 3 | Documented scope, reproducible skeleton, initial voice-risk data |
| 2 | 2–8 Dec | finish 3, 4, 5 | Deterministic services and one durable end-to-end text flow |
| 3 | 9–15 Dec | 6, 7, start 8 | Cooperative roles plus tested reliability scenarios |
| 4 | 16–22 Dec | finish 8, 9, 10 | Voice call, real takeover, measured evaluation, rehearsed demo |

Suggested internal gates:

- **1 December:** freeze foundation contracts and choose the voice direction based on measured feasibility.
- **8 December:** feature-complete text vertical slice; do not let dashboard styling displace reliability work.
- **15 December:** complaint engine scenario-complete; reduce scope if voice integration still threatens the demo.
- **19 December:** feature freeze for evaluation, documentation, bug fixes, and rehearsal.
- **22 December:** target submission-ready build, subject to the confirmed university deadline.

## Scope protection and fallbacks

The required core is a durable text complaint engine with structured agent cooperation, policy enforcement, reliability evidence, bilingual browser voice, and real staff takeover. Optional items include Egyptian telephone-network calling, a native mobile application, Redis, sophisticated visual polish, and additional providers. They must not consume time before the core acceptance criteria pass.

If hosted speech or realtime integration is blocked, preserve the browser-call interface and demonstrate the complaint engine with the best measured provider or a clearly disclosed push-to-talk fallback. If an LLM provider is unavailable, the deterministic test adapter must still run the scenario suite; this is a resilience path, not a substitute for the final agent demonstration.

## Evaluation design

Each underlying scenario is a versioned fixture containing initial database state, customer facts, permitted evidence, injected failures, expected policy decision, allowed remedies, expected final state, and whether escalation is appropriate. Arabic and English utterance variants reference the same fixture so language does not change business truth.

The fixed baseline follows a predefined investigation sequence and deterministic branching. The agentic system may select tools adaptively. Both receive identical tools, policies, seeded state, retry limits, and success criteria. Run order should be randomized where provider conditions could bias one system; record provider/model/configuration versions and separate text-engine time from voice latency.

Primary metrics:

- exact and partial match of expected final database state;
- correct resolution and appropriate escalation rate;
- count and severity of policy violations;
- duplicate financial/inventory/shipment actions;
- end-to-end completion time and time by workflow phase;
- speech partial/final latency and response-start latency;
- word/field accuracy, with critical order/item/amount fields reported separately.

All results must distinguish simulated components from hosted ones and include failed runs.
