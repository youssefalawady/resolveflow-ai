# Architecture

## Status

The Checkpoint 2 foundation is implemented: Docker Compose runs PostgreSQL 17, a Python 3.12/FastAPI service, and a Node 24/React service; Alembic owns schema migrations, both applications have automated quality checks, and GitHub Actions mirrors them. The complaint domain, agent workflow, voice layer, provider adapters, and staff/customer features below remain proposed until their checkpoints. Technology/provider details must still be validated against current official documentation before each integration.

## Design goals

- Resolve complaints correctly in Arabic or English while preserving customer control.
- Demonstrate meaningful cooperation among specialized roles with enforced tool boundaries.
- Make business truth durable, auditable, idempotent, and recoverable after restart.
- Keep policy and mutation authorization deterministic.
- Support a real human takeover of a browser voice session.
- Produce reproducible evaluation evidence rather than relying on conversation quality alone.

## System context

```text
Customer browser ─┐                         ┌─ Staff dashboard
                  ├─ Realtime/voice layer ──┤
                  │                         └─ Human takeover
                  v
            FastAPI application
                  │
       Complaint workflow/coordinator
        │       │       │       │
      Order  Warehouse Finance Policy ... departmental ports
        │       │       │       │
        └──── simulated service adapters ───┐
                                            v
                                      PostgreSQL
                           cases + business state + event history
```

External services are adapters at the edge: a realtime transport (provisionally LiveKit), speech-to-text, text-to-speech, and one structured-output LLM. The core domain, policies, and tests must not depend directly on a provider SDK.

## Provisional deployable components

### Web client

One React codebase may provide role-specific routes:

- customer call page with language selection, microphone consent/status, transcript confirmation, correction, and handoff state;
- staff case dashboard with evidence, structured findings, decisions, actions, and history;
- human takeover controls for accepting and joining a live session;
- development-only scenario seed/reset/failure controls.

Arabic layouts must support RTL without reversing identifiers, numbers, or timelines incorrectly. Accessibility, keyboard operation, and clear recording/AI disclosure are part of the surface, not late polish.

### API and domain application

FastAPI is the HTTP/WebSocket boundary. Route handlers authenticate/validate and call application services; they do not contain policy or orchestration logic. Application services enforce commands, transactions, authorization, and state transitions.

Suggested modules (names may change during implementation):

```text
apps/api/            HTTP and realtime endpoints
apps/web/            React client
src/resolveflow/
  domain/            entities, value objects, invariants, state machine
  application/       commands, queries, use cases, transactions
  policies/          YAML schema, loader, deterministic evaluation
  workflow/          LangGraph nodes, routing, persistence adapter
  departments/       least-privilege ports and simulated adapters
  agents/            role prompts, structured-output adapters
  voice/             session state, STT/TTS/VAD/provider ports
  infrastructure/    database, provider SDKs, telemetry
tests/                unit, integration, contract, scenario, evaluation
```

### Workflow runtime

LangGraph is the provisional coordinator for durable graph execution. Before relying on it, the team must verify its current checkpointing, async, interruption, and persistence APIs. Workflow state is a projection/reference set; PostgreSQL domain records remain authoritative.

Logical roles:

| Role | Responsibility | Allowed capabilities (conceptual) |
|---|---|---|
| Intake | collect language, issue, identity, order reference, confirmations | create/update intake facts; no business mutation |
| Case coordinator | plan investigations, reconcile structured findings, route workflow | read case/evidence/findings; request departmental operations; no direct refund/stock mutation |
| Order investigator | establish order/item/fulfilment facts | order reads only |
| Warehouse | report stock/pick/packing evidence and execute authorized reservation operations | warehouse reads; authorized reserve/release only |
| Finance | report payment/refund evidence and execute authorized financial operations | finance reads; authorized refund/credit only |
| Policy checker | evaluate versioned policy and return eligibility/reasons/limits | policy evaluation only; no mutation |
| Escalation | package context, reason, priority, and handoff request | create/route escalation; no remedy authorization |

Roles exchange validated findings; they do not pass free-form text as business authority. Multiple roles may use one underlying model while retaining separate prompts, allowed schemas, and tool registries.

## Workflow and states

Top-level phases are `INTAKE`, `INVESTIGATE`, `RECONCILE`, `PROPOSE`, `AWAITING_AGREEMENT`, `EXECUTE`, `RESOLVED`, and `ESCALATED`. `FAILED_RETRYABLE` or waiting states may exist internally, but failure must not erase the last durable phase.

Important transitions:

- Intake can escalate immediately on customer request or safety/identity constraints.
- Reconcile can route back to investigation with explicit missing/conflicting evidence requirements.
- Propose stores the policy decision and proposed actions before customer-facing output.
- Customer agreement is a timestamped event referencing the exact proposal version.
- Execute revalidates authorization and current preconditions; it does not trust an earlier agent sentence.
- Any phase can escalate with a structured reason and evidence snapshot.
- Resolved and escalated are terminal for that workflow run, but a new linked issue/case can be opened later.

Only application services may transition case state. An optimistic version column prevents two workers from silently overwriting a case.

## Shared conceptual contracts

These are language-neutral contracts to stabilize the next checkpoint; implementation will use typed Python and generated/parallel TypeScript schemas.

### Case and issue identity

- `case_id`: immutable UUID.
- `order_id`: confirmed external/business reference plus internal UUID where appropriate.
- `issue_type`: versioned enum such as damaged, missing_item, wrong_item, late, undelivered, duplicate_charge, or other.
- `issue_fingerprint`: deterministic versioned hash over normalized order, affected line(s), issue type, and material incident facts. It deduplicates the same complaint, not all complaints for an order.
- `related_case_id`: link for follow-up, suspected duplicate, or separate issue.
- `state`, `state_version`, `language`, `customer_id`, `created_at`, `updated_at`.

Fingerprint computation must be versioned. A unique constraint can apply to active/canonical issues while a submission table records every attempt and links duplicates to the existing case.

### Evidence

- `evidence_id`, `case_id`, `kind`, `source_system`, `source_record_id`.
- `observed_at`, `collected_at`, `payload_schema_version`, validated `payload`.
- `confidence` only where meaningful; never substitute model confidence for source reliability.
- provenance/correlation fields and a content hash for tamper/deduplication support.

Evidence is append-oriented. Corrections supersede prior entries rather than silently rewriting history.

### Agent finding

- `finding_id`, `case_id`, `role`, `finding_type`, `schema_version`.
- references to evidence IDs, structured facts, missing evidence, conflicts, and recommended next queries.
- model/provider/configuration trace reference, timestamps, latency, and validation outcome.

A finding is advisory. It cannot itself authorize a mutation.

### Policy decision and proposal

- `decision_id`, `case_id`, `policy_version`, `input_evidence_ids`, decision time.
- `eligible`, machine-readable reason codes, permitted remedy types, limits, required approvals, and exceptions.
- `proposal_id`, version, customer-facing localized summary, exact proposed actions, expiry/preconditions.
- agreement record with actor, channel, timestamp, proposal version, and confirmation text/reference.

### Action request and attempt

- `action_id`: stable logical action.
- `idempotency_key`: unique per intended business effect, derived/stored before execution.
- `case_id`, `decision_id`, `proposal_id`, `action_type`, validated parameters.
- states such as `PLANNED`, `AUTHORIZED`, `IN_PROGRESS`, `SUCCEEDED`, `FAILED_KNOWN`, `OUTCOME_UNKNOWN`, `COMPENSATION_REQUIRED`, and `COMPENSATED`.
- attempt number, provider/business reference, request/response hashes, timestamps, and error classification.

Amounts use integer minor units plus ISO currency. Mutations require the expected aggregate version and execute through a departmental port.

### Domain event

- `event_id`, `case_id`, monotonically ordered case sequence, `event_type`, `schema_version`.
- actor type/id, correlation/causation IDs, occurred/recorded timestamps, and validated payload.

Events form an immutable audit trail. Current tables provide efficient projections. A transactional outbox will be used if/when events must leave the database transaction; Redis is not assumed.

## Persistence model

PostgreSQL is the source of truth. Expected table groups:

- business simulation: customers, orders, order_lines, payments, refunds, inventory_items, stock_reservations, deliveries, shipments;
- complaint domain: complaint_submissions, cases, case_issues, evidence, findings, policy_decisions, proposals, agreements, escalations;
- execution: actions, action_attempts, compensations;
- audit/runtime: case_events, workflow_checkpoints or references, outbox, voice_sessions, staff_assignments.

Constraints should express invariants wherever possible: unique refund/replacement business keys, one active reservation for a logical replacement, positive quantities, valid monetary currency, unique case event sequence, one active staff claim, and referential links to the authorizing decision/proposal.

Database transactions protect local state. Calls to an external/simulated service use a durable intent/action record, idempotency key, and status reconciliation rather than pretending a distributed transaction exists.

## Reliability model

### Idempotency and concurrency

1. Persist the logical action and unique idempotency key before attempting it.
2. Claim work atomically (`SELECT … FOR UPDATE SKIP LOCKED` or an equivalent lease).
3. The departmental service enforces its own unique business key, independent of the workflow.
4. On timeout/disconnect, mark outcome unknown.
5. Query action status by idempotency key before any retry.
6. Retry only classified transient failures, with bounded attempts and backoff.
7. Record every attempt and final reconciliation result.

The same approach applies to concurrent complaint submission: compute a versioned issue identity inside a transaction, rely on a database uniqueness constraint, and return/link the winning case after a conflict.

### Compensation example

Replacement execution is a saga:

1. authorize replacement from the recorded policy decision;
2. reserve stock idempotently;
3. create shipment idempotently;
4. if shipment creation is a known final failure, issue an explicit release-reservation compensation;
5. if shipment outcome is unknown, check shipment status before releasing stock or retrying;
6. record the reservation, shipment attempt, and release as separate immutable actions/events.

A successful refund or dispatched shipment is not described as undone. Remediation becomes a new authorized action or an escalation.

### Restart recovery

Each workflow node persists inputs/results or references before advancing. On startup, a worker finds nonterminal cases/actions whose leases expired, reconciles any `OUTCOME_UNKNOWN` operation, then resumes from the last valid checkpoint. Provider conversation memory is never the only copy of essential case state.

## Voice and human takeover

The realtime layer manages media/session transport; the complaint engine receives confirmed text/events through a provider-neutral interface. Provisional components are LiveKit for browser sessions, a measured streaming speech recognizer, ElevenLabs for TTS, and Silero VAD/interruption logic. Their precise compatibility and current APIs are unverified until checkpoint 3.

Voice session state tracks participant, selected/detected language, partial/final transcript, critical-field confirmation, recognition-failure count, speaking/listening/interrupted status, and associated `case_id`. A correction produces a new confirmed fact and supersession event.

Handoff triggers include an explicit human request, two failed recognition attempts for a required field, policy exception, identity/authorization failure, critical conflicting evidence, exhausted retry budget, and system/provider failure. Handoff creates a durable escalation, exposes the queue item to staff, and allows a staff participant to claim and join the same session. The UI must visibly indicate when a human has control.

## Security, privacy, and observability

- Authenticate staff and authorize by role; customer identity verification rules remain a project decision.
- Minimize personal data and redact secrets/tokens from prompts, logs, traces, and screenshots.
- Store raw audio only with a documented purpose and consent; the feasibility test should prefer synthetic/team-consented data and avoid committing recordings.
- Separate development controls and seeded fictional data from any deployed mode.
- Log structured correlation IDs, workflow/node timing, tool calls, policy reason codes, action status, and handoff timing.
- Record model/provider/configuration versions for reproducibility, but never credentials.
- Define retention and deletion behavior before collecting real personal or audio data.

## Key architecture decisions still open

The following require measured evidence or team confirmation, not guesswork:

- speech-to-text provider and language-routing strategy;
- hosted LLM/provider/model and cost/latency budget;
- exact LiveKit deployment/managed-service choice and takeover mechanics;
- authentication and customer identity verification appropriate for the demo;
- retention of transcripts/audio;
- whether LangGraph persistence meets recovery needs directly or should wrap a custom domain checkpoint store;
- whether Redis is justified by realtime presence/queueing after PostgreSQL-based options are tested.
